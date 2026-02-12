"use client";

import { UseTableStructureHook, UseTableStructureHookParams, UseTableStructureHookReturn } from "./types";

type TableGeneratorHook = UseTableStructureHook<any, any>;

export class TableGeneratorRegistry {
  private static instance: TableGeneratorRegistry;
  private registry = new Map<string, TableGeneratorHook>();

  private constructor() {}

  public static getInstance(): TableGeneratorRegistry {
    if (!TableGeneratorRegistry.instance) {
      TableGeneratorRegistry.instance = new TableGeneratorRegistry();
    }
    return TableGeneratorRegistry.instance;
  }

  public register<T, U>(type: string, hook: UseTableStructureHook<T, U>): void {
    this.registry.set(type, hook as TableGeneratorHook);
  }

  public get<T, U>(type: string, params: UseTableStructureHookParams<T, U>): UseTableStructureHookReturn<T> {
    const hook = this.registry.get(type);
    if (!hook) {
      throw new Error(
        `Table generator for type "${type}" is not registered. Available types: ${Array.from(this.registry.keys()).join(
          ", ",
        )}`,
      );
    }
    return hook(params);
  }

  public isRegistered(type: string): boolean {
    return this.registry.has(type);
  }

  public getRegisteredTypes(): string[] {
    return Array.from(this.registry.keys());
  }

  public unregister(type: string): boolean {
    return this.registry.delete(type);
  }

  public clear(): void {
    this.registry.clear();
  }
}

export const tableGeneratorRegistry = TableGeneratorRegistry.getInstance();
