# @carlonicora/nextjs-jsonapi

A comprehensive Next.js package providing JSON:API compliant client with unified server/client support, automatic caching, and a complete shadcn/ui component library.

## Table of Contents

- [Features](#features)
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

The library is organized into eight entry points:

```
@carlonicora/nextjs-jsonapi
├── (main)          # Unified API (auto-detects environment)
├── /core           # Interfaces, factories, registries, and utilities
├── /client         # React hooks and client-side utilities
├── /server         # Server-side requests and caching
├── /permissions    # Permission checking utilities
├── /features       # Built-in feature modules (S3, etc.)
├── /utils          # Utility functions (cn, useIsMobile, etc.)
└── /shadcnui       # 44 shadcn/ui components
```

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
| `next`            | >=14.0.0 | Yes      | Next.js framework                   |
| `react`           | >=18.0.0 | Yes      | React library                       |
| `react-dom`       | >=18.0.0 | Yes      | React DOM                           |
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
import { ModuleWithPermissions } from "@carlonicora/nextjs-jsonapi/permissions";
import { S3Module } from "@carlonicora/nextjs-jsonapi/features";

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
import { serverRequest, getServerToken, getCacheProfile } from "@carlonicora/nextjs-jsonapi/server";
```

### Permissions (`/permissions`)

Permission checking utilities:

```typescript
import {
  checkPermission,
  type PermissionCheck,
  type ModuleWithPermissions,
  type ModuleFactory,
} from "@carlonicora/nextjs-jsonapi/permissions";
```

### Features (`/features`)

Built-in feature modules that can be used directly in your application:

```typescript
import {
  // S3 Module (for file uploads via pre-signed URLs)
  S3Module, // Module definition factory
  S3Service, // Service with getPreSignedUrl, getSignedUrl, deleteFile
  S3, // Data class
  type S3Interface, // Response interface
  type S3Input, // Input parameters
} from "@carlonicora/nextjs-jsonapi/features";

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

### Utils (`/utils`)

Utility functions:

```typescript
import {
  cn, // Class name merger (clsx + tailwind-merge)
  composeRefs, // Compose multiple refs
  useComposedRefs, // Hook for composing refs
  useIsMobile, // Mobile detection hook
  type ClassValue, // Type for cn function
} from "@carlonicora/nextjs-jsonapi/utils";
```

### shadcn/ui (`/shadcnui`)

All shadcn/ui components (requires `"use client"`):

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
} from "@carlonicora/nextjs-jsonapi/shadcnui";
```

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
import { serverRequest, getServerToken, getCacheProfile } from "@carlonicora/nextjs-jsonapi/server";

export async function getArticle(id: string) {
  const token = await getServerToken();

  const data = await serverRequest({
    method: "GET",
    url: `${process.env.NEXT_PUBLIC_API_URL}/articles/${id}`,
    token,
    cache: getCacheProfile("articles"), // Get cache settings
    language: "en",
  });

  return data;
}
```

### Cache Profiles

The library supports Next.js 16+ caching via `cacheLife()` and `cacheTag()`:

```typescript
// In your module definition
export const Modules = {
  Article: {
    type: "articles",
    cache: "articles", // Profile name for caching
    factory: (data: any) => data,
  },
};

// The cache profile is automatically applied when using JsonApiGet
// on the server side
```

## Permissions

Check user permissions for protected resources:

```typescript
import { checkPermission } from "@carlonicora/nextjs-jsonapi/permissions";

// Check if user has permission
const canEdit = checkPermission({
  user: currentUser,
  action: "edit",
  resource: "articles",
  resourceId: article.id,
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
} from "@carlonicora/nextjs-jsonapi/shadcnui";
import { cn } from "@carlonicora/nextjs-jsonapi/utils";

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
