# Archive - Archivos Históricos

Esta carpeta contiene implementaciones anteriores y archivos obsoletos del sistema AST Intelligence que han sido reemplazados por la arquitectura modular actual.

## Archivos

- `ast-intelligence.ts` - Versión TypeScript anterior del coordinador (reemplazado por `ast-intelligence.js`)
- `ios-rules.js` - Implementación anterior de reglas iOS usando SourceKitten
- `kotlin-analyzer.js` - Analizador Kotlin anterior usando Detekt
- `kotlin-parser.js` - Parser Kotlin anterior usando Detekt
- `swift-analyzer.js` - Analizador Swift anterior usando SourceKitten

## Nota

Estos archivos se mantienen por referencia histórica y no deben usarse en el código actual. El sistema actual utiliza la arquitectura modular en:
- `ast-core.js` - Utilidades compartidas
- `ast-intelligence.js` - Coordinador principal
- `{platform}/ast-{platform}.js` - Módulos específicos por plataforma
