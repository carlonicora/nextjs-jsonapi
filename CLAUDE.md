# Next.js JSON:API Library - CLAUDE.md

This package is a published npm library providing the Next.js client for JSON:API applications.

## Purpose

Provides:
- **ModuleFactory pattern** - Standardized resource configuration
- **Server/client data fetching** - SSR and CSR utilities
- **Pre-built components** - Tables, forms, dialogs
- **Testing utilities** - Mock providers, test helpers
- **Stripe integration** - Billing components

## Package Structure

```
src/
├── core/            # Core types and utilities
├── server/          # Server-side components (data fetching)
├── client/          # Client-side utilities (config, hooks)
├── components/      # Pre-built UI components
│   ├── table/       # @tanstack/react-table integration
│   ├── form/        # React Hook Form + Zod
│   └── dialog/      # Radix UI dialogs
├── contexts/        # React context providers
├── testing/         # Testing utilities
└── billing/         # Stripe integration
```

## Core Exports

| Entry Point | Contents |
|-------------|----------|
| `main` | configureJsonApi, configureI18n |
| `core` | Types, interfaces, AbstractApiData |
| `server` | Server-side data fetching utilities |
| `client` | Client hooks, configuration |
| `components` | UI components (tables, forms, dialogs) |
| `testing` | MockJsonApiProvider, renderWithProviders, createMockApiData |

## Key Patterns

### Configuration Pattern
```typescript
import { configureJsonApi, configureI18n } from "@carlonicora/nextjs-jsonapi";

configureJsonApi({
  apiUrl: process.env.NEXT_PUBLIC_API_URL,
  modules: [PhotographModule, RollModule],
});

configureI18n({
  locales: ["en", "it"],
  defaultLocale: "en",
});
```

### ModuleFactory Pattern
```typescript
export const PhotographModule = (factory: ModuleFactory) =>
  factory({
    pageUrl: "/photographs",
    name: "photographs",
    model: Photograph,
    moduleId: "photograph-module",
    inclusions: {
      roll: RollModule,
      metadata: MetadataModule,
    },
  });
```

### AbstractApiData Pattern
```typescript
export class Photograph extends AbstractApiData {
  title: string = "";

  static rehydrate(data: PhotographInterface): Photograph {
    const photo = new Photograph();
    photo.id = data.id;
    photo.title = data.title;
    return photo;
  }

  createJsonApi(): JsonApiData {
    return {
      type: "photographs",
      id: this.id,
      attributes: { title: this.title },
    };
  }
}
```

### Testing Pattern
```typescript
import {
  MockJsonApiProvider,
  renderWithProviders,
  createMockApiData,
  screen,
} from "@carlonicora/nextjs-jsonapi/testing";

describe("PhotographCard", () => {
  it("renders title", () => {
    const mockData = createMockApiData({
      type: "photographs",
      id: "123",
      attributes: { title: "Test" },
    });

    renderWithProviders(<PhotographCard photo={mockData} />);
    expect(screen.getByText("Test")).toBeInTheDocument();
  });
});
```

## Rules for Changes

1. **Backward compatibility** - Breaking changes require major version bump
2. **Server/client boundary** - Keep utilities in correct directories (check "use client" / "use server")
3. **Testing utilities** - Update MockJsonApiProvider when adding new features
4. **Component accessibility** - All UI components must be accessible
5. **Tree-shakeable** - Keep exports granular for optimal bundle size

## Testing

```bash
# Run library tests
pnpm --filter @carlonicora/nextjs-jsonapi test

# Run with coverage
pnpm --filter @carlonicora/nextjs-jsonapi test:coverage
```

## Publishing

- Package: `@carlonicora/nextjs-jsonapi`
- Version: Managed in `package.json`
- Registry: npm

## Common Mistakes

| Mistake | Correct Approach |
|---------|------------------|
| Breaking public API | Create new method, deprecate old one |
| Missing "use client" directive | Add to client-side files |
| Server code in client bundle | Check import paths |
| Missing test utility updates | Update mocks when adding features |
