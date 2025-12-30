/**
 * Templates Index
 *
 * Exports all template generators.
 */

// Data layer templates
export {
  generateInterfaceTemplate,
  generateModelTemplate,
  generateServiceTemplate,
  generateFieldsTemplate,
} from "./data";

// Component templates
export {
  generateEditorTemplate,
  generateDeleterTemplate,
  generateSelectorTemplate,
  generateMultiSelectorTemplate,
  generateListTemplate,
  generateDetailsTemplate,
  generateContentTemplate,
  generateContainerTemplate,
  generateListContainerTemplate,
} from "./components";

// Context, hooks, module templates
export { generateContextTemplate } from "./context.template";
export { generateTableHookTemplate } from "./table-hook.template";
export { generateModuleTemplate } from "./module.template";

// Page templates
export { generateListPageTemplate, generateDetailPageTemplate } from "./pages";

// Project setup templates
export { generateBootstrapperTemplate } from "./project/bootstrapper.template";
export { generateEnvTemplate } from "./project/env.template";
export { generateMiddlewareEnvTemplate } from "./project/middleware-env.template";
export { generateMainLayoutTemplate } from "./project/main-layout.template";
export { generateSettingsContextTemplate } from "./project/settings-context.template";
export { generateSettingsContainerTemplate } from "./project/settings-container.template";
export { generateSettingsPageTemplate } from "./project/settings-page.template";
export { generateSettingsModulePageTemplate } from "./project/settings-module-page.template";
