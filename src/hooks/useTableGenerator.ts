"use client";

import { UseTableStructureHook, UseTableStructureHookParams, UseTableStructureHookReturn } from "./types";
import { ModuleWithPermissions } from "../permissions";
import { tableGeneratorRegistry } from "./TableGeneratorRegistry";

export function registerTableGenerator<T, U>(type: ModuleWithPermissions, hook: UseTableStructureHook<T, U>): void {
  tableGeneratorRegistry.register(type.name, hook);
}

export function useTableGenerator<T, U>(
  type: ModuleWithPermissions,
  params: UseTableStructureHookParams<T, U>,
): UseTableStructureHookReturn<T> {
  return tableGeneratorRegistry.get(type.name, params);
}
