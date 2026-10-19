# @carlonicora/nextjs-jsonapi

A comprehensive Next.js package providing JSON:API compliant client with unified server/client support, automatic caching, and a complete shadcn/ui component library.

## Table of Contents

- [Features](#features)
- [What Changed in 4.0](#what-changed-in-40)
- [Architecture](#architecture)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Environment Variables](#environment-variables)
- [Entry Points](#entry-points)
- [Unified API](#unified-api)
- [Client Hooks](#client-hooks)
- [Server Requests](#server-requests)
- [Permissions](#permissions)
- [shadcn/ui Components](#shadcnui-components)
- [Tailwind CSS Configuration](#tailwind-css-configuration)
- [CSS Variables](#css-variables)
- [License](#license)

## Features

- **Unified API**: Auto-detects environment (server/client) and uses the appropriate request method
- **JSON:API Compliance**: Full JSON:API specification support with deserialization and pagination
- **Next.js 16+ Caching**: Built-in support for `cacheLife()` and `cacheTag()` via cache profiles
- **React Hooks**: `useJsonApiGet` and `useJsonApiMutation` for client-side data fetching
- **Server Components**: Direct server-side data fetching with automatic token handling
- **Multi-Tenant Support**: Built-in company ID handling for B2B applications
- **File Uploads**: Seamless file upload support with multipart requests
- **shadcn/ui Components**: 44 pre-built UI components (41 standard + 3 custom)
- **Utility Functions**: `cn` class merger, mobile detection, and ref composition

## Architecture

The library is organized into these entry points (the `exports` map in `package.json`):

```
@carlonicora/nextjs-jsonapi
├── (main)               # Unified API, configuration functions, and everything in /core
├── /core                # Interfaces, factories, registries, permissions, feature modules, and utilities
├── /server              # Server-side requests, ServerSession, and cache tag helpers
├── /cached-get          # cachedServerGet: the token-free "use cache" GET (server only)
├── /client              # React hooks and client-side utilities
├── /components          # Library components and the 44 shadcn/ui components
├── /contexts            # React providers (SessionProvider, ViewportProvider, SocketProvider, ...)
├── /contexts/styles.css # Stylesheet for the contexts entry
├── /testing             # Test utilities (mock providers, render helpers)
├── /billing             # Stripe billing components (kept apart so Stripe.js is not loaded globally)
├── /help                # Help feature, client components
├── /help/server         # Help feature, server-safe constants and types
├── /tokenusage          # Token-usage admin feature, client components
├── /analytics           # Analytics feature, client components
├── /analytics/server    # Analytics feature, server page components
└── /next-config         # createNextConfig for next.config.js
```

## What Changed in 4.0

4.0 makes the library work under Next 16.4 Cache Components. The full recipe, with the breaking changes and the order of work, is in [docs/migrating-to-4.0.md](docs/migrating-to-4.0.md). In short:

- **Cache Components**: `createNextConfig` turns on `cacheComponents` and `partialPrefetching`. The app frame renders in the static shell while the session streams in behind it.
- **Session**: `ServerSession.read()` (`/server`) returns a `Promise<SessionSnapshot>` built from cookies and headers. Call it without awaiting and hand the promise to `SessionProvider` (`/contexts`); `useSession()` unwraps it, so its caller sits behind its own `<Suspense>`.
- **Providers take `session`**: `ViewportProvider`, `SocketProvider` (`/contexts`) and `SidebarProvider` (`/components`) accept `session?: Promise<SessionSnapshot>`. The old props (`token`, `initialIsMobile`, `defaultOpen`) still work.
- **`createNextConfig`** from `/next-config`: `cspRemove` is gone. Third parties in the CSP come from `services` (`"stripe" | "googleMaps" | "turnstile" | "discord" | "googleFonts"`); anything else goes in `csp`.
- **Caching**: a module's `cache` value is a `cacheLife` profile name or a tag. A cached server GET goes through `cachedServerGet` (`/cached-get`), a `"use cache"` function that never sends the token. See [Cache Profiles](#cache-profiles).
- **`configureI18n` requires `getLocale`**: pass next-intl's `getLocale` from `next-intl/server`; the library no longer imports next-intl itself.

## Installation

```bash
pnpm add @carlonicora/nextjs-jsonapi
```

### Git Submodule Setup (Alternative)

If you want to use the package as a git submodule (for development or before npm release):

**1. Add the submodule**

```bash
cd /path/to/your-project
git submodule add https://github.com/carlonicora/nextjs-jsonapi packages/nextjs-jsonapi
```

**2. Verify it worked**

```bash
git submodule status
# Should show: <commit-sha> packages/nextjs-jsonapi (heads/master)
```

**3. Commit the submodule**

```bash
git add .gitmodules packages/nextjs-jsonapi
git commit -m "Add nextjs-jsonapi as submodule"
```

**4. Update your `package.json`** (e.g., `apps/web/package.json`)

```json
{
  "dependencies": {
    "@carlonicora/nextjs-jsonapi": "workspace:*"
  }
}
```

**5. Ensure `pnpm-workspace.yaml` includes packages**

```yaml
packages:
  - "apps/*"
  - "packages/*"
```

**6. Install and build**

```bash
pnpm install
cd packages/nextjs-jsonapi && pnpm build && cd ../..
```

**For CI/CD (GitHub Actions)**, add `submodules: recursive` to your checkout step:

```yaml
- uses: actions/checkout@v4
  with:
    submodules: recursive
```

**Cloning a project with submodules:**

```bash
# When cloning fresh
git clone --recurse-submodules https://github.com/your/repo.git

# If already cloned
git submodule update --init --recursive
```

### Peer Dependencies

| Package           | Version  | Required | Purpose                             |
| ----------------- | -------- | -------- | ----------------------------------- |
| `next`            | >=16.4.0 | Yes      | Next.js framework                   |
| `react`           | >=19.3.0 | Yes      | React library                       |
| `react-dom`       | >=19.3.0 | Yes      | React DOM                           |
| `react-hook-form` | >=7.0.0  | Optional | Form handling (for form components) |

## Quick Start

### 1. Configure the API Client

Configure the JSON:API client in your environment setup file:

```typescript
// src/config/env.ts
import { configureJsonApi } from "@carlonicora/nextjs-jsonapi";
import { bootstrap } from "@/config/Bootstrapper";

configureJsonApi({
  apiUrl: process.env.NEXT_PUBLIC_API_URL!,
  bootstrapper: bootstrap,
});
```

### 2. Define Your Modules and Bootstrapper

Create a bootstrapper that registers all modules for both the ModuleRegistry (for `Modules.X` access) and DataClassRegistry (for JSON:API response translation):

```typescript
// src/config/Bootstrapper.ts
import { DataClassRegistry, FieldSelector, ModuleRegistry } from "@carlonicora/nextjs-jsonapi/core";
import { ModuleWithPermissions } from "@carlonicora/nextjs-jsonapi/core";
import { S3Module } from "@carlonicora/nextjs-jsonapi/core";

// Import your module definitions
import { ArticleModule } from "@/features/article/ArticleModule";
import { UserModule } from "@/features/user/UserModule";
import { Article } from "@/features/article/data/Article";
import { User } from "@/features/user/data/User";

// Module factory helper
const moduleFactory = (params: {
  pageUrl?: string;
  name: string;
  cache?: string;
  model: any;
  feature?: string;
  moduleId?: string;
  inclusions?: Record<string, { types?: string[]; fields?: FieldSelector<any>[] }>;
}): ModuleWithPermissions => ({
  pageUrl: params.pageUrl,
  name: params.name,
  model: params.model,
  feature: params.feature,
  moduleId: params.moduleId,
  cache: params.cache,
  inclusions: params.inclusions ?? {},
});

// Example module definition file (e.g., ArticleModule.ts)
// export const ArticleModule = (factory: ModuleFactory) =>
//   factory({ name: "articles", model: Article, pageUrl: "/articles" });

// Single source of truth for all modules
const allModules = {
  Article: ArticleModule(moduleFactory),
  User: UserModule(moduleFactory),
  S3: S3Module(moduleFactory), // Built-in S3 module from library
} satisfies Record<string, ModuleWithPermissions>;

// Export type for TypeScript autocompletion
export type AllModuleDefinitions = typeof allModules;

let bootstrapped = false;

export function bootstrap(): void {
  if (bootstrapped) return;

  // Register modules for Modules.X access
  Object.entries(allModules).forEach(([name, module]) => {
    ModuleRegistry.register(name, module);
  });

  // Register model classes for JSON:API response translation
  DataClassRegistry.bootstrap(allModules);

  bootstrapped = true;
}
```

### 3. Fetch Data in Server Components

```typescript
// src/app/articles/page.tsx
import { JsonApiGet } from "@carlonicora/nextjs-jsonapi";
import { Modules } from "@carlonicora/nextjs-jsonapi/core";

export default async function ArticlesPage() {
  const response = await JsonApiGet({
    classKey: Modules.Article,
    endpoint: "/articles",
    language: "en",
  });

  if (!response.ok) {
    return <div>Error: {response.error}</div>;
  }

  return (
    <ul>
      {response.data.map((article) => (
        <li key={article.id}>{article.title}</li>
      ))}
    </ul>
  );
}
```

### 4. Use Hooks in Client Components

```typescript
"use client";

import { useJsonApiGet, useJsonApiMutation } from "@carlonicora/nextjs-jsonapi/client";
import { Modules } from "@carlonicora/nextjs-jsonapi/core";

export function ArticleList() {
  const { data, loading, error, refetch } = useJsonApiGet({
    classKey: Modules.Article,
    endpoint: "/articles",
  });

  const { mutate, loading: creating } = useJsonApiMutation({
    method: "POST",
    classKey: Modules.Article,
    onSuccess: () => refetch(),
  });

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <button
        onClick={() => mutate({
          endpoint: "/articles",
          body: { title: "New Article" }
        })}
        disabled={creating}
      >
        Create Article
      </button>
      <ul>
        {data.map((article) => (
          <li key={article.id}>{article.title}</li>
        ))}
      </ul>
    </div>
  );
}
```

## Environment Variables

```env
# Required
NEXT_PUBLIC_API_URL=http://localhost:3000

# Optional - Token cookie name (default: "token")
# Set this if your API uses a different cookie name for JWT tokens
```

## Entry Points

### Main Export (`.`)

The default export provides the unified API that auto-detects the environment:

```typescript
import {
  JsonApiGet,
  JsonApiPost,
  JsonApiPut,
  JsonApiPatch,
  JsonApiDelete,
  configureJsonApi,
} from "@carlonicora/nextjs-jsonapi";
```

### Core (`/core`)

Core interfaces, factories, registries, and utilities:

```typescript
import {
  // Interfaces
  ApiDataInterface,
  ApiRequestDataTypeInterface,
  ApiResponseInterface,

  // Factories
  JsonApiDataFactory,

  // Registries
  ModuleRegistry, // Register modules during bootstrap
  DataClassRegistry, // Register model classes for JSON:API translation
  Modules, // Access registered modules (e.g., Modules.Article)

  // Endpoint builder
  EndpointBuilder,

  // Field selectors
  FieldSelector,

  // Utilities
  translateResponse,
} from "@carlonicora/nextjs-jsonapi/core";
```

### Client (`/client`)

React hooks and client-side utilities (requires `"use client"`):

```typescript
import {
  // Hooks
  useJsonApiGet,
  useJsonApiMutation,
  useRehydration,

  // Context
  JsonApiProvider,
  useJsonApiContext,

  // Request utilities
  directFetch,
  getClientToken,
} from "@carlonicora/nextjs-jsonapi/client";
```

### Server (`/server`)

Server-side request utilities:

```typescript
import {
  serverRequest,
  getServerToken,
  ServerSession, // read(), isLogged(), checkPermission(), ...
  invalidateCacheTag,
  invalidateCacheTags,
  updateCacheTag,
  CACHE_PROFILES,
} from "@carlonicora/nextjs-jsonapi/server";
```

### Cached GET (`/cached-get`)

The token-free `"use cache"` GET. It resolves to the real function under the `react-server` condition only; every other bundle gets a stub that throws. `serverRequest` calls it for you (see [Cache Profiles](#cache-profiles)).

```typescript
import { cachedServerGet, statusFromDigest } from "@carlonicora/nextjs-jsonapi/cached-get";
```

### Permissions (in `/core`)

Permission checking utilities are exported from `/core` (and the main entry):

```typescript
import {
  checkPermissions,
  Action,
  type PermissionCheck,
  type ModuleWithPermissions,
  type ModuleFactory,
} from "@carlonicora/nextjs-jsonapi/core";
```

### Feature Modules (in `/core`)

Built-in feature modules that can be used directly in your application:

```typescript
import {
  // S3 Module (for file uploads via pre-signed URLs)
  S3Module, // Module definition factory
  S3Service, // Service with getPreSignedUrl, getSignedUrl, deleteFile
  S3, // Data class
  type S3Interface, // Response interface
  type S3Input, // Input parameters
} from "@carlonicora/nextjs-jsonapi/core";

// Usage example:
const s3Response = await S3Service.getPreSignedUrl({
  key: "companies/123/documents/file.pdf",
  contentType: "application/pdf",
  isPublic: true,
});

await fetch(s3Response.url, {
  method: "PUT",
  headers: s3Response.headers,
  body: file,
});
```

### Utilities (in `/core`)

Utility functions:

```typescript
import {
  cn, // Class name merger (clsx + tailwind-merge)
  composeRefs, // Compose multiple refs
  useComposedRefs, // Hook for composing refs
  useIsMobile, // Mobile detection hook
  type ClassValue, // Type for cn function
} from "@carlonicora/nextjs-jsonapi/core";
```

### Components (`/components`)

The library's own components plus all shadcn/ui components (requires `"use client"`):

```typescript
import {
  // UI Components (41)
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
  Alert,
  AlertTitle,
  AlertDescription,
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent /* ... */,
  Avatar,
  AvatarImage,
  AvatarFallback,
  Badge,
  badgeVariants,
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem /* ... */,
  Button,
  buttonVariants,
  Calendar,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend /* ... */,
  Checkbox,
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
  Command,
  CommandInput,
  CommandList,
  CommandItem /* ... */,
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent /* ... */,
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader /* ... */,
  Drawer,
  DrawerTrigger,
  DrawerContent /* ... */,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent /* ... */,
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl /* ... */,
  HoverCard,
  HoverCardTrigger,
  HoverCardContent,
  Input,
  Label,
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem /* ... */,
  Popover,
  PopoverTrigger,
  PopoverContent,
  Progress,
  RadioGroup,
  RadioGroupItem,
  ScrollArea,
  ScrollBar,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem /* ... */,
  Separator,
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader /* ... */,
  Sidebar,
  SidebarProvider,
  SidebarContent,
  SidebarMenu /* ... */,
  Skeleton,
  Slider,
  Sonner,
  Toaster,
  toast,
  Switch,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell /* ... */,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Textarea,
  Toggle,
  toggleVariants,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,

  // Custom Components (3)
  Kanban,
  KanbanColumn,
  KanbanItem, // Drag-and-drop Kanban board
  Link, // next-intl compatible Link
  MultiSelect, // Multi-select dropdown
} from "@carlonicora/nextjs-jsonapi/components";
```

### Other Entry Points

| Entry point            | What it holds                                                                                   |
| ---------------------- | ----------------------------------------------------------------------------------------------- |
| `/contexts`            | React providers: `SessionProvider`/`useSession`, `ViewportProvider`, `SocketProvider`, and more |
| `/contexts/styles.css` | Stylesheet shipped with the contexts entry                                                      |
| `/testing`             | `MockJsonApiProvider`, `renderWithProviders`, `createMockApiData`, `createMockResponse`, ...     |
| `/billing`             | Stripe billing components and contexts                                                          |
| `/help`                | Help feature client components (`HelpProvider`, `HelpHeader`, ...)                              |
| `/help/server`         | Server-safe `HELP_MODES` and help article types                                                 |
| `/tokenusage`          | Token-usage admin feature client components                                                     |
| `/analytics`           | Analytics feature client components (`AnalyticsTracker`, ...)                                   |
| `/analytics/server`    | `AnalyticsAdminPage`, `AnalyticsJourneyPage` server components                                  |
| `/next-config`         | `createNextConfig` for `next.config.js` (see [docs/migrating-to-4.0.md](docs/migrating-to-4.0.md)) |
| `/messages/*`          | `en.json`, `it.json`: the texts the library renders (see [docs/library-messages.md](docs/library-messages.md)) |

The library ships its own English and Italian texts; an app merges them under its own messages with `mergeMessages` as described in [docs/library-messages.md](docs/library-messages.md).

## Unified API

The unified API automatically detects whether code is running on the server or client and uses the appropriate request method.

### JsonApiGet

Fetch data from a JSON:API endpoint:

```typescript
const response = await JsonApiGet({
  classKey: Modules.Article, // Module definition
  endpoint: "/articles/123", // API endpoint
  companyId: "company-uuid", // Optional: for multi-tenant apps
  language: "en", // Required: for i18n
});

if (response.ok) {
  console.info(response.data); // Deserialized data
  console.info(response.pagination); // Pagination info

  // Navigate pages
  if (response.next) {
    const nextPage = await response.nextPage();
  }
}
```

### JsonApiPost

Create a new resource:

```typescript
const response = await JsonApiPost({
  classKey: Modules.Article,
  endpoint: "/articles",
  body: { title: "New Article", content: "..." },
  language: "en",

  // Optional
  files: { attachment: file }, // File uploads
  overridesJsonApiCreation: false, // Use raw body instead of JSON:API format
  responseType: Modules.OtherType, // If response type differs
});
```

### JsonApiPut / JsonApiPatch

Update a resource:

```typescript
const response = await JsonApiPut({
  classKey: Modules.Article,
  endpoint: "/articles/123",
  body: { title: "Updated Title" },
  language: "en",
});
```

### JsonApiDelete

Delete a resource:

```typescript
const response = await JsonApiDelete({
  classKey: Modules.Article,
  endpoint: "/articles/123",
  language: "en",
});
```

## Client Hooks

### useJsonApiGet

Hook for fetching data with automatic refetching:

```typescript
const {
  data, // Fetched data or null
  loading, // Loading state
  error, // Error message or null
  response, // Full API response
  refetch, // Manual refetch function
  hasNextPage, // Pagination: has next page
  hasPreviousPage, // Pagination: has previous page
  fetchNextPage, // Fetch next page
  fetchPreviousPage, // Fetch previous page
} = useJsonApiGet<Article>({
  classKey: Modules.Article,
  endpoint: `/articles/${id}`,
  companyId: companyId,
  options: {
    enabled: !!id, // Conditionally enable
    deps: [someDependency], // Refetch when these change
  },
});
```

### useJsonApiMutation

Hook for mutations (POST, PUT, PATCH, DELETE):

```typescript
const {
  data, // Result data or null
  loading, // Loading state
  error, // Error message or null
  response, // Full API response
  mutate, // Execute the mutation
  reset, // Reset state
} = useJsonApiMutation<Article>({
  method: "POST",
  classKey: Modules.Article,
  onSuccess: (data) => console.info("Created:", data),
  onError: (error) => console.error("Failed:", error),
});

// Execute mutation
const result = await mutate({
  endpoint: "/articles",
  body: { title: "New Article" },
  files: { image: imageFile },
  companyId: "company-uuid",
});
```

## Server Requests

For server components or API routes, use the server module directly:

```typescript
import { serverRequest, getServerToken } from "@carlonicora/nextjs-jsonapi/server";

// Per-user data: no `cache`, so this is a plain uncached fetch that sends the token
export async function getMyArticle(id: string) {
  return serverRequest({
    method: "GET",
    url: `${process.env.NEXT_PUBLIC_API_URL}/articles/${id}`,
    token: await getServerToken(),
    language: "en",
  });
}

// Shared data: a GET with `cache` goes through cachedServerGet and never sends the token
export async function getPublicArticle(id: string) {
  return serverRequest({
    method: "GET",
    url: `${process.env.NEXT_PUBLIC_API_URL}/articles/${id}`,
    cache: "articles", // a cacheLife profile name, or a tag
    language: "en",
  });
}
```

### Cache Profiles

A module's `cache` value decides how a server-side GET is cached. Every GET with a `cache` value runs inside `cachedServerGet`, a `"use cache"` function:

- a built-in `cacheLife` profile name (`"seconds"`, `"minutes"`, `"hours"`, `"days"`, `"weeks"`, `"max"`, `"default"`) → `cacheLife(profile)`;
- any other value is a tag → `cacheTag(value)` + `cacheLife("max")`, so the entry lives until you invalidate the tag.

```typescript
// In your module definition
const ArticleModule = (factory: ModuleFactory) =>
  factory({ name: "articles", model: Article, cache: "articles" }); // tag

// JsonApiGet on the server applies it automatically, and does not read the token
// cookie for a cached module

// After a write, expire the tag
await updateCacheTag("articles"); // Server Actions: the same request reads fresh data
await invalidateCacheTag("articles"); // elsewhere: stale-while-revalidate
```

The cached path is token-free: the arguments are the cache key, so the request goes out without `Authorization`. An endpoint that needs a token is per-user and its module must not set `cache`. A failed response is thrown, not stored; its status travels in `error.digest` as `HTTP_<status>` and `statusFromDigest` reads it back.

## Permissions

Check user permissions for protected resources:

```typescript
import { Action, checkPermissions, Modules } from "@carlonicora/nextjs-jsonapi/core";

// Check if user has permission
const canEdit = checkPermissions({
  module: Modules.Article,
  action: Action.Update,
  user: currentUser,
  data: article,
});

if (!canEdit) {
  return <div>Access denied</div>;
}
```

## shadcn/ui Components

The package includes 44 pre-built shadcn/ui components:

### Standard UI Components (41)

| Component        | Description                     |
| ---------------- | ------------------------------- |
| `Accordion`      | Collapsible content sections    |
| `Alert`          | Callout for important messages  |
| `AlertDialog`    | Modal dialog for confirmations  |
| `Avatar`         | User profile images             |
| `Badge`          | Status indicators and labels    |
| `Breadcrumb`     | Navigation breadcrumbs          |
| `Button`         | Click actions with variants     |
| `Calendar`       | Date picker calendar            |
| `Card`           | Content container               |
| `Carousel`       | Sliding content panels          |
| `Chart`          | Data visualization (Recharts)   |
| `Checkbox`       | Toggle options                  |
| `Collapsible`    | Expandable sections             |
| `Command`        | Command palette (cmdk)          |
| `ContextMenu`    | Right-click menus               |
| `Dialog`         | Modal windows                   |
| `Drawer`         | Sliding side panels (Vaul)      |
| `DropdownMenu`   | Dropdown menus                  |
| `Form`           | Form handling (react-hook-form) |
| `HoverCard`      | Hover-triggered cards           |
| `Input`          | Text input fields               |
| `Label`          | Form labels                     |
| `NavigationMenu` | Navigation menus                |
| `Popover`        | Floating content                |
| `Progress`       | Progress indicators             |
| `RadioGroup`     | Radio button groups             |
| `ScrollArea`     | Custom scrollbars               |
| `Select`         | Dropdown selects                |
| `Separator`      | Visual dividers                 |
| `Sheet`          | Side panels                     |
| `Sidebar`        | Application sidebars            |
| `Skeleton`       | Loading placeholders            |
| `Slider`         | Range sliders                   |
| `Sonner`         | Toast notifications             |
| `Switch`         | Toggle switches                 |
| `Table`          | Data tables                     |
| `Tabs`           | Tabbed interfaces               |
| `Textarea`       | Multi-line text input           |
| `Toggle`         | Toggle buttons                  |
| `Tooltip`        | Hover tooltips                  |

### Custom Components (3)

| Component     | Description                          |
| ------------- | ------------------------------------ |
| `Kanban`      | Drag-and-drop Kanban board (dnd-kit) |
| `Link`        | next-intl compatible link wrapper    |
| `MultiSelect` | Multi-select dropdown with badges    |

### Usage Example

```typescript
"use client";

import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@carlonicora/nextjs-jsonapi/components";
import { cn } from "@carlonicora/nextjs-jsonapi/core";

export function ArticleCard({ article, className }) {
  return (
    <Card className={cn("hover:shadow-lg transition-shadow", className)}>
      <CardHeader>
        <CardTitle>{article.title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p>{article.excerpt}</p>

        <Dialog>
          <DialogTrigger>
            <Button variant="outline">Read More</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{article.title}</DialogTitle>
            </DialogHeader>
            <p>{article.content}</p>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
```

## Tailwind CSS Configuration

**Important for Tailwind v4**: You must add the `@source` directive to your `globals.css` to ensure Tailwind scans the package's component files:

```css
/* apps/web/src/app/globals.css */
@import "tailwindcss";
@import "tw-animate-css";

/* Include package source files for Tailwind to scan */
@source "../../../../packages/nextjs-jsonapi/src/**/*.{ts,tsx}";

@custom-variant dark (&:is(.dark *));

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  /* ... other theme variables */
}
```

The `@source` path should be relative from your `globals.css` to the package's `src` directory.

## CSS Variables

The shadcn/ui components require CSS variables to be defined in your application. Add these to your `globals.css`:

```css
:root {
  /* Background & Foreground */
  --background: oklch(1 0 0);
  --foreground: oklch(0.145 0 0);

  /* Primary */
  --primary: oklch(0.205 0 0);
  --primary-foreground: oklch(0.985 0 0);

  /* Secondary */
  --secondary: oklch(0.97 0 0);
  --secondary-foreground: oklch(0.205 0 0);

  /* Muted */
  --muted: oklch(0.97 0 0);
  --muted-foreground: oklch(0.556 0 0);

  /* Accent */
  --accent: oklch(0.97 0 0);
  --accent-foreground: oklch(0.205 0 0);

  /* Destructive */
  --destructive: oklch(0.577 0.245 27.325);
  --destructive-foreground: oklch(0.985 0 0);

  /* Border & Input */
  --border: oklch(0.922 0 0);
  --input: oklch(0.922 0 0);
  --ring: oklch(0.708 0 0);

  /* Card & Popover */
  --card: oklch(1 0 0);
  --card-foreground: oklch(0.145 0 0);
  --popover: oklch(1 0 0);
  --popover-foreground: oklch(0.145 0 0);

  /* Charts */
  --chart-1: oklch(0.646 0.222 41.116);
  --chart-2: oklch(0.6 0.118 184.704);
  --chart-3: oklch(0.398 0.07 227.392);
  --chart-4: oklch(0.828 0.189 84.429);
  --chart-5: oklch(0.769 0.188 70.08);

  /* Sidebar */
  --sidebar: oklch(0.985 0 0);
  --sidebar-foreground: oklch(0.145 0 0);
  --sidebar-primary: oklch(0.205 0 0);
  --sidebar-primary-foreground: oklch(0.985 0 0);
  --sidebar-accent: oklch(0.97 0 0);
  --sidebar-accent-foreground: oklch(0.205 0 0);
  --sidebar-border: oklch(0.922 0 0);
  --sidebar-ring: oklch(0.708 0 0);

  /* Warning */
  --warning: oklch(0.84 0.16 84);
  --warning-foreground: oklch(0.28 0.07 46);

  /* Radius */
  --radius: 0.625rem;
}

.dark {
  --background: oklch(0.145 0 0);
  --foreground: oklch(0.985 0 0);
  --card: oklch(0.205 0 0);
  --card-foreground: oklch(0.985 0 0);
  --popover: oklch(0.269 0 0);
  --popover-foreground: oklch(0.985 0 0);
  --primary: oklch(0.922 0 0);
  --primary-foreground: oklch(0.205 0 0);
  --secondary: oklch(0.269 0 0);
  --secondary-foreground: oklch(0.985 0 0);
  --muted: oklch(0.269 0 0);
  --muted-foreground: oklch(0.708 0 0);
  --accent: oklch(0.269 0 0);
  --accent-foreground: oklch(0.985 0 0);
  --destructive: oklch(0.704 0.191 22.216);
  --destructive-foreground: oklch(0.985 0 0);
  --border: oklch(1 0 0 / 10%);
  --input: oklch(1 0 0 / 15%);
  --ring: oklch(0.556 0 0);
  /* ... other dark mode values */
}
```

## License

This project is licensed under GPL v3 for open source use.

For commercial/closed-source licensing, contact: [@carlonicora](https://github.com/carlonicora)

## Author

Carlo Nicora - [@carlonicora](https://github.com/carlonicora)
