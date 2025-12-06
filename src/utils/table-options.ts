import { Action, ModuleWithPermissions } from "../permissions";
import { cloneElement, createElement, Fragment, ReactElement } from "react";

export class TableOptions {
  private _components: ReactElement<any>[];
  private _hasPermissionToModule: <M extends ModuleWithPermissions>(params: {
    module: M;
    action: Action;
    data?: any;
  }) => boolean;

  constructor(
    hasPermissionToModule: <M extends ModuleWithPermissions>(params: {
      module: M;
      action: Action;
      data?: any;
    }) => boolean,
  ) {
    this._hasPermissionToModule = hasPermissionToModule;
    this._components = [];
  }

  addOption<M extends ModuleWithPermissions>(component: ReactElement<any> | null, module?: M, action?: Action): void {
    if (!component || (module && action && !this._hasPermissionToModule({ module, action }))) return;
    this._components.push(component);
  }

  getComponents(): ReactElement<any>[] {
    return this._components;
  }

  getOptions(): ReactElement<any> | null {
    if (this._components.length === 0) return null;

    const response: ReactElement<any>[] = this._components.map((option, index) =>
      cloneElement(option, { key: option.key ?? index }),
    );

    return createElement(Fragment, {}, response);
  }
}

export function getTableOptions(params: {
  hasPermissionToModule: <M extends ModuleWithPermissions>(params: {
    module: M;
    action: Action;
    data?: any;
  }) => boolean;
  options: { component: ReactElement<any> | null; module?: ModuleWithPermissions; action?: Action }[];
}): ReactElement<any> | null {
  const tableOptions = new TableOptions(params.hasPermissionToModule);
  params.options.forEach((option) => tableOptions.addOption(option.component, option.module, option.action));
  return tableOptions.getOptions();
}

export function getTableComponents(params: {
  hasPermissionToModule: <M extends ModuleWithPermissions>(params: {
    module: M;
    action: Action;
    data?: any;
  }) => boolean;
  options: { component: ReactElement<any> | null; module?: ModuleWithPermissions; action?: Action }[];
}): ReactElement<any>[] {
  const tableOptions = new TableOptions(params.hasPermissionToModule);
  params.options.forEach((option) => tableOptions.addOption(option.component, option.module, option.action));
  return tableOptions.getComponents();
}
