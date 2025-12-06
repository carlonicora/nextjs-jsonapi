import { ApiRequestDataTypeInterface } from "../core/interfaces/ApiRequestDataTypeInterface";
import { FieldSelector } from "../core/fields/FieldSelector";

/**
 * Permission actions
 */
export enum Action {
  Read = "read",
  Create = "create",
  Update = "update",
  Delete = "delete",
}

/**
 * Generic permission check type.
 * Can be a boolean or a function that checks permissions dynamically.
 * @template T - The data type being checked
 * @template U - The user type (defaults to PermissionUser)
 */
export type PermissionCheck<T, U = PermissionUser> = boolean | ((user?: U | string, data?: T) => boolean);

/**
 * Page URL configuration for modules
 */
export type PageUrl = {
  pageUrl?: string;
};

/**
 * Module permission definition wrapper
 */
export type ModulePermissionDefinition<T> = {
  interface: T;
};

/**
 * Base module definition
 */
export type ModuleDefinition = {
  pageUrl?: string;
  name: string;
  model: any;
  feature?: string;
  moduleId?: string;
};

/**
 * Permission configuration for a module.
 * Can be a boolean (allow/deny all) or a string path for dynamic checks.
 */
export interface PermissionConfig {
  create: boolean | string;
  read: boolean | string;
  update: boolean | string;
  delete: boolean | string;
}

/**
 * Generic interface for a module that has permissions.
 * Apps should ensure their Module class implements this.
 */
export interface PermissionModule {
  id: string;
  permissions: PermissionConfig;
}

/**
 * Generic interface for a user that has modules with permissions.
 * Apps should ensure their User class implements this.
 */
export interface PermissionUser {
  id: string;
  modules: PermissionModule[];
}

/**
 * Module definition with permissions - extends ApiRequestDataTypeInterface
 */
export type ModuleWithPermissions = ApiRequestDataTypeInterface & {
  pageUrl?: string;
  feature?: string;
  moduleId?: string;
  inclusions?: Record<
    string,
    {
      types?: string[];
      fields?: FieldSelector<any>[];
    }
  >;
};

/**
 * Factory type for creating module definitions
 */
export type ModuleFactory = (params: {
  pageUrl?: string;
  name: string;
  cache?: string | "days" | "default" | "hours" | "max" | "minutes" | "seconds" | "weeks";
  model: any;
  feature?: string;
  moduleId?: string;
  inclusions?: Record<
    string,
    {
      types?: string[];
      fields?: FieldSelector<any>[];
    }
  >;
}) => ModuleWithPermissions;
