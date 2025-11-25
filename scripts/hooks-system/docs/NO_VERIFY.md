# 🤖 AI NO-VERIFY GUARD

## VERIFICACIÓN TÉCNICA DE LA POLÍTICA

Este documento sirve como **guardia técnica** para verificar que la IA respeta la política de `--no-verify`.

---

## 📋 CÓMO VERIFICAR

### Opción 1: Script de Verificación Automático

```bash
./scripts/verify-no-verify-policy.sh
```

Este script analiza los últimos commits y detecta:
- ✅ Commits con bypass AUTORIZADO (contienen "authorized" o "approved" en el mensaje)
- ❌ Commits con bypass SIN AUTORIZACIÓN (contienen "--no-verify" o "bypass" pero NO "authorized")

---

### Opción 2: Verificación Manual en Git History

```bash
# Ver últimos 20 commits con detalles
git log -20 --oneline --all

# Buscar commits que puedan haber usado --no-verify
git log --all --grep="no-verify\|bypass\|skip.*hook" -i

# Ver commits en el branch actual
git log --oneline fix/critical-security
```

---

### Opción 3: Verificar Commit Específico

```bash
# Ver detalles de un commit sospechoso
git show <commit-hash>

# Ver el mensaje completo
git log -1 --pretty=format:"%B" <commit-hash>
```

---

## 🔍 QUÉ BUSCAR

### ❌ VIOLACIÓN DETECTADA (Sin Autorización):

```
commit abc123
fix: something

# Usado --no-verify sin autorización
```

```
commit abc123  
fix: bypass hook for quick fix
```

### ✅ USO AUTORIZADO (Con Permiso Explícito):

```
commit abc123
fix: something --no-verify authorized by user

User approved bypass due to legacy code in separate PR.
```

```
commit abc123
fix: emergency hotfix

--no-verify AUTHORIZED by @carlos-merlos
Reason: Production critical, tests in separate PR #123
```

---

## 🚨 SI DETECTAS VIOLACIÓN

1. **Ejecutar script de verificación**:
   ```bash
   ./scripts/verify-no-verify-policy.sh
   ```

2. **Si encuentra violaciones**:
   - Reportar al usuario
   - Pedir explicación
   - Revertir si no hay justificación

3. **Documentar el incidente**:
   - Fecha y hora
   - Commit hash
   - Razón de la violación
   - Acción correctiva tomada

---

## 📊 ESTADÍSTICAS DE CUMPLIMIENTO

Para generar estadísticas:

```bash
# Total de commits en el branch
git rev-list --count fix/critical-security

# Commits que mencionan "no-verify"
git log --all --grep="no-verify" -i --oneline | wc -l

# Commits autorizados
git log --all --grep="no-verify.*authorized" -i --oneline | wc -l
```

---

## ✅ COMPROMISO DE LA IA

**YO, LA IA, ME COMPROMETO A:**

1. ✅ NUNCA usar `--no-verify` sin autorización explícita del usuario
2. ✅ SIEMPRE reportar cuando el hook bloquea un commit
3. ✅ SIEMPRE ofrecer opciones: fixear o solicitar autorización
4. ✅ SIEMPRE documentar en el commit message cuando uso `--no-verify` autorizado
5. ✅ SIEMPRE incluir "AUTHORIZED by @user" o "USER APPROVED" en el mensaje

---

## 🔐 FORMATO DE COMMIT CON --no-verify AUTORIZADO

```
fix(category): description

Detailed explanation of changes.

--no-verify AUTHORIZED by @carlos-merlos
Reason: [explicación clara]
Alternative: [qué se hará para fixear después]

Violations bypassed:
- HIGH: 2 (legacy code, separate PR #XXX)
- MEDIUM: 6 (to be fixed in PR #YYY)
```

---

## 🎯 VERIFICACIÓN RÁPIDA

```bash
# Ejecutar AHORA para verificar cumplimiento
./scripts/verify-no-verify-policy.sh && echo "✅ ALL CHECKS PASSED"
```

---

**Última actualización**: 2 Nov 2025  
**Mantenedor**: Carlos Merlos  
**Verificación**: Ejecutar script después de cada sesión de commits

