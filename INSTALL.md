# 🐈💚 AST Intelligence Hooks - Instalación

**Pumuki Team®** - Advanced Project Intelligence

## 📦 Contenido

```
@pumuki/ast-intelligence-hooks/
├── domain/          # Entities, rules, repository interfaces
├── application/     # Use cases and services
├── infrastructure/  # AST analyzers, Git, Shell, Watchdog
├── config/          # Default configurations
├── native/
│   ├── ios/         # Swift Package - CustomLintRules
│   └── android/     # Kotlin Detekt - custom-rules
└── presentation/    # CLIs
```

## 🚀 Instalación

### Opción 1: NPM Package (Recomendado)

```bash
npm install @pumuki/ast-intelligence-hooks
```

### Opción 2: Git Submodule

```bash
cd /path/to/project
git submodule add git@github.com:pumuki/ast-intelligence-hooks.git scripts/hooks-system
git submodule update --init --recursive
```

### Opción 3: NPM Link (Desarrollo)

```bash
# En la librería
cd ~/Libraries/ast-intelligence-hooks
npm link

# En tu proyecto
cd /path/to/project
npm link @pumuki/ast-intelligence-hooks
```

### Opción 4: Copia Manual

```bash
# Copiar librería
cp -r ~/Libraries/ast-intelligence-hooks /path/to/project/scripts/

# Instalar
cd /path/to/project
bash scripts/ast-intelligence-hooks/bin/install.js
```

## 📱 Plataformas

### iOS:
```bash
# CustomLintRules en native/ios/
# Integrar en Xcode proyecto
```

### Android:
```bash
# custom-rules en native/android/
# Integrar en build.gradle.kts
```

### Frontend/Backend:
```bash
npm run lint
```

## 🔄 Sincronización con Librería Maestra

Si desarrollas mejoras en la librería maestra y quieres sincronizarlas con tus proyectos:

### Configuración inicial:

```bash
# Configura la ruta de la librería maestra
export AST_HOOKS_LIBRARY_PATH=~/Libraries/ast-intelligence-hooks

# Añade al .zshrc o .bashrc para persistencia
echo 'export AST_HOOKS_LIBRARY_PATH=~/Libraries/ast-intelligence-hooks' >> ~/.zshrc
```

### Uso del CLI de sincronización:

```bash
# Sincronización básica (pull) - Trae cambios de la librería maestra
npx ast-sync

# Ver qué cambiaría sin aplicar (dry-run)
npx ast-sync --dry-run

# Usar archivo más reciente en conflictos
npx ast-sync --resolver newest-wins

# Sincronización bidireccional (pull + push)
npx ast-sync --strategy merge

# Sin crear backup
npx ast-sync --no-backup
```

### Opciones de sincronización:

- **Estrategias**:
  - `pull`: Solo trae cambios de la librería (por defecto)
  - `push`: Solo envía cambios a la librería
  - `merge`: Sincronización bidireccional

- **Resolución de conflictos**:
  - `library-wins`: La librería tiene prioridad (por defecto)
  - `project-wins`: El proyecto tiene prioridad
  - `newest-wins`: Usa el archivo más reciente
  - `manual`: Requiere resolución manual

### Ejemplo completo:

```bash
cd /path/to/proyecto
export AST_HOOKS_LIBRARY_PATH=~/Libraries/ast-intelligence-hooks
npx ast-sync --strategy pull --resolver library-wins --dry-run
```

---

**Pumuki Team®**

