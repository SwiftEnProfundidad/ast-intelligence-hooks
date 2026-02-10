---
name: windsurf-rules-frontend
description: Reglas Frontend (React/Next.js/TypeScript) del proyecto. Usar en cambios web.
---
---
alwaysApply: true
---
---
trigger: manual
---

---
trigger: always_on
description: Frontend rules for React/TypeScript
globs: ["**/*.tsx", "**/*.ts", "**/*.jsx", "**/*.js"]
---

# Frontend Rules - React/TypeScript/Next.js

## ANTES de implementar CUALQUIER cosa:

### Fundamentos (heredados de goldrules.md):
✅ **Siempre responder en español**
✅ **Actúa como un Arquitecto de Soluciones y Software Designer**
✅ **Seguir siempre flujo BDD->TDD** (escribir historias de usuario primero, luego tests, luego código)
✅ **En producción ni un mocks ni un spies** - Todo real de APIs o almacenamiento real que el proyecto necesite
✅ **No poner comentarios en el código** - Nombres autodescriptivos lo hacen innecesario
✅ **Analizar estructura existente** - Archivos, componentes, servicios, dependencias, estado global (Zustand/Redux)
✅ **Verificar que NO viole SOLID** (SRP, OCP, LSP, ISP, DIP) en componentes, hooks, servicios y arquitectura
✅ **No Singleton, en su lugar Inyección de Dependencias** - Usar providers, context o DI containers
✅ **Seguir Clean Architecture y Clean Code** - Capas: presentación/UI, dominio/lógica, datos; dependencias hacia adentro
✅ **Preferir early returns y destructuring** - Evitar if/else anidados, callback hell o prop drilling excesivo
✅ **Aplicar reglas de testing** - makeSUT (System Under Test), helpers separados en archivos de test
✅ **Preferir spies frente a stubs o mocks si es posible** - Usar jest.spyOn para métodos reales
✅ **Nombres autodescriptivos** - Todo en inglés (usar i18n para UI)
✅ **Comprobar que compile y pase tests ANTES de sugerir** - TypeScript strict, ESLint, verificar builds

### React Best Practices:
✅ **Hooks primero** - useState, useEffect, useCallback, useMemo, custom hooks
✅ **NO class components** - Solo functional components
✅ **Estado local/global eficiente** - useState para local, Zustand/Context para global
✅ **Optimizar renders** - React.memo, useMemo, useCallback para prevenir re-renders innecesarios
✅ **Accesibilidad (ARIA)** - Semantic HTML primero, ARIA cuando sea necesario
✅ **Composición de componentes** - Componentes pequeños, reutilizables, single responsibility
✅ **Custom hooks para lógica reutilizable** - Extraer lógica compleja a hooks propios
✅ **Evitar prop drilling** - Context API o Zustand para estado compartido profundo
✅ **Key props en listas** - Nunca usar índice como key si el orden puede cambiar

### TypeScript Strict:
✅ **No any** - Usar unknown si el tipo es desconocido, luego type guard
✅ **Interfaces para props** - Definir tipos explícitos para todos los componentes
✅ **Generics cuando sea apropiado** - Componentes y hooks reutilizables type-safe
✅ **Utility types** - Partial, Pick, Omit, Required, Record cuando simplifique código
✅ **Type inference** - Dejar que TypeScript infiera cuando sea obvio, no sobre-especificar

### Next.js 15 Specifics:
✅ **App Router** - Usar app/ directory, no pages/ (excepto legacy)
✅ **Server Components por defecto** - "use client" solo cuando sea necesario (interactividad, hooks, event handlers)
✅ **Data fetching en Server Components** - fetch con cache/revalidate, async components
✅ **Dynamic imports** - next/dynamic para code splitting
✅ **Next/Image** - Siempre para imágenes, optimización automática
✅ **Metadata API** - generateMetadata para SEO
✅ **Loading/Error states** - loading.tsx, error.tsx en cada ruta
✅ **Route handlers** - app/api/ para endpoints backend

### Estado y Caché:
✅ **Zustand para estado global** - Simple, sin boilerplate, DevTools
✅ **React Query para server state** - Caché automático, refetch, invalidación
✅ **useState para estado local** - No elevar estado prematuramente
✅ **useReducer para lógica compleja** - Estado con múltiples sub-valores o lógica compleja
✅ **Invalidación inteligente** - Invalidar caché después de mutaciones

### Performance:
✅ **Code splitting** - React.lazy + Suspense, dynamic imports
✅ **Memoización estratégica** - No todo necesita memo, perfilar primero
✅ **Virtual scrolling** - Para listas largas (react-window, react-virtualized)
✅ **Debounce/Throttle** - Para inputs de búsqueda, scroll handlers
✅ **Web Vitals** - Monitorear LCP, FID, CLS, medir con Lighthouse

### Styling:
✅ **Tailwind CSS** - Utility-first, diseño consistente
✅ **CSS Modules** - Para estilos específicos de componente si es necesario
✅ **cn() helper** - Combinar clases con clsx o tailwind-merge
✅ **Theme provider** - next-themes para dark/light mode
✅ **Responsive design** - Mobile-first, breakpoints de Tailwind

### Validación y Forms:
✅ **React Hook Form** - Performance, menos re-renders
✅ **Zod para schemas** - Type-safe validation, inferir tipos
✅ **Validación en tiempo real** - Feedback inmediato al usuario
✅ **Error messages** - Claros, accionables, traducidos (i18n)

### Ejemplos mínimos:
```ts
export const userSchema = z.object({
  email: z.string().email(),
})
```

```ts
const { data } = useQuery({
  queryKey: ["users"],
  queryFn: () => api.getUsers(),
})
```

```tsx
export default async function Page() {
  const data = await api.getUsers()
  return <UsersList data={data} />
}
```

### i18n (Internacionalización):
✅ **i18n desde día 1** - Archivos de traducción separados (locales/)
✅ **useTranslation hook** - No hardcodear strings
✅ **Namespaces** - Separar traducciones por feature/módulo
✅ **Fallback locale** - Inglés como fallback
✅ **Formateo de fechas/números** - Usar Intl API o i18n helpers

### Accesibilidad (a11y):
✅ **Semantic HTML** - <button> para botones, <nav> para navegación, etc.
✅ **ARIA labels** - aria-label, aria-describedby cuando sea necesario
✅ **Keyboard navigation** - Todos los interactivos accesibles por teclado
✅ **Focus management** - Focus visible, trap focus en modales
✅ **Contrast ratio** - WCAG AA mínimo (4.5:1 texto normal, 3:1 texto grande)
✅ **Screen reader testing** - Probar con VoiceOver/NVDA

### Testing Frontend:
✅ **React Testing Library** - Testear como usuario, no implementation details
✅ **Queries apropiadas** - getByRole > getByLabelText > getByText > getByTestId
✅ **userEvent sobre fireEvent** - Simula interacción real de usuario
✅ **MSW (Mock Service Worker)** - Mock APIs en tests, no axios/fetch directamente
✅ **E2E con Playwright** - User flows críticos
✅ **Snapshot testing con moderación** - Solo para componentes estables

### Seguridad Frontend:
✅ **Sanitizar HTML** - DOMPurify si se renderiza HTML de usuario
✅ **CSP headers** - Content Security Policy en Next.js config
✅ **HTTPS siempre** - Redirect automático en producción
✅ **Tokens en headers** - Authorization: Bearer <token>, nunca en URLs
✅ **Rate limiting** - Proteger endpoints públicos

### Integración con Backend:
✅ **API client abstraído** - axios/fetch en capa de infraestructura
✅ **Tipos compartidos** - Sincronizar con backend (tRPC o Zod)
✅ **Error handling global** - Interceptors para 401, 500, etc.
✅ **No catch vacíos** - Prohibido silenciar errores (AST: common.error.empty_catch)
✅ **Loading states** - Skeleton screens, spinners, optimistic updates
✅ **Retry logic** - Reintentar requests fallidos (React Query retry)

### Estructura de Archivos (Clean Architecture):
```
app/
  dashboard/
    page.tsx              # Server Component
    layout.tsx
    loading.tsx
    error.tsx
components/
  ui/                     # Shared UI (Button, Card, etc.)
  dashboard/              # Feature-specific components
domain/
  entities/               # Business models
  repositories/           # Interfaces
application/
  use-cases/              # Business logic
infrastructure/
  repositories/           # API implementations
  services/               # External services
  config/                 # Configuration
presentation/
  hooks/                  # Custom hooks
  stores/                 # Zustand stores
```

### Arquitectura Feature-First + DDD + Clean + Event-Driven (Frontend):
✅ **Feature-first** - Cada feature es un Bounded Context aislado
✅ **Clean por feature** - presentation → application → domain, infrastructure → domain
✅ **DDD** - entidades, value objects, repositorios, eventos
✅ **Event-driven** - Navegación y coordinación por eventos cuando crezca el dominio
✅ **Shared Kernel** - Tipos mínimos compartidos entre features

```
apps/web/
  features/
    auth/
      domain/
      application/
      infrastructure/
      presentation/
      navigation/
  shared/
    kernel/
    design-system/
  navigation/
    event-bus/
    routes/
```

### Integrar con el contexto del proyecto:
✅ **Analizar archivos existentes** - Revisar componentes, servicios, tipos actuales
✅ **Compatibilidad con componentes actuales** - Mantener consistencia en patrones
✅ **Respetar patrones establecidos** - Repository pattern, Use Cases, DTOs
✅ **Reutilizar componentes UI** - No duplicar Button, Card, Dialog, etc.

### Principio fundamental:
✅ **"Measure twice, cut once"** - Planificar arquitectura, dependencias y flujo de datos para evitar refactorizaciones múltiples. Analizar impacto en estado global y rendimiento ANTES de implementar.
