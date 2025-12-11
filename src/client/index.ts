"use client";

// Context and Provider
export * from "./context";

// Hooks
export * from "./hooks";

// Client-side request utilities
export * from "./request";
export * from "./token";

import { useCompanyTableStructure } from "../features/company/hooks";
// Table generator registration (must be in client-only context)
import { useRoleTableStructure } from "../features/role/hooks";
import { useUserTableStructure } from "../features/user/hooks";
import { registerTableGenerator } from "../hooks";

export * from "../features/role/hooks";
export * from "../features/user/hooks";

registerTableGenerator("roles", useRoleTableStructure);
registerTableGenerator("users", useUserTableStructure);
registerTableGenerator("companies", useCompanyTableStructure);
