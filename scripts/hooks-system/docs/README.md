# 📚 AST Intelligence Hooks - Documentation

**Version:** 5.2.0  
**Last Updated:** 2025-11-03  

---

## 📖 **Quick Links**

| Document | Description |
|----------|-------------|
| [USAGE.md](./USAGE.md) | How to use the system |
| [ARCHITECTURE.md](./architecture/ARCHITECTURE.md) | System architecture & design |
| [GITFLOW_ENFORCER.md](./GITFLOW_ENFORCER.md) | Git Flow 16-step workflow |
| [NO_VERIFY_POLICY.md](./NO_VERIFY_POLICY.md) | --no-verify policy & authorization |

---

## 🗂️ **Documentation Structure**

```
docs/
├── README.md (this file)        # Documentation index
├── USAGE.md                     # How to use the system
├── GITFLOW_ENFORCER.md          # Git Flow enforcer guide
├── NO_VERIFY_POLICY.md          # Bypass policy
│
├── architecture/                # System architecture
│   ├── ARCHITECTURE.md          # Main architecture doc
│   ├── CLEAN_ARCHITECTURE_COMPLETE.md # Clean Arch implementation
│   └── ENTERPRISE_AST_IMPLEMENTATION.md # AST technical details
│
├── ast-rules/                   # AST Rules by platform
│   ├── ANALISIS_REGLAS.md       # Rules analysis
│   ├── COMPARATIVA_REGLAS_COMPLETA.md # Complete comparison
│   ├── AST_BACKEND.md           # Backend rules
│   ├── AST_FRONTEND.md          # Frontend rules
│   ├── AST_IOS.md               # iOS rules
│   └── AST_ANDROID.md           # Android rules
│
└── guides/                      # User guides
    ├── USAGE.md                 # Main usage guide
    └── ARCHITECTURE_ENFORCEMENT.md # How enforcer works
```

---

## 🚀 **Getting Started**

1. **Installation:** [USAGE.md#installation](./USAGE.md#installation)
2. **First Audit:** [USAGE.md#running-audit](./USAGE.md#running-audit)
3. **Understanding Results:** [USAGE.md#understanding-results](./USAGE.md#understanding-results)
4. **Fixing Violations:** Use violations API with clickable paths

---

## 💡 **Common Tasks**

### **Run Audit:**
```bash
cd scripts/hooks-system
npm run audit
```

### **View Violations (Clickable Paths):**
```bash
npm run violations:list common.types.any
npm run violations:show common.types.any 5
```

### **Check Git Flow:**
```bash
npm run gitflow:status
npm run gitflow:workflow
```

---

## 📊 **System Components**

- **AST Intelligence:** Multi-platform code analysis (Backend, Frontend, iOS, Android)
- **Git Flow Enforcer:** 16-step workflow validation
- **Violations API:** Indexed query system with clickable paths
- **Git Hooks:** Pre-push validation (auto-blocks bad commits)

---

**For detailed information, see [USAGE.md](./USAGE.md)**
