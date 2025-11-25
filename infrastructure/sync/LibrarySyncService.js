/**
 * Library Sync Service
 * @pumuki/ast-intelligence-hooks
 * 
 * Sincronización bidireccional entre la librería maestra y proyectos consumidores
 * 
 * Estrategias soportadas:
 * - pull: Solo traer cambios de la librería maestra
 * - push: Solo enviar cambios al proyecto
 * - merge: Sincronización bidireccional con resolución de conflictos
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class LibrarySyncService {
  constructor(config = {}) {
    this.libraryPath = config.libraryPath || process.env.AST_HOOKS_LIBRARY_PATH;
    this.projectPath = config.projectPath || process.cwd();
    this.strategy = config.strategy || 'pull';
    this.conflictResolver = config.conflictResolver || 'library-wins';
    this.backupEnabled = config.backupEnabled !== false;
    this.dryRun = config.dryRun || false;
    this.excludePatterns = config.excludePatterns || [
      '**/node_modules/**',
      '**/.git/**',
      '**/build/**',
      '**/dist/**',
      '**/.audit_tmp/**'
    ];
    
    this.syncLog = [];
    this.conflicts = [];
  }

  log(level, message, data = {}) {
    const entry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...data
    };
    this.syncLog.push(entry);
    
    if (level === 'error') {
      console.error(`[SYNC ERROR] ${message}`, data);
    } else if (level === 'warn') {
      console.warn(`[SYNC WARN] ${message}`, data);
    } else if (!this.dryRun) {
      console.log(`[SYNC] ${message}`, data);
    }
  }

  validatePaths() {
    if (!this.libraryPath) {
      throw new Error('Library path not configured. Set AST_HOOKS_LIBRARY_PATH environment variable.');
    }
    
    if (!fs.existsSync(this.libraryPath)) {
      throw new Error(`Library path does not exist: ${this.libraryPath}`);
    }
    
    if (!fs.existsSync(this.projectPath)) {
      throw new Error(`Project path does not exist: ${this.projectPath}`);
    }
    
    const libraryPackagePath = path.join(this.libraryPath, 'package.json');
    if (!fs.existsSync(libraryPackagePath)) {
      throw new Error(`Invalid library path (no package.json found): ${this.libraryPath}`);
    }
    
    const libraryPackage = JSON.parse(fs.readFileSync(libraryPackagePath, 'utf8'));
    if (libraryPackage.name !== '@pumuki/ast-intelligence-hooks') {
      throw new Error(`Library package.json has incorrect name: ${libraryPackage.name}`);
    }
    
    this.log('info', 'Paths validated', {
      library: this.libraryPath,
      project: this.projectPath,
      version: libraryPackage.version
    });
    
    return libraryPackage.version;
  }

  createBackup(targetPath) {
    if (!this.backupEnabled) {
      return null;
    }
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = `${targetPath}.backup-${timestamp}`;
    
    try {
      if (fs.existsSync(targetPath)) {
        execSync(`cp -R "${targetPath}" "${backupPath}"`, { encoding: 'utf8' });
        this.log('info', 'Backup created', { backup: backupPath });
        return backupPath;
      }
    } catch (error) {
      this.log('warn', 'Backup creation failed', { error: error.message });
    }
    
    return null;
  }

  detectConflicts(sourcePath, targetPath) {
    const conflicts = [];
    
    if (!fs.existsSync(sourcePath) || !fs.existsSync(targetPath)) {
      return conflicts;
    }
    
    try {
      const sourceStats = fs.statSync(sourcePath);
      const targetStats = fs.statSync(targetPath);
      
      if (sourceStats.isFile() && targetStats.isFile()) {
        const sourceContent = fs.readFileSync(sourcePath, 'utf8');
        const targetContent = fs.readFileSync(targetPath, 'utf8');
        
        if (sourceContent !== targetContent) {
          conflicts.push({
            type: 'content-mismatch',
            source: sourcePath,
            target: targetPath,
            sourceMtime: sourceStats.mtime,
            targetMtime: targetStats.mtime
          });
        }
      } else if (sourceStats.isDirectory() && targetStats.isDirectory()) {
        const sourceFiles = fs.readdirSync(sourcePath);
        const targetFiles = fs.readdirSync(targetPath);
        
        const allFiles = new Set([...sourceFiles, ...targetFiles]);
        
        for (const file of allFiles) {
          const srcFile = path.join(sourcePath, file);
          const tgtFile = path.join(targetPath, file);
          conflicts.push(...this.detectConflicts(srcFile, tgtFile));
        }
      }
    } catch (error) {
      this.log('warn', 'Conflict detection error', { error: error.message, source: sourcePath, target: targetPath });
    }
    
    return conflicts;
  }

  resolveConflict(conflict) {
    switch (this.conflictResolver) {
      case 'library-wins':
        return { action: 'use-source', path: conflict.source };
      
      case 'project-wins':
        return { action: 'use-target', path: conflict.target };
      
      case 'newest-wins':
        if (conflict.sourceMtime > conflict.targetMtime) {
          return { action: 'use-source', path: conflict.source };
        }
        return { action: 'use-target', path: conflict.target };
      
      case 'manual':
        return { action: 'skip', path: conflict.target, reason: 'Manual resolution required' };
      
      default:
        return { action: 'skip', path: conflict.target, reason: 'Unknown resolver' };
    }
  }

  sync() {
    try {
      const version = this.validatePaths();
      
      this.log('info', `Starting sync (${this.strategy})`, {
        version,
        dryRun: this.dryRun,
        conflictResolver: this.conflictResolver
      });
      
      const backup = this.createBackup(path.join(this.projectPath, 'scripts/hooks-system'));
      
      let stats = {
        filesChecked: 0,
        filesUpdated: 0,
        filesCopied: 0,
        filesSkipped: 0,
        conflictsDetected: 0,
        conflictsResolved: 0
      };
      
      if (this.strategy === 'pull' || this.strategy === 'merge') {
        stats = this.pullFromLibrary();
      }
      
      if (this.strategy === 'push' || this.strategy === 'merge') {
        const pushStats = this.pushToLibrary();
        stats.filesUpdated += pushStats.filesUpdated;
        stats.filesCopied += pushStats.filesCopied;
      }
      
      this.log('info', 'Sync completed', stats);
      
      return {
        success: true,
        version,
        backup,
        stats,
        conflicts: this.conflicts,
        log: this.syncLog
      };
      
    } catch (error) {
      this.log('error', 'Sync failed', { error: error.message, stack: error.stack });
      
      return {
        success: false,
        error: error.message,
        log: this.syncLog
      };
    }
  }

  pullFromLibrary() {
    const libraryHooksPath = path.join(this.libraryPath, 'scripts/hooks-system');
    const projectHooksPath = path.join(this.projectPath, 'scripts/hooks-system');
    
    if (!fs.existsSync(libraryHooksPath)) {
      throw new Error(`Library hooks path not found: ${libraryHooksPath}`);
    }
    
    const conflicts = this.detectConflicts(libraryHooksPath, projectHooksPath);
    
    this.conflicts = conflicts;
    
    const stats = {
      filesChecked: conflicts.length,
      filesUpdated: 0,
      filesCopied: 0,
      filesSkipped: 0,
      conflictsDetected: conflicts.length,
      conflictsResolved: 0
    };
    
    for (const conflict of conflicts) {
      const resolution = this.resolveConflict(conflict);
      
      if (resolution.action === 'use-source') {
        try {
          if (!this.dryRun) {
            const targetDir = path.dirname(conflict.target);
            if (!fs.existsSync(targetDir)) {
              fs.mkdirSync(targetDir, { recursive: true });
            }
            fs.copyFileSync(conflict.source, conflict.target);
          }
          
          stats.filesUpdated++;
          stats.conflictsResolved++;
          this.log('info', 'File updated from library', { file: conflict.target });
          
        } catch (error) {
          stats.filesSkipped++;
          this.log('error', 'File update failed', { file: conflict.target, error: error.message });
        }
      } else if (resolution.action === 'skip') {
        stats.filesSkipped++;
        this.log('warn', 'File skipped', { file: conflict.target, reason: resolution.reason });
      }
    }
    
    return stats;
  }

  pushToLibrary() {
    this.log('warn', 'Push strategy not yet implemented', { strategy: this.strategy });
    
    return {
      filesChecked: 0,
      filesUpdated: 0,
      filesCopied: 0,
      filesSkipped: 0
    };
  }

  getSyncReport() {
    return {
      log: this.syncLog,
      conflicts: this.conflicts,
      summary: {
        totalLogs: this.syncLog.length,
        errors: this.syncLog.filter(l => l.level === 'error').length,
        warnings: this.syncLog.filter(l => l.level === 'warn').length,
        conflicts: this.conflicts.length
      }
    };
  }
}

module.exports = LibrarySyncService;

