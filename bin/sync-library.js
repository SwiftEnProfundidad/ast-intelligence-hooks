#!/usr/bin/env node
/**
 * CLI para sincronización de librería
 * @pumuki/ast-intelligence-hooks
 */

const LibrarySyncService = require('../infrastructure/sync/LibrarySyncService');
const path = require('path');

const args = process.argv.slice(2);

const config = {
  libraryPath: process.env.AST_HOOKS_LIBRARY_PATH,
  projectPath: process.cwd(),
  strategy: 'pull',
  conflictResolver: 'library-wins',
  backupEnabled: true,
  dryRun: false
};

for (let i = 0; i < args.length; i++) {
  const arg = args[i];
  
  switch (arg) {
    case '--library':
    case '-l':
      config.libraryPath = args[++i];
      break;
    
    case '--project':
    case '-p':
      config.projectPath = args[++i];
      break;
    
    case '--strategy':
    case '-s':
      config.strategy = args[++i];
      break;
    
    case '--resolver':
    case '-r':
      config.conflictResolver = args[++i];
      break;
    
    case '--dry-run':
    case '-d':
      config.dryRun = true;
      break;
    
    case '--no-backup':
      config.backupEnabled = false;
      break;
    
    case '--help':
    case '-h':
      console.log(`
╔════════════════════════════════════════════════════════════════╗
║           @pumuki/ast-intelligence-hooks - Sync Tool          ║
╚════════════════════════════════════════════════════════════════╝

Sincroniza cambios entre la librería maestra y proyectos consumidores.

USAGE:
  sync-library [options]

OPTIONS:
  -l, --library <path>      Ruta a la librería maestra
                           (default: $AST_HOOKS_LIBRARY_PATH)
  
  -p, --project <path>      Ruta al proyecto destino
                           (default: current directory)
  
  -s, --strategy <type>     Estrategia de sincronización:
                           - pull: Solo traer cambios de librería
                           - push: Solo enviar cambios a librería
                           - merge: Sincronización bidireccional
                           (default: pull)
  
  -r, --resolver <type>     Resolución de conflictos:
                           - library-wins: Librería tiene prioridad
                           - project-wins: Proyecto tiene prioridad
                           - newest-wins: Usa el archivo más reciente
                           - manual: Requiere resolución manual
                           (default: library-wins)
  
  -d, --dry-run            Simula cambios sin aplicarlos
  
  --no-backup              No crear backup antes de sincronizar
  
  -h, --help               Muestra esta ayuda

EXAMPLES:
  # Sincronización básica (pull)
  sync-library
  
  # Dry-run para ver qué cambiaría
  sync-library --dry-run
  
  # Usar archivo más reciente en conflictos
  sync-library --resolver newest-wins
  
  # Sincronización bidireccional
  sync-library --strategy merge

ENVIRONMENT:
  AST_HOOKS_LIBRARY_PATH   Ruta a la librería maestra
                          (e.g., ~/Libraries/ast-intelligence-hooks)
`);
      process.exit(0);
  }
}

console.log(`
╔════════════════════════════════════════════════════════════════╗
║           @pumuki/ast-intelligence-hooks - Sync Tool          ║
╚════════════════════════════════════════════════════════════════╝
`);

const syncService = new LibrarySyncService(config);

const result = syncService.sync();

if (result.success) {
  console.log('\n✅ Sync completed successfully!\n');
  console.log('Stats:');
  console.log(`  Files checked: ${result.stats.filesChecked}`);
  console.log(`  Files updated: ${result.stats.filesUpdated}`);
  console.log(`  Files copied: ${result.stats.filesCopied}`);
  console.log(`  Files skipped: ${result.stats.filesSkipped}`);
  console.log(`  Conflicts detected: ${result.stats.conflictsDetected}`);
  console.log(`  Conflicts resolved: ${result.stats.conflictsResolved}`);
  
  if (result.backup) {
    console.log(`\n💾 Backup created: ${result.backup}`);
  }
  
  if (result.conflicts.length > 0) {
    console.log(`\n⚠️  ${result.conflicts.length} conflicts were resolved`);
  }
  
  process.exit(0);
} else {
  console.error('\n❌ Sync failed!\n');
  console.error(`Error: ${result.error}`);
  
  if (result.log && result.log.length > 0) {
    console.error('\nLog:');
    result.log.forEach(entry => {
      if (entry.level === 'error') {
        console.error(`  [ERROR] ${entry.message}`);
      }
    });
  }
  
  process.exit(1);
}
