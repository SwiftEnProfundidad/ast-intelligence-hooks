# Configuration Guide

Resumen de opciones de configuración para `@pumuki/ast-intelligence-hooks`.

## Configuración básica (ejemplo futuro)

```js
// .pumuki.config.js (ejemplo)
module.exports = {
  platforms: ['backend', 'frontend'],
  rules: {
    'backend.api.validation': 'high',
    'frontend.components.props_contract': 'medium'
  },
  notifications: {
    enabled: true,
    sound: true
  }
};
```

> TODO: Detallar todas las opciones reales de configuración y defaults.
