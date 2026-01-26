# Frontend Architecture Guide: Next.js + JSON:API

> **For AI Assistants**: This document explains the frontend architecture patterns used in this codebase. Follow these patterns exactly. Deviating from them will produce broken, inconsistent code.

---

## Table of Contents

1. [Introduction & Core Principles](#1-introduction--core-principles)
2. [Models](#2-models)
3. [Interfaces](#3-interfaces)
4. [Services](#4-services)
5. [Input Types](#5-input-types)
6. [Complete Frontend Templates](#6-complete-frontend-templates)
7. [Frontend Anti-Patterns](#7-frontend-anti-patterns)

---

## 1. Introduction & Core Principles

This architecture provides **automatic, type-safe JSON:API compliance** for the frontend.

### Core Principles

1. **Type Safety**: All API responses are automatically converted to typed TypeScript objects
2. **No Manual Fetch**: NEVER use `fetch()` directly - always use `callApi()`
3. **Automatic Transformation**: Models handle JSON:API ↔ TypeScript conversion
4. **Avoid `overridesJsonApiCreation`**: Only use in rare edge cases (relationship metadata)

### Key Rules

> **NEVER use `fetch()` directly. ALWAYS use `callApi()` from AbstractService.**

> **Let the Model handle JSON:API creation. Avoid `overridesJsonApiCreation` unless absolutely necessary.**

The architecture handles all serialization/deserialization automatically through:
- **Model.rehydrate()** - Converts JSON:API response → TypeScript object
- **Model.createJsonApi()** - Converts TypeScript object → JSON:API request
- **AbstractService.callApi()** - Handles HTTP + automatic transformation

---

## 2. Models

Models extend `AbstractApiData` and implement two critical methods:
- `rehydrate()`: Converts JSON:API to TypeScript object (for GET responses)
- `createJsonApi()`: Converts TypeScript object to JSON:API (for POST/PUT requests)

### Model Pattern

```typescript
// Gallery.ts
import { AbstractApiData } from "@carlonicora/nextjs-jsonapi";
import { JsonApiHydratedDataInterface } from "@carlonicora/nextjs-jsonapi";
import { GalleryInput } from "./GalleryInput";
import { GalleryInterface, PersonRelationshipMeta } from "./GalleryInterface";
import { Modules } from "@/core/registry/Modules";
import { PersonInterface } from "../../person/data/PersonInterface";
import { PhotographInterface } from "../../photograph/data/PhotographInterface";
import { UserInterface } from "../../user/data/UserInterface";

export class Gallery extends AbstractApiData implements GalleryInterface {
  private _name?: string;
  private _description?: string;
  private _samplePhotographs?: string[];
  private _photoCount?: number;
  private _owner?: UserInterface;
  private _photographs?: PhotographInterface[];
  private _persons?: (PersonInterface & PersonRelationshipMeta)[];

  // Getters - provide typed access to private fields
  get name(): string { return this._name ?? ""; }
  get description(): string | undefined { return this._description; }
  get samplePhotographs(): string[] { return this._samplePhotographs ?? []; }
  get photoCount(): number { return this._photoCount ?? 0; }
  get owner(): UserInterface | undefined { return this._owner; }
  get photographs(): PhotographInterface[] { return this._photographs ?? []; }
  get persons(): (PersonInterface & PersonRelationshipMeta)[] { return this._persons ?? []; }

  /**
   * Deserialize JSON:API response into typed object
   * Called automatically by callApi() after receiving response
   */
  rehydrate(data: JsonApiHydratedDataInterface): this {
    super.rehydrate(data);

    // Simple attributes from JSON:API attributes
    this._name = data.jsonApi.attributes.name;
    this._description = data.jsonApi.attributes.description;
    this._samplePhotographs = data.jsonApi.attributes.samplePhotographs;

    // Meta fields (from JSON:API meta section)
    this._photoCount = data.jsonApi.meta?.photoCount;

    // Single relationship - use _readIncluded
    this._owner = this._readIncluded(data, "owner", Modules.User) as UserInterface;

    // Array relationship - use _readIncluded
    this._photographs = this._readIncluded(
      data,
      "photographs",
      Modules.Photograph
    ) as PhotographInterface[];

    // Relationship WITH edge metadata - use _readIncludedWithMeta
    this._persons = this._readIncludedWithMeta<PersonInterface, PersonRelationshipMeta>(
      data,
      "persons",
      Modules.Person,
    ) as (PersonInterface & PersonRelationshipMeta)[];

    return this;
  }

  /**
   * Serialize TypeScript object to JSON:API for POST/PUT
   * Called automatically by callApi() before sending request
   */
  createJsonApi(data: GalleryInput) {
    const response: any = {
      data: {
        type: Modules.Gallery.name,
        id: data.id,
        attributes: {},
        relationships: {},
      },
      included: [],
    };

    // Set attributes - only if provided
    if (data.name !== undefined) response.data.attributes.name = data.name;
    if (data.description !== undefined) response.data.attributes.description = data.description;

    // Set single relationship
    if (data.ownerId) {
      response.data.relationships.owner = {
        data: {
          type: Modules.User.name,
          id: data.ownerId,
        },
      };
    }

    // Set array relationship
    if (data.photographIds && data.photographIds.length > 0) {
      response.data.relationships.photograph = {
        data: data.photographIds.map((id) => ({
          type: Modules.Photograph.name,
          id,
        })),
      };
    }

    return response;
  }
}
```

### Key Methods

| Method | Purpose | When Called |
|--------|---------|-------------|
| `rehydrate(data)` | Convert JSON:API → TypeScript | After GET response |
| `createJsonApi(data)` | Convert TypeScript → JSON:API | Before POST/PUT request |
| `_readIncluded(data, key, module)` | Read single or array relationship | In rehydrate() |
| `_readIncludedWithMeta(data, key, module)` | Read relationship with edge metadata | In rehydrate() |

### Reading Relationships

```typescript
// Single relationship (cardinality: one)
this._owner = this._readIncluded(data, "owner", Modules.User) as UserInterface;

// Array relationship (cardinality: many)
this._photographs = this._readIncluded(
  data,
  "photographs",
  Modules.Photograph
) as PhotographInterface[];

// Relationship with edge metadata (e.g., position, expiration, access code)
this._persons = this._readIncludedWithMeta<PersonInterface, PersonRelationshipMeta>(
  data,
  "persons",
  Modules.Person,
) as (PersonInterface & PersonRelationshipMeta)[];
```

### Edge Metadata

When relationships have properties stored on the edge (like `position`, `code`, `expiresAt`), the API returns them in the relationship's `data.meta`:

```json
{
  "relationships": {
    "persons": {
      "data": [
        {
          "type": "persons",
          "id": "person-1",
          "meta": {
            "code": "ABC123",
            "completed": false,
            "expiresAt": "2025-12-31"
          }
        }
      ]
    }
  }
}
```

Use `_readIncludedWithMeta` to access both the entity data AND the edge metadata:

```typescript
// After rehydration, you can access both entity and edge properties
gallery.persons.forEach(person => {
  console.log(person.name);      // From Person entity
  console.log(person.code);      // From relationship meta
  console.log(person.completed); // From relationship meta
});
```

---

## 3. Interfaces

Interfaces define the type contract for models. They extend `ApiDataInterface`.

```typescript
// GalleryInterface.ts
import { ApiDataInterface } from "@carlonicora/nextjs-jsonapi";
import { PersonInterface } from "../../person/data/PersonInterface";
import { PhotographInterface } from "../../photograph/data/PhotographInterface";
import { UserInterface } from "../../user/data/UserInterface";

// Edge metadata interface for person relationship
export interface PersonRelationshipMeta {
  code: string;
  completed: boolean;
  expiresAt?: string;
}

export interface GalleryInterface extends ApiDataInterface {
  get name(): string;
  get description(): string | undefined;
  get samplePhotographs(): string[];
  get photoCount(): number;
  get owner(): UserInterface | undefined;
  get photographs(): PhotographInterface[];
  get persons(): (PersonInterface & PersonRelationshipMeta)[];
}
```

### Interface Rules

1. **Always extend `ApiDataInterface`** - provides base properties like `id`, `type`
2. **Use getters** - matches the Model implementation
3. **Define relationship types explicitly** - include edge metadata types where needed
4. **Optional properties** use `| undefined` - matches possible null values

---

## 4. Services

Services handle API communication. They extend `AbstractService` and use `callApi()`.

### CRITICAL RULES

1. **ALWAYS use `callApi()`** - NEVER use `fetch()` directly
2. **Avoid `overridesJsonApiCreation`** - only for edge property metadata
3. **Use `EndpointCreator`** for building URLs
4. **Pass `input` for POST/PUT** - model handles JSON:API conversion

### Service Pattern

```typescript
// GalleryService.ts
import { AbstractService, EndpointCreator, HttpMethod } from "@carlonicora/nextjs-jsonapi";
import { GalleryInput } from "./GalleryInput";
import { GalleryInterface } from "./GalleryInterface";
import { Modules } from "@/core/registry/Modules";

export class GalleryService extends AbstractService {
  /**
   * GET single gallery by ID
   */
  static async findOne(params: { id: string }): Promise<GalleryInterface> {
    return this.callApi<GalleryInterface>({
      type: Modules.Gallery,
      method: HttpMethod.GET,
      endpoint: new EndpointCreator({
        endpoint: Modules.Gallery,
        id: params.id,
      }).generate(),
    });
  }

  /**
   * GET list of galleries
   */
  static async findMany(params: {
    search?: string;
    fetchAll?: boolean;
  } = {}): Promise<GalleryInterface[]> {
    const endpoint = new EndpointCreator({ endpoint: Modules.Gallery });

    if (params.fetchAll) endpoint.addAdditionalParam("fetchAll", "true");
    if (params.search) endpoint.addAdditionalParam("search", params.search);

    return this.callApi({
      type: Modules.Gallery,
      method: HttpMethod.GET,
      endpoint: endpoint.generate(),
    });
  }

  /**
   * GET galleries by owner (nested endpoint)
   */
  static async findManyByOwner(params: { ownerId: string }): Promise<GalleryInterface[]> {
    return this.callApi({
      type: Modules.Gallery,
      method: HttpMethod.GET,
      endpoint: new EndpointCreator({
        endpoint: Modules.User,
        id: params.ownerId,
        childEndpoint: Modules.Gallery,
      }).generate(),
    });
  }

  /**
   * POST create new gallery
   */
  static async create(params: GalleryInput): Promise<GalleryInterface> {
    return this.callApi({
      type: Modules.Gallery,
      method: HttpMethod.POST,
      endpoint: new EndpointCreator({ endpoint: Modules.Gallery }).generate(),
      input: params,  // Model.createJsonApi() handles conversion automatically
    });
  }

  /**
   * PUT update gallery
   */
  static async update(params: GalleryInput): Promise<GalleryInterface> {
    return this.callApi({
      type: Modules.Gallery,
      method: HttpMethod.PUT,
      endpoint: new EndpointCreator({
        endpoint: Modules.Gallery,
        id: params.id,
      }).generate(),
      input: params,  // Model.createJsonApi() handles conversion automatically
    });
  }

  /**
   * DELETE gallery
   */
  static async delete(params: { id: string }): Promise<void> {
    await this.callApi({
      type: Modules.Gallery,
      method: HttpMethod.DELETE,
      endpoint: new EndpointCreator({
        endpoint: Modules.Gallery,
        id: params.id,
      }).generate(),
    });
  }
}
```

### WRONG vs RIGHT Examples

```typescript
// ❌ WRONG - Using fetch directly
static async findOne(id: string) {
  const response = await fetch(`/api/galleries/${id}`);
  const json = await response.json();
  return json.data;  // Raw JSON:API, not typed!
}

// ✅ CORRECT - Using callApi
static async findOne(params: { id: string }): Promise<GalleryInterface> {
  return this.callApi<GalleryInterface>({
    type: Modules.Gallery,
    method: HttpMethod.GET,
    endpoint: new EndpointCreator({
      endpoint: Modules.Gallery,
      id: params.id,
    }).generate(),
  });  // Returns typed GalleryInterface, auto-rehydrated!
}
```

```typescript
// ❌ WRONG - Unnecessary overridesJsonApiCreation
static async create(data: GalleryInput) {
  return this.callApi({
    method: HttpMethod.POST,
    endpoint: "galleries",
    input: {
      data: {
        type: "galleries",
        id: data.id,
        attributes: { name: data.name },
      }
    },
    overridesJsonApiCreation: true,  // UNNECESSARY!
  });
}

// ✅ CORRECT - Let model handle JSON:API
static async create(params: GalleryInput): Promise<GalleryInterface> {
  return this.callApi({
    type: Modules.Gallery,
    method: HttpMethod.POST,
    endpoint: new EndpointCreator({ endpoint: Modules.Gallery }).generate(),
    input: params,  // Model.createJsonApi() handles it automatically
  });
}
```

### When `overridesJsonApiCreation` IS Acceptable

Only use `overridesJsonApiCreation: true` when:

1. **Edge properties on relationships** - Custom meta for relationship operations
2. **Special endpoint operations** - Non-standard POST bodies (e.g., auth endpoints)
3. **Bulk operations** - Operations that don't follow entity CRUD pattern

```typescript
// ✅ ACCEPTABLE - Edge properties for relationship
static async addReviewer(params: {
  galleryId: string;
  personId: string;
  code: string;
  expiresAt?: string;
}): Promise<GalleryInterface> {
  return this.callApi({
    type: Modules.Gallery,
    method: HttpMethod.POST,
    endpoint: new EndpointCreator({
      endpoint: Modules.Gallery,
      id: params.galleryId,
      childEndpoint: Modules.Person,
      childId: params.personId,
    }).generate(),
    input: {
      data: {
        meta: {
          code: params.code,
          completed: false,
          expiresAt: params.expiresAt,
        },
      },
    },
    overridesJsonApiCreation: true,  // OK - custom meta structure for edge properties
  });
}

// ✅ ACCEPTABLE - Custom auth endpoint
static async login(params: { email: string; password: string }): Promise<AuthInterface> {
  return this.callApi({
    type: Modules.Auth,
    method: HttpMethod.POST,
    endpoint: new EndpointCreator({ endpoint: Modules.Auth }).generate(),
    input: {
      email: params.email,
      password: params.password,
    },
    overridesJsonApiCreation: true,  // OK - non-standard auth body
  });
}
```

### EndpointCreator Usage

```typescript
// Simple endpoint: /galleries
new EndpointCreator({ endpoint: Modules.Gallery }).generate()

// With ID: /galleries/123
new EndpointCreator({ endpoint: Modules.Gallery, id: "123" }).generate()

// Nested endpoint: /users/456/galleries
new EndpointCreator({
  endpoint: Modules.User,
  id: "456",
  childEndpoint: Modules.Gallery,
}).generate()

// Nested with child ID: /galleries/123/persons/789
new EndpointCreator({
  endpoint: Modules.Gallery,
  id: "123",
  childEndpoint: Modules.Person,
  childId: "789",
}).generate()

// With query parameters
const endpoint = new EndpointCreator({ endpoint: Modules.Gallery });
endpoint.addAdditionalParam("search", "summer");
endpoint.addAdditionalParam("fetchAll", "true");
endpoint.generate()  // /galleries?search=summer&fetchAll=true
```

---

## 5. Input Types

Input types define the structure for create/update operations.

```typescript
// GalleryInput.ts
export type GalleryInput = {
  id: string;
  name: string;
  description?: string;
  ownerId: string;
  photographIds?: string[];
  personIds?: string[];
};
```

### Input Type Rules

1. **Include `id`** - UUIDs are generated client-side
2. **Use relationship IDs** - Not full objects, just IDs (`ownerId`, not `owner`)
3. **Arrays use plural naming** - `photographIds`, `personIds`
4. **Optional fields use `?`** - Match API requirements

---

## 6. Complete Frontend Templates

### Step 1: Create Interface

```typescript
// src/features/[domain]/data/ExampleInterface.ts
import { ApiDataInterface } from "@carlonicora/nextjs-jsonapi";
import { UserInterface } from "../../user/data/UserInterface";

export interface ExampleInterface extends ApiDataInterface {
  get name(): string;
  get description(): string | undefined;
  get owner(): UserInterface | undefined;
}
```

### Step 2: Create Input Type

```typescript
// src/features/[domain]/data/ExampleInput.ts
export type ExampleInput = {
  id: string;
  name: string;
  description?: string;
  ownerId: string;
};
```

### Step 3: Create Model

```typescript
// src/features/[domain]/data/Example.ts
import { AbstractApiData, JsonApiHydratedDataInterface } from "@carlonicora/nextjs-jsonapi";
import { ExampleInput } from "./ExampleInput";
import { ExampleInterface } from "./ExampleInterface";
import { Modules } from "@/core/registry/Modules";
import { UserInterface } from "../../user/data/UserInterface";

export class Example extends AbstractApiData implements ExampleInterface {
  private _name?: string;
  private _description?: string;
  private _owner?: UserInterface;

  get name(): string { return this._name ?? ""; }
  get description(): string | undefined { return this._description; }
  get owner(): UserInterface | undefined { return this._owner; }

  rehydrate(data: JsonApiHydratedDataInterface): this {
    super.rehydrate(data);

    this._name = data.jsonApi.attributes.name;
    this._description = data.jsonApi.attributes.description;
    this._owner = this._readIncluded(data, "owner", Modules.User) as UserInterface;

    return this;
  }

  createJsonApi(data: ExampleInput) {
    const response: any = {
      data: {
        type: Modules.Example.name,
        id: data.id,
        attributes: {},
        relationships: {},
      },
      included: [],
    };

    if (data.name !== undefined) response.data.attributes.name = data.name;
    if (data.description !== undefined) response.data.attributes.description = data.description;

    if (data.ownerId) {
      response.data.relationships.owner = {
        data: { type: Modules.User.name, id: data.ownerId },
      };
    }

    return response;
  }
}
```

### Step 4: Create Service

```typescript
// src/features/[domain]/data/ExampleService.ts
import { AbstractService, EndpointCreator, HttpMethod } from "@carlonicora/nextjs-jsonapi";
import { ExampleInput } from "./ExampleInput";
import { ExampleInterface } from "./ExampleInterface";
import { Modules } from "@/core/registry/Modules";

export class ExampleService extends AbstractService {
  static async findOne(params: { id: string }): Promise<ExampleInterface> {
    return this.callApi<ExampleInterface>({
      type: Modules.Example,
      method: HttpMethod.GET,
      endpoint: new EndpointCreator({
        endpoint: Modules.Example,
        id: params.id,
      }).generate(),
    });
  }

  static async findMany(params: { search?: string; fetchAll?: boolean } = {}): Promise<ExampleInterface[]> {
    const endpoint = new EndpointCreator({ endpoint: Modules.Example });
    if (params.fetchAll) endpoint.addAdditionalParam("fetchAll", "true");
    if (params.search) endpoint.addAdditionalParam("search", params.search);

    return this.callApi({
      type: Modules.Example,
      method: HttpMethod.GET,
      endpoint: endpoint.generate(),
    });
  }

  static async create(params: ExampleInput): Promise<ExampleInterface> {
    return this.callApi({
      type: Modules.Example,
      method: HttpMethod.POST,
      endpoint: new EndpointCreator({ endpoint: Modules.Example }).generate(),
      input: params,
    });
  }

  static async update(params: ExampleInput): Promise<ExampleInterface> {
    return this.callApi({
      type: Modules.Example,
      method: HttpMethod.PUT,
      endpoint: new EndpointCreator({
        endpoint: Modules.Example,
        id: params.id,
      }).generate(),
      input: params,
    });
  }

  static async delete(params: { id: string }): Promise<void> {
    await this.callApi({
      type: Modules.Example,
      method: HttpMethod.DELETE,
      endpoint: new EndpointCreator({
        endpoint: Modules.Example,
        id: params.id,
      }).generate(),
    });
  }
}
```

### Step 5: Register in Modules

```typescript
// src/core/registry/Modules.ts
// Add to the existing Modules registry
Example: {
  name: "examples",
  model: Example,
},
```

---

## 7. Frontend Anti-Patterns

| Anti-Pattern | Why It's Wrong | Correct Approach |
|--------------|---------------|------------------|
| Using `fetch()` directly | No type safety, no rehydration | Use `callApi()` |
| Using `overridesJsonApiCreation` unnecessarily | Bypasses model validation | Let model handle it via `input` |
| Manual JSON:API construction | Error-prone, inconsistent | Use `Model.createJsonApi()` |
| Not implementing `rehydrate()` | Breaks deserialization | Always implement `rehydrate()` |
| Not implementing `createJsonApi()` | Breaks serialization | Always implement `createJsonApi()` |
| Accessing `data.jsonApi.data.*` directly | Bypasses type system | Use typed getters after rehydrate |
| Hardcoding endpoint strings | Inconsistent, error-prone | Use `EndpointCreator` |
| Not using Modules registry | Breaks model resolution | Register all entities in Modules |

### When NOT to Use `overridesJsonApiCreation`

```typescript
// ❌ WRONG - Standard CRUD, don't override
static async create(data: ExampleInput) {
  return this.callApi({
    type: Modules.Example,
    method: HttpMethod.POST,
    input: {
      data: {
        type: "examples",
        id: data.id,
        attributes: { name: data.name },
      }
    },
    overridesJsonApiCreation: true,  // UNNECESSARY!
  });
}

// ❌ WRONG - Standard update, don't override
static async update(data: ExampleInput) {
  return this.callApi({
    type: Modules.Example,
    method: HttpMethod.PUT,
    input: {
      data: {
        type: "examples",
        id: data.id,
        attributes: { name: data.name },
      }
    },
    overridesJsonApiCreation: true,  // UNNECESSARY!
  });
}
```

### When TO Use `overridesJsonApiCreation`

```typescript
// ✅ OK - Custom relationship edge properties
static async addPhoto(params: { galleryId: string; photoId: string; position: number }) {
  return this.callApi({
    method: HttpMethod.POST,
    endpoint: new EndpointCreator({
      endpoint: Modules.Gallery,
      id: params.galleryId,
      childEndpoint: Modules.Photograph,
      childId: params.photoId,
    }).generate(),
    input: {
      data: {
        meta: { position: params.position },
      },
    },
    overridesJsonApiCreation: true,
  });
}

// ✅ OK - Custom PATCH with specific fields
static async updateSelection(params: { id: string; selected: boolean }) {
  return this.callApi({
    method: HttpMethod.PATCH,
    endpoint: new EndpointCreator({
      endpoint: Modules.Photograph,
      id: params.id,
      childEndpoint: "selection",
    }).generate(),
    input: {
      data: {
        meta: { selected: params.selected },
      },
    },
    overridesJsonApiCreation: true,
  });
}
```

---

## Summary

This frontend architecture provides:

1. **Type Safety**: All API responses converted to typed TypeScript objects
2. **Automatic Transformation**: Models handle JSON:API ↔ TypeScript
3. **Consistency**: Standardized service patterns with `callApi()`
4. **Simplicity**: Pass input objects, get typed responses

**Follow these patterns exactly. Deviating creates broken, inconsistent code.**
