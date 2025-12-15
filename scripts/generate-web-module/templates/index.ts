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
