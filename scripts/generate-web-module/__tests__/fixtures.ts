import { FrontendRelationship, FrontendTemplateData } from "../types/template-data.interface";

export function makeRelationship(o: Partial<FrontendRelationship> = {}): FrontendRelationship {
  return {
    name: "Account", variant: undefined, alias: undefined, directory: "crm",
    single: true, nullable: false, isFoundation: false,
    formFieldId: "account", formFieldIdPlural: "accounts", payloadFieldId: "accountId",
    selectorComponent: "AccountSelector", zodSchema: "entityObjectSchema",
    importPath: "@/features/crm/account/components/forms/AccountSelector",
    interfaceImportPath: "@/features/crm/account/data/AccountInterface",
    serviceImportPath: "@/features/crm/account/data/AccountService",
    interfaceName: "AccountInterface", modelKebab: "account",
    fields: undefined, targetHasName: true, dtoKey: "", showInTable: false,
    ...o,
  };
}

export function makeFrontendData(o: Partial<FrontendTemplateData> = {}): FrontendTemplateData {
  return {
    names: {
      pascalCase: "Widget", camelCase: "widget", kebabCase: "widget",
      pluralPascal: "Widgets", pluralCamel: "widgets", pluralKebab: "widgets",
      titleCase: "Widget", pluralTitleCase: "Widgets",
    },
    moduleId: "00000000-0000-4000-a000-000000000001",
    endpoint: "widgets", targetDir: "features/demo", importTargetDir: "demo",
    extendsContent: false,
    fields: [
      { name: "name", type: "string", tsType: "string", zodSchema: "z.string()", formComponent: "FormInput", nullable: false, isContentField: false },
      { name: "due_date", type: "date", tsType: "Date", zodSchema: "z.date().optional()", formComponent: "DatePicker", nullable: true, isContentField: false },
    ],
    relationships: [],
    i18nKeys: { moduleName: "widget", fields: {}, relationships: {}, type: { singular: "Widget", plural: "Widgets", icuPlural: "" } },
    imports: { models: [], selectors: [], library: [] },
    tableFieldNames: [],
    relationshipServiceMethods: [],
    featureId: undefined,
    displayProp: "name",
    containerTabs: { activity: true, relations: [] },
    relatedInclusions: [],
    ...o,
  };
}
