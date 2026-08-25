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
│   └── dialog/      # Base UI dialogs
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

## Consumer requirement — pointer cursor

Tailwind v4 removed the v3 Preflight rule `button { cursor: pointer }`. This
package's primitives carry their own `cursor-*` classes where Base UI renders a
non-button element (`Checkbox`, `Switch`, `RadioGroupItem` → `span`; menu and
listbox items → `div`), and `buttonVariants` carries `cursor-pointer` so
`<Button render={<div/>} nativeButton={false}>` works.

Raw `<button>` elements inside this package's feature components rely on the
**consuming app**. Every app that consumes this package must add to its global
stylesheet:

```css
@layer base {
  button:not(:disabled):not([aria-disabled="true"]):not([data-disabled]),
  [role="button"]:not(:disabled):not([aria-disabled="true"]):not([data-disabled]),
  input:is([type="checkbox"], [type="radio"], [type="file"], [type="range"], [type="submit"], [type="reset"]):not(:disabled),
  select:not(:disabled),
  summary {
    cursor: pointer;
  }
}
```

Known status: `a360ai` has it (`apps/web/src/app/globals.css`). `neural-erp`
does **not** — its buttons are pointer-less until the rule is added there.

## Consumer requirement — `success` color token

This package's components style success states with `text-success`,
`bg-success/15` and `border-success/30` (billing promo codes, credit deltas).
Tailwind v4 resolves those from `--color-success`, which this package does not
define — the **consuming app** must, or the classes compile to nothing and the
text silently inherits the surrounding foreground. On a dark theme that renders
as invisible text on a light panel.

Add to the app's global stylesheet, alongside `--warning`:

```css
@theme inline {
  --color-success: var(--success);
  --color-success-foreground: var(--success-foreground);
}
:root {
  --success: oklch(0.55 0.14 152);
  --success-foreground: oklch(0.985 0 0);
}
.dark {
  --success: oklch(0.76 0.15 152);      /* lighter than light mode, as --primary is */
  --success-foreground: oklch(0.26 0.05 152);
}
```

Known status: `narr8` has it. Any other consumer using these components needs
the same block.

## Consumer requirement — RTL

RTL support is app-owned. The package never derives direction from the locale —
next-intl owns locale resolution, and which locales are RTL is app policy. The
consumer's locale layout derives `dir` once and feeds both the html attribute
and the provider (they must never disagree):

```tsx
// app/[locale]/layout.tsx
import { getLocale } from "next-intl/server";
import { NextIntlClientProvider } from "next-intl";
import { DirectionProvider } from "@carlonicora/nextjs-jsonapi/contexts";

const RTL_LOCALES = new Set(["ar"]);

export default async function LocaleLayout({ children }) {
  const locale = await getLocale();
  const dir = RTL_LOCALES.has(locale) ? "rtl" : "ltr";

  return (
    <html lang={locale} dir={dir}>
      <body>
        <NextIntlClientProvider>
          <DirectionProvider dir={dir}>{children}</DirectionProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
```

Locale switching through next-intl navigation re-renders this layout, so `dir`
flips with the locale automatically — one build serves LTR and RTL locales.

Side-positioned components default to LOGICAL sides — `Sidebar` to `"start"`,
`SheetContent` to `"end"` — and `Drawer` accepts `"start"`/`"end"` for its
`direction`. RTL apps must use the logical values: an explicit physical
`side="left"`/`"right"` stays physical and will not mirror (for `Sidebar` it
also desyncs the in-flow gap from the fixed panel under RTL).

Without the provider, Base UI popups (menus, selects, tooltips) keep resolving
`align="start"/"end"` as LTR even though the CSS mirrors. Without `<html dir>`,
nothing mirrors. LTR apps need no changes — `useDir()` defaults to `"ltr"`.

Package rules: use logical Tailwind utilities (`ms-/me-/ps-/pe-/start-/end-/
text-start/…`) — `scripts/check-rtl-classes.mjs` (runs in `pnpm lint`) rejects
physical ones; escape deliberate physicals with an `rtl-ok` comment.
