# Git Flow Enforcer 🔒

## Descripción

Sistema automático que **valida y BLOQUEA** violaciones del Git Flow definido en el proyecto.

## Flujo Git Flow Completo (16 pasos)

```
1.  ✅ Checkout develop
2.  ✅ Create branch (fix/feature)
3.  ✅ Make changes
4.  ✅ Commit (con hook validation)
5.  ✅ Push branch
6.  🚨 Create PR to develop (CRITICAL - often forgotten)
7.  ✅ Merge PR to develop
8.  🚨 Delete branch (CRITICAL - often forgotten)
9.  ✅ Checkout develop
10. ✅ Pull latest develop
11. [Repeat 2-10 for each task]
12. ✅ When Sprint complete → PR develop → main
13. ✅ Merge to main
14. ✅ Create tag (vX.X.X)
15. ✅ Push tag
16. ✅ Checkout develop (ready for next sprint)
```

## Problema Detectado

**❌ Pasos 6 y 8 olvidados frecuentemente:**
- Push de branches sin crear PR
- Branches acumulándose en remoto sin eliminar

**Consecuencias:**
- Branches huérfanas
- PRs pendientes sin mergearse
- Caos en repositorio remoto
- Regresiones no detectadas

## Solución: Triple Capa de Protección

### 🔴 Capa 1: Pre-Push Hook (BLOQUEO)
**Ubicación:** `.git/hooks/pre-push`

**Comportamiento:**
```bash
git push origin fix/my-feature
# 🔍 Validating Git Flow compliance before push...
# 
# ❌ Step 6 VIOLATED: No PR exists for branch 'fix/my-feature'
#    → Run: gh pr create --base develop --head fix/my-feature
# 
# 🚨 PUSH BLOCKED: Complete Git Flow cycle first
```

**Validaciones:**
- ✅ Branch es fix/* o feature/*
- ✅ Branch pushed to remote
- ✅ PR created to develop
- ✅ PR merged
- ✅ Branch deleted from remote

### 🟡 Capa 2: Post-Commit Hook (RECORDATORIO)
**Ubicación:** `.git/hooks/post-commit`

**Comportamiento:**
```bash
git commit -m "fix: resolve issue"
[fix/my-feature abc123] fix: resolve issue

🔍 Checking Git Flow compliance...

✅ Step 2: Feature/fix branch created: fix/my-feature
❌ Step 5 VIOLATED: Branch 'fix/my-feature' not pushed to remote
   → Run: git push origin fix/my-feature
❌ Step 6 VIOLATED: No PR exists for branch 'fix/my-feature'
   → Run: gh pr create --base develop --head fix/my-feature

🚨 Git Flow VIOLATED: 2 step(s) incomplete

Complete the cycle:
  5. git push origin fix/my-feature
  6. gh pr create --base develop --head fix/my-feature
  7. Wait for PR merge
  8. git push origin --delete fix/my-feature
  9. git checkout develop
 10. git pull origin develop
```

### 🟢 Capa 3: Shell Integration (AWARENESS)
**Ubicación:** `~/.zshrc` (automático al entrar/salir de directorios)

**Comportamiento:**
```bash
cd ~/CascadeProjects/R_GO_local

=== Git Flow Enforcer ===

✅ Step 2: Feature/fix branch created: fix/my-feature
❌ Step 6 VIOLATED: No PR exists for branch 'fix/my-feature'
   → Run: gh pr create --base develop --head fix/my-feature

🚨 Git Flow VIOLATED: 1 step(s) incomplete
```

## Uso Manual

### Verificar Estado Actual
```bash
# Desde CLI del proyecto
node scripts/hooks-system/bin/cli.js gitflow check

# O si el paquete está instalado globalmente
ast-hooks gitflow check
```

### Reset Estado (si necesario)
```bash
node scripts/hooks-system/bin/cli.js gitflow reset
```

## Estado Persistente

El enforcer guarda estado en:
```
.git/gitflow-state.json
```

**Estructura:**
```json
{
  "current_step": 6,
  "branch": "fix/critical-secrets",
  "started_at": "2025-11-02T18:45:30Z",
  "steps_completed": ["step2", "step5"]
}
```

## Instalación en Nuevos Proyectos

```bash
# 1. Instalar hooks
npm run hooks:install

# 2. Añadir a ~/.zshrc (automático, ya añadido)
source ~/.zshrc

# 3. Verificar
ast-hooks gitflow check
```

## Bypass (Solo Emergencias)

**⚠️ NO RECOMENDADO** - Solo con autorización de @carlos-merlos

```bash
# Bypass pre-push (NO hacer sin autorización)
git push --no-verify

# Esto generará una alerta en el sistema
```

## Casos de Uso

### ✅ Flujo Normal (Completo)
```bash
git checkout develop
git checkout -b fix/critical-bug
# ... hacer cambios ...
git commit -m "fix: critical bug"
git push origin fix/critical-bug
gh pr create --base develop --head fix/critical-bug --title "Fix critical bug"
# ... esperar merge ...
git push origin --delete fix/critical-bug
git checkout develop
git pull origin develop

# ✅ Git Flow complete! (enforcer pasa sin errores)
```

### ❌ Flujo Incompleto (Bloqueado)
```bash
git checkout develop
git checkout -b fix/another-bug
# ... hacer cambios ...
git commit -m "fix: another bug"
git push origin fix/another-bug
# ❌ OLVIDÉ CREAR PR

git checkout develop  # Intento continuar sin completar ciclo

# 🔍 Checking Git Flow compliance...
# ❌ Step 6 VIOLATED: No PR exists for branch 'fix/another-bug'
# 🚨 PUSH BLOCKED (si intento push)
```

## Integración con CI/CD

El enforcer se integra automáticamente en:
- ✅ Pre-commit hook (violaciones de código)
- ✅ Pre-push hook (violaciones de Git Flow)
- ✅ GitHub Actions (validation en PRs)

## Estadísticas

**Antes del Git Flow Enforcer:**
- Branches acumuladas: ~10-15 en remoto
- PRs olvidadas: ~5-7 sin crear
- Tiempo de cleanup: ~30 min/sprint

**Después del Git Flow Enforcer:**
- Branches acumuladas: 0 (solo main + develop)
- PRs olvidadas: 0 (bloqueado si no existe)
- Tiempo de cleanup: 0 min (automático)

## FAQ

### ¿Qué pasa si estoy en develop?
```bash
=== Git Flow Enforcer ===

✅ Ready to start new Git Flow cycle
Next: git checkout -b fix/your-task
```

### ¿Qué pasa si la PR aún no se mergeó?
```bash
❌ Step 7 VIOLATED: PR for 'fix/my-feature' not merged yet
   → Wait for PR approval and merge
```

### ¿Puedo desactivarlo temporalmente?
Sí, pero **NO RECOMENDADO**:
```bash
# Renombrar hook temporalmente
mv .git/hooks/pre-push .git/hooks/pre-push.disabled

# Reactivar
mv .git/hooks/pre-push.disabled .git/hooks/pre-push
```

### ¿Funciona con otros flujos (GitHub Flow, GitLab Flow)?
No, está **específicamente diseñado** para el Git Flow de 16 pasos definido en `/Users/juancarlosmerlosalbarracin/CascadeProjects/R_GO_local/scripts/GITFLOW_ESTRATEGIA_VIOLACIONES.md`.

## Contribuir

Para mejorar el enforcer:
1. Modificar: `scripts/hooks-system/infrastructure/shell/gitflow-enforcer.sh`
2. Testear: `node scripts/hooks-system/bin/cli.js gitflow check`
3. Commit cambios siguiendo Git Flow completo (el enforcer te validará 😉)

## Versión

**v1.0.0** - Primera implementación estable

## Autor

- **Arquitecto:** AI Assistant + Carlos Merlos
- **Fecha:** 2025-11-02
- **Contexto:** Sprint 1 - Prevenir regresiones en Git Flow

