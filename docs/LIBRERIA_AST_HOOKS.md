# 📦 AST Intelligence Hooks - Librería Independiente

**Ubicación de la Librería**: `/Users/juancarlosmerlosalbarracin/Libraries/ast-intelligence-hooks/`  
**Versión**: v3.2.0  
**Estado**: ✅ Independiente y reutilizable

---

## 🎯 QUÉ ES

El sistema **hooks-system** ha sido extraído a una **librería independiente** para:

- ✅ Reutilizarse en múltiples proyectos
- ✅ Mantenerse en un solo lugar
- ✅ Versionarse independientemente
- ✅ Publicarse a npm (opcional)

---

## 📁 UBICACIONES

### Librería Independiente (Source of Truth):
```
/Users/juancarlosmerlosalbarracin/Libraries/ast-intelligence-hooks/
```

### Uso en RuralGO (Este Proyecto):
```
/Users/juancarlosmerlosalbarracin/CascadeProjects/R_GO_local/scripts/hooks-system/
```

---

## 🔄 CÓMO ACTUALIZAR RURALGO CON LA LIBRERÍA

### Opción A: Symlink (Recomendado)

```bash
cd /Users/juancarlosmerlosalbarracin/CascadeProjects/R_GO_local

# Backup del actual
mv scripts/hooks-system scripts/hooks-system.backup

# Crear symlink a la librería
ln -s /Users/juancarlosmerlosalbarracin/Libraries/ast-intelligence-hooks scripts/hooks-system

# Verificar que funciona
bash scripts/hooks-system/presentation/cli/audit.sh
```

**Ventaja**: Cambios en la librería se reflejan automáticamente en RuralGO ✅

---

### Opción B: Git Submodule

```bash
cd /Users/juancarlosmerlosalbarracin/CascadeProjects/R_GO_local

# Remover actual
rm -rf scripts/hooks-system

# Añadir como submodule
git submodule add file:///Users/juancarlosmerlosalbarracin/Libraries/ast-intelligence-hooks scripts/hooks-system

# Actualizar
git submodule update --init --recursive
```

**Ventaja**: Versionado explícito, control total ✅

---

### Opción C: Copy (Independiente)

```bash
cd /Users/juancarlosmerlosalbarracin/CascadeProjects/R_GO_local

# Backup
mv scripts/hooks-system scripts/hooks-system.old

# Copiar
cp -r /Users/juancarlosmerlosalbarracin/Libraries/ast-intelligence-hooks scripts/hooks-system
```

**Ventaja**: RuralGO es independiente de cambios en la librería ✅

---

## 🚀 USAR EN NUEVOS PROYECTOS

### Proyecto iOS Nuevo:

```bash
mkdir ~/Projects/NuevoProyectoIOS
cd ~/Projects/NuevoProyectoIOS
git init

# Copiar librería
cp -r ~/Libraries/ast-intelligence-hooks scripts/hooks-system

# Instalar
node scripts/hooks-system/bin/install.js

# ¡Listo! 234+ reglas iOS activas
```

---

## 📝 MANTENER LA LIBRERÍA

### Hacer mejoras:

```bash
cd ~/Libraries/ast-intelligence-hooks

# Editar, añadir reglas, etc.
vim infrastructure/ast/ios/analyzers/iOSPerformanceRules.js

# Commit
git add -A
git commit -m "feat(ios): add new rule"

# Tag
git tag v3.2.1
```

### Proyectos se actualizan:

- **Si usas symlink**: Cambios automáticos ✅
- **Si usas submodule**: `git submodule update --remote`
- **Si es copia**: `cp -r ~/Libraries/ast-intelligence-hooks scripts/hooks-system`

---

## 🎯 PRÓXIMOS PASOS

1. **Decidir**: ¿Symlink, submodule o copy para RuralGO?
2. **Actualizar RuralGO** para consumir la librería
3. **Probar** que todo funciona igual
4. **(Opcional)** Publicar a npm para uso en otras máquinas

---

## 📚 DOCUMENTACIÓN

Todo está en la librería:

```
~/Libraries/ast-intelligence-hooks/
├── INSTRUCCIONES_PARA_CARLOS.md  ← Lee esto primero
├── README.md                      ← README profesional
├── docs/RESUMEN_PARA_CARLOS.md    ← Resumen completo
└── docs/guides/                   ← Guías de uso
```

---

**Sistema Extraído y Listo para Reutilización** ✅

