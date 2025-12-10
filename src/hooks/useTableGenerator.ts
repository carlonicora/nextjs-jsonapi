"use client";

import { UseTableStructureHook, UseTableStructureHookParams, UseTableStructureHookReturn } from "./types";
import { ModuleWithPermissions } from "../permissions";
import { tableGeneratorRegistry } from "./TableGeneratorRegistry";

export function registerTableGenerator<T, U>(
  type: string | ModuleWithPermissions,
  hook: UseTableStructureHook<T, U>,
): void {
  const name = typeof type === "string" ? type : type.name;
  tableGeneratorRegistry.register(name, hook);
}

export function useTableGenerator<T, U>(
  type: ModuleWithPermissions,
  params: UseTableStructureHookParams<T, U>,
): UseTableStructureHookReturn<T> {
  return tableGeneratorRegistry.get(type.name, params);
}
