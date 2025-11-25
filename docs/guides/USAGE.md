# Scripts para Ejecutar el Hook de Auditoría

## 🚀 Ejecución Rápida

### Opción 1: Script en la raíz (más fácil)
```bash
./audit.sh
```

### Opción 2: Desde la ruta completa
```bash
./scripts/hooks-system/presentation/cli/audit.sh
```

### Opción 3: Con bash explícito
```bash
bash scripts/hooks-system/presentation/cli/audit.sh
```

## 📋 Opciones del Menú

Al ejecutar el script, verás un menú interactivo con:

1. **Full audit** - Auditoría completa (Patterns + ESLint + AST)
2. **Pattern checks** - Solo checks de patrones
3. **ESLint Admin+Web** - Solo ESLint
4. **AST Intelligence** - Solo análisis AST
5. **Export Markdown** - Exportar reporte en Markdown
6. **Exit** - Salir

## 🔧 Ejecución en CI/CD (no interactivo)

Si necesitas ejecutar en modo no interactivo (CI/CD), puedes crear un wrapper:

```bash
# Ejemplo: Ejecutar auditoría completa sin menú
AUDIT_STRICT=1 bash scripts/hooks-system/presentation/cli/audit.sh <<< "1"
```

## 📝 Alias útil (opcional)

Puedes agregar este alias a tu `~/.bashrc` o `~/.zshrc`:

```bash
alias audit="./scripts/hooks-system/presentation/cli/audit.sh"
```

Luego simplemente ejecuta:
```bash
audit
```

