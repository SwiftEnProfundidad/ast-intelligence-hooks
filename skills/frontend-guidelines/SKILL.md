---
name: frontend-guidelines
description: Frontend development guidelines for Next.js 15/React/TypeScript applications. Modern patterns including Server Components, Client Components, App Router, Clean Architecture, Zustand state management, React Query, Tailwind CSS styling, i18n, accessibility, and performance optimization. Use when creating components, pages, features, fetching data, styling, routing, or working with frontend code.
---

# Frontend Development Guidelines

## Purpose

Comprehensive guide for modern Next.js 15 development, emphasizing Server Components by default, Clean Architecture, proper file organization, and performance optimization.

## When to Use This Skill

- Creating new components or pages
- Building new features
- Fetching data with React Query
- Setting up routing with App Router
- Styling components with Tailwind CSS
- Performance optimization
- Organizing frontend code
- TypeScript best practices

---

## Quick Start

### New Component Checklist

Creating a component? Follow this checklist:

- [ ] **Server Component by default** - Only use "use client" when needed
- [ ] **TypeScript** - Explicit prop interfaces, no `any`
- [ ] **Clean Architecture** - Place in correct layer (presentation/domain/application/infrastructure)
- [ ] **Styling** - Tailwind CSS utility classes
- [ ] **Accessibility** - Semantic HTML, ARIA labels
- [ ] **i18n** - Use translation hooks, no hardcoded strings
- [ ] **Performance** - useMemo, useCallback when appropriate
- [ ] **Testing** - React Testing Library tests

### New Feature Checklist

Creating a feature? Set up this structure:

- [ ] Create feature directory in appropriate layer
- [ ] Create subdirectories: `components/`, `hooks/`, `services/`
- [ ] Create API service in `infrastructure/repositories/`
- [ ] Set up TypeScript types in `domain/entities/`
- [ ] Create route in `app/{feature}/page.tsx`
- [ ] Use Server Components when possible
- [ ] Add loading.tsx and error.tsx
- [ ] Export public API from feature

---

## Architecture Overview

### Clean Architecture Layers

```
User Interaction
    ↓
Presentation (Components, Hooks, Pages)
    ↓
Application (Use Cases, State Management)
    ↓
Domain (Entities, Business Logic)
    ↓
Infrastructure (API Clients, Repositories, Services)
```

**Key Principle:** Dependencies point inward. Domain has no dependencies.

See [architecture-overview.md](resources/architecture-overview.md) for complete details.

---

## Directory Structure

```
apps/admin-dashboard/src/
├── domain/
│   ├── entities/              # Business models
│   └── repositories/          # Repository interfaces
├── application/
│   ├── use-cases/             # Business logic
│   └── stores/                # Zustand stores
├── infrastructure/
│   ├── repositories/          # API implementations
│   ├── services/              # External services
│   └── config/                # Configuration
└── presentation/
    ├── components/            # UI components
    ├── hooks/                 # Custom hooks
    └── app/                   # Next.js App Router
        ├── {feature}/
        │   ├── page.tsx       # Server Component
        │   ├── loading.tsx    # Loading state
        │   └── error.tsx      # Error state
```

---

## Core Principles

### 1. Server Components by Default

```typescript
// ✅ Server Component (default)
export default async function OrdersPage() {
    const orders = await fetchOrders();
    return <OrdersList orders={orders} />;
}

// ✅ Client Component (only when needed)
'use client';
export default function OrdersPage() {
    const [filter, setFilter] = useState('');
    return <OrdersList filter={filter} />;
}
```

### 2. Clean Architecture Layers

```typescript
// Domain (entities)
export interface Order {
    id: string;
    status: OrderStatus;
}

// Infrastructure (repository implementation)
export class OrdersRepository {
    async findAll(): Promise<Order[]> {
        return apiClient.get('/orders');
    }
}

// Application (use case)
export class GetOrdersUseCase {
    constructor(private ordersRepo: OrdersRepository) {}
    async execute(): Promise<Order[]> {
        return this.ordersRepo.findAll();
    }
}

// Presentation (component)
export default async function OrdersPage() {
    const useCase = new GetOrdersUseCase(new OrdersRepository());
    const orders = await useCase.execute();
    return <OrdersList orders={orders} />;
}
```

### 3. State Management

```typescript
// Global state: Zustand
import { create } from 'zustand';

export const useOrdersStore = create((set) => ({
    orders: [],
    setOrders: (orders) => set({ orders })
}));

// Server state: React Query
import { useQuery } from '@tanstack/react-query';

export function useOrders() {
    return useQuery({
        queryKey: ['orders'],
        queryFn: () => ordersRepository.findAll()
    });
}

// Local state: useState
const [filter, setFilter] = useState('');
```

### 4. Styling with Tailwind CSS

```typescript
export default function Button({ children }: ButtonProps) {
    return (
        <button className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
            {children}
        </button>
    );
}
```

### 5. Data Fetching

```typescript
// Server Component (async)
export default async function OrdersPage() {
    const orders = await fetch('/api/orders', { cache: 'no-store' });
    return <OrdersList orders={orders} />;
}

// Client Component (React Query)
'use client';
export default function OrdersPage() {
    const { data: orders } = useQuery({
        queryKey: ['orders'],
        queryFn: () => ordersRepository.findAll()
    });
    return <OrdersList orders={orders} />;
}
```

### 6. i18n (Internationalization)

```typescript
import { useTranslation } from 'next-i18next';

export default function Button() {
    const { t } = useTranslation('common');
    return <button>{t('submit')}</button>;
}
```

### 7. Testing Required

```typescript
import { render, screen } from '@testing-library/react';
import { OrdersList } from './OrdersList';

describe('OrdersList', () => {
    it('should render orders', () => {
        render(<OrdersList orders={mockOrders} />);
        expect(screen.getByText('Order 1')).toBeInTheDocument();
    });
});
```

---

## Common Imports

```typescript
// Next.js
import { Metadata } from 'next';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';

// React
import { useState, useCallback, useMemo } from 'react';

// React Query
import { useQuery, useMutation } from '@tanstack/react-query';

// Zustand
import { useOrdersStore } from '@/application/stores/ordersStore';

// Tailwind CSS
import { cn } from '@/lib/utils';

// i18n
import { useTranslation } from 'next-i18next';

// Types
import type { Order } from '@/domain/entities/Order';
```

---

## Quick Reference

### Next.js 15 App Router

- **Server Components**: Default, async, no hooks
- **Client Components**: "use client", hooks, interactivity
- **Loading States**: `loading.tsx` file
- **Error States**: `error.tsx` file
- **Metadata**: `generateMetadata` function

### HTTP Status Codes

| Code | Use Case |
|------|----------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 500 | Server Error |

---

## Anti-Patterns to Avoid

❌ Client Components when Server Components suffice
❌ Business logic in components
❌ Direct API calls in components
❌ Missing error boundaries
❌ Hardcoded strings (no i18n)
❌ Missing accessibility attributes
❌ Unnecessary re-renders

---

## Navigation Guide

| Need to... | Read this |
|------------|-----------|
| Understand architecture | [architecture-overview.md](resources/architecture-overview.md) |
| Create components | [component-patterns.md](resources/component-patterns.md) |
| Fetch data | [data-fetching.md](resources/data-fetching.md) |
| Organize files | [file-organization.md](resources/file-organization.md) |
| Style components | [styling-guide.md](resources/styling-guide.md) |
| Set up routing | [routing-guide.md](resources/routing-guide.md) |
| Handle loading/errors | [loading-error-states.md](resources/loading-error-states.md) |
| Optimize performance | [performance.md](resources/performance.md) |
| TypeScript types | [typescript-standards.md](resources/typescript-standards.md) |
| Forms/State/Auth | [common-patterns.md](resources/common-patterns.md) |
| See examples | [complete-examples.md](resources/complete-examples.md) |

---

## Resource Files

### [architecture-overview.md](resources/architecture-overview.md)
Clean Architecture layers, dependency direction, separation of concerns

### [component-patterns.md](resources/component-patterns.md)
Server vs Client Components, component structure, patterns

### [data-fetching.md](resources/data-fetching.md)
Server Components async, React Query, caching strategies

### [file-organization.md](resources/file-organization.md)
Directory structure, feature organization, imports

### [styling-guide.md](resources/styling-guide.md)
Tailwind CSS, responsive design, theme configuration

### [routing-guide.md](resources/routing-guide.md)
App Router, dynamic routes, navigation patterns

### [loading-error-states.md](resources/loading-error-states.md)
loading.tsx, error.tsx, error boundaries, user feedback

### [performance.md](resources/performance.md)
Optimization patterns, code splitting, memoization

### [typescript-standards.md](resources/typescript-standards.md)
Type safety, interfaces, generics, utility types

### [common-patterns.md](resources/common-patterns.md)
Forms, state management, authentication, complete examples

---

## Related Skills

- **backend-guidelines** - Backend development patterns
- **ios-guidelines** - iOS development patterns
- **android-guidelines** - Android development patterns
- **skill-developer** - Meta-skill for creating and managing skills

---

**Skill Status**: COMPLETE ✅
**Line Count**: < 500 ✅
**Progressive Disclosure**: 10 resource files ✅
