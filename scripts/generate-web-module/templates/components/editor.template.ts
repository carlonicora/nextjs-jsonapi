/**
 * Editor Template
 *
 * Generates {Module}Editor.tsx using EditorSheet component.
 */

import { FrontendTemplateData, FrontendField, FrontendRelationship } from "../../types/template-data.interface";
import { toCamelCase, pluralize, toPascalCase } from "../../transformers/name-transformer";
import { AUTHOR_VARIANT } from "../../types/field-mapping.types";
import { getFormFieldJsx } from "../../transformers/field-mapper";
import {
  getRelationshipFormJsx,
  getDefaultValueExpression,
  getPayloadMapping,
  isFoundationImport,
  FOUNDATION_COMPONENTS_PACKAGE,
} from "../../transformers/relationship-resolver";

/**
 * Generate the editor component file content
 *
 * @param data - Frontend template data
 * @returns Generated file content
 */
export function generateEditorTemplate(data: FrontendTemplateData): string {
  const { names, fields, relationships, extendsContent } = data;
  const hasNameField = extendsContent || fields.some((f) => f.name === "name");
  const i18nKey = names.pluralCamel.toLowerCase();

  const imports = generateImports(data);
  const propsType = generatePropsType(data);
  const formSchema = generateFormSchema(data);
  const defaultValues = generateDefaultValues(data);
  const onSubmitBody = generateOnSubmitBody(data);
  const formFields = generateFormFields(data);

  const hasAuthor = relationships.some((r) => r.variant === AUTHOR_VARIANT);

  return `"use client";

${imports}

${propsType}

function ${names.pascalCase}EditorInternal({
  ${names.camelCase},
  propagateChanges,
  trigger,
  forceShow,
  onClose,
  dialogOpen,
  onDialogOpenChange,
}: ${names.pascalCase}EditorProps) {
  const router = useRouter();
  const t = useTranslations();
${hasAuthor ? `  const { currentUser } = useCurrentUserContext<UserInterface>();` : ""}

${formSchema}

${defaultValues}

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: getDefaultValues(),
  });

  const { dirtyFields } = form.formState;

  const isFormDirty = useCallback(() => {
    return Object.keys(dirtyFields).length > 0;
  }, [dirtyFields]);
${
  hasAuthor
    ? `
  useEffect(() => {
    if (currentUser && !form.getValues("author")?.id) {
      form.setValue("author", { id: currentUser.id, name: currentUser.name, avatar: currentUser.avatar });
    }
  }, [currentUser]);
`
    : ""
}
  return (
    <EditorSheet
      form={form}
      entityType={t(\`entities.${i18nKey}\`, { count: 1 })}${hasNameField ? `
      entityName={${names.camelCase}?.name}` : ""}
      isEdit={!!${names.camelCase}}
      module={Modules.${names.pascalCase}}
      propagateChanges={propagateChanges}
      isFormDirty={isFormDirty}
      onSubmit={async (values) => {
${onSubmitBody}
      }}
      onRevalidate={revalidatePaths}
      onNavigate={(url) => router.push(url)}
      onReset={() => getDefaultValues()}
      onClose={onClose}
      trigger={trigger}
      forceShow={forceShow}
      dialogOpen={dialogOpen}
      onDialogOpenChange={onDialogOpenChange}
    >
${formFields}
    </EditorSheet>
  );
}

export default function ${names.pascalCase}Editor(props: ${names.pascalCase}EditorProps) {
  const { hasPermissionToModule } = useCurrentUserContext();
  const action = props.${names.camelCase} ? Action.Update : Action.Create;

  if (!hasPermissionToModule({ module: Modules.${names.pascalCase}, action, data: props.${names.camelCase} })) return null;

  return <${names.pascalCase}EditorInternal {...props} />;
}
`;
}

/**
 * Generate import statements
 */
function generateImports(data: FrontendTemplateData): string {
  const { names, relationships, fields, extendsContent } = data;
  const imports: string[] = [];

  // Module imports
  imports.push(
    `import { ${names.pascalCase}Input, ${names.pascalCase}Interface } from "@/features/${data.importTargetDir}/${names.kebabCase}/data/${names.pascalCase}Interface";`,
  );
  imports.push(
    `import { ${names.pascalCase}Service } from "@/features/${data.importTargetDir}/${names.kebabCase}/data/${names.pascalCase}Service";`,
  );

  // Relationship selector imports (deduplicated - multiple aliases may target the same entity)
  const hasAuthor = relationships.some((r) => r.variant === AUTHOR_VARIANT);
  const seenImports = new Set<string>();

  relationships.forEach((rel) => {
    if (rel.variant === AUTHOR_VARIANT) {
      if (!seenImports.has("UserInterface")) {
        seenImports.add("UserInterface");
        imports.push(`import { UserInterface } from "@/features/foundations/user/data/UserInterface";`);
      }
    } else {
      // Foundation components use MultiSelect, generated modules use MultiSelector
      const componentName = rel.single
        ? `${rel.name}Selector`
        : (rel.isFoundation ? `${rel.name}MultiSelect` : `${rel.name}MultiSelector`);
      if (seenImports.has(componentName)) return;
      seenImports.add(componentName);
      if (rel.isFoundation) {
        imports.push(`import { ${componentName} } from "${FOUNDATION_COMPONENTS_PACKAGE}";`);
      } else {
        imports.push(`import ${componentName} from "${rel.importPath}";`);
      }
    }
  });

  // Router import
  imports.push(`import { useRouter } from "@/i18n/routing";`);

  // Utility imports
  imports.push(`import { revalidatePaths } from "@/utils/revalidation";`);

  // Library component imports
  const componentImports: string[] = ["EditorSheet"];

  // Check for field types that need specific components
  const hasContentField = fields.some((f) => f.isContentField || f.name === "content");
  if (hasContentField) {
    componentImports.push("FormBlockNote");
  }

  const hasStringFields = fields.some((f) => f.formComponent === "FormInput" || f.formComponent === "FormInputNumber");
  if (hasStringFields) {
    componentImports.push("FormInput");
  }

  // Check if any relationship has boolean or date fields that need specific form components
  const hasRelBooleanFields = relationships.some((rel) => rel.fields?.some((f) => f.type === "boolean"));
  const hasRelDateFields = relationships.some((rel) =>
    rel.fields?.some((f) => f.type === "date" || f.type === "datetime"),
  );

  if (hasRelBooleanFields) {
    componentImports.push("FormCheckbox");
  }
  if (hasRelDateFields) {
    componentImports.push("FormDate");
  }

  // Check for description/textarea fields
  const hasTextareaFields = fields.some((f) => f.name === "description" || f.type === "textarea");
  if (hasTextareaFields) {
    componentImports.push("FormTextarea");
  }

  imports.push(`import {
  ${componentImports.join(",\n  ")},
} from "@carlonicora/nextjs-jsonapi/components";`);

  // Context imports - always needed for permission check in export
  imports.push(`import { useCurrentUserContext } from "@carlonicora/nextjs-jsonapi/contexts";`);

  // Core imports
  imports.push(`import { Action, Modules } from "@carlonicora/nextjs-jsonapi/core";`);

  // Zod schema imports
  const zodSchemaImports = ["entityObjectSchema"];
  if (hasAuthor) {
    zodSchemaImports.push("userObjectSchema");
  }
  imports.push(`import { ${zodSchemaImports.join(", ")} } from "@carlonicora/nextjs-jsonapi/core";`);

  // Other imports
  imports.push(`import { zodResolver } from "@hookform/resolvers/zod";`);
  imports.push(`import { useTranslations } from "next-intl";`);
  imports.push(`import { ReactNode, useCallback${hasAuthor ? ", useEffect" : ""}, useMemo } from "react";`);
  imports.push(`import { useForm } from "react-hook-form";`);
  imports.push(`import { v4 } from "uuid";`);
  imports.push(`import { z } from "zod";`);

  return imports.join("\n");
}

/**
 * Generate props type
 */
function generatePropsType(data: FrontendTemplateData): string {
  const { names } = data;

  return `type ${names.pascalCase}EditorProps = {
  ${names.camelCase}?: ${names.pascalCase}Interface;
  propagateChanges?: (${names.camelCase}: ${names.pascalCase}Interface) => void;
  trigger?: ReactNode;
  forceShow?: boolean;
  onClose?: () => void;
  dialogOpen?: boolean;
  onDialogOpenChange?: (open: boolean) => void;
};`;
}

/**
 * Generate form schema wrapped in useMemo
 */
function generateFormSchema(data: FrontendTemplateData): string {
  const { names, fields, relationships, extendsContent } = data;
  const schemaFields: string[] = [];

  // ID field
  schemaFields.push(`      id: z.uuidv4(),`);

  // Regular fields (excluding inherited)
  const fieldsToInclude = extendsContent
    ? fields.filter((f) => !["name", "tldr", "abstract"].includes(f.name))
    : fields;

  // Add name field for Content-extending modules
  if (extendsContent) {
    schemaFields.push(`      name: z.string().min(1, {
        message: t(\`features.${names.camelCase.toLowerCase()}.fields.name.error\`),
      }),`);
  }

  fieldsToInclude.forEach((field) => {
    if (field.isContentField) {
      schemaFields.push(`      ${field.name}: z.any(),`);
    } else if (field.type === "string") {
      if (field.nullable) {
        schemaFields.push(`      ${field.name}: z.string().optional(),`);
      } else {
        schemaFields.push(`      ${field.name}: z.string().min(1, {
        message: t(\`features.${names.camelCase.toLowerCase()}.fields.${field.name}.error\`),
      }),`);
      }
    } else {
      schemaFields.push(`      ${field.name}: ${field.zodSchema},`);
    }
  });

  // Relationship fields
  relationships.forEach((rel) => {
    const fieldId = toCamelCase(rel.alias || rel.variant || rel.name);
    const fieldIdLower = fieldId.toLowerCase();
    if (rel.variant === AUTHOR_VARIANT) {
      schemaFields.push(`      ${fieldId}: userObjectSchema.refine((data) => data.id && data.id.length > 0, {
        message: t(\`generic.relationships.author.error\`),
      }),`);
    } else if (rel.single) {
      if (rel.nullable) {
        schemaFields.push(`      ${fieldId}: entityObjectSchema.optional(),`);
      } else {
        schemaFields.push(`      ${fieldId}: entityObjectSchema.refine((data) => data.id && data.id.length > 0, {
        message: t(\`features.${names.camelCase.toLowerCase()}.relationships.${fieldIdLower}.error\`),
      }),`);
      }
      if (rel.fields && rel.fields.length > 0) {
        rel.fields.forEach((field) => {
          const optional = rel.nullable ? ".optional()" : "";
          switch (field.type) {
            case "number":
              schemaFields.push(`      ${field.name}: z.number()${optional},`);
              break;
            case "boolean":
              schemaFields.push(`      ${field.name}: z.boolean()${optional},`);
              break;
            case "date":
            case "datetime":
              schemaFields.push(`      ${field.name}: z.date()${optional},`);
              break;
            case "any":
              schemaFields.push(`      ${field.name}: z.any()${optional},`);
              break;
            case "string":
            default:
              schemaFields.push(`      ${field.name}: z.string()${optional},`);
              break;
          }
        });
      }
    } else {
      schemaFields.push(`      ${fieldId}: z.array(entityObjectSchema).optional(),`);
    }
  });

  return `  const formSchema = useMemo(
    () =>
      z.object({
${schemaFields.join("\n")}
      }),
    [t],
  );`;
}

/**
 * Generate default values function wrapped in useCallback
 */
function generateDefaultValues(data: FrontendTemplateData): string {
  const { names, fields, relationships, extendsContent } = data;
  const defaults: string[] = [];

  // ID default
  defaults.push(`    id: ${names.camelCase}?.id || v4(),`);

  // Name for Content-extending modules
  if (extendsContent) {
    defaults.push(`    name: ${names.camelCase}?.name || "",`);
  }

  // Field defaults
  const fieldsToInclude = extendsContent
    ? fields.filter((f) => !["name", "tldr", "abstract"].includes(f.name))
    : fields;

  fieldsToInclude.forEach((field) => {
    if (field.isContentField) {
      defaults.push(`    ${field.name}: ${names.camelCase}?.${field.name} || [],`);
    } else if (field.type === "string") {
      defaults.push(`    ${field.name}: ${names.camelCase}?.${field.name} || "",`);
    } else if (field.type === "number") {
      defaults.push(`    ${field.name}: ${names.camelCase}?.${field.name} || 0,`);
    } else if (field.type === "boolean") {
      defaults.push(`    ${field.name}: ${names.camelCase}?.${field.name} || false,`);
    } else {
      defaults.push(`    ${field.name}: ${names.camelCase}?.${field.name},`);
    }
  });

  // Relationship defaults
  relationships.forEach((rel) => {
    const fieldId = toCamelCase(rel.alias || rel.variant || rel.name);
    const propertyName = rel.alias ? toCamelCase(rel.alias) : rel.variant ? toCamelCase(rel.variant) : toCamelCase(rel.name);
    const pluralPropertyName = pluralize(toCamelCase(rel.alias || rel.name));

    if (rel.variant === AUTHOR_VARIANT) {
      defaults.push(`    ${fieldId}: ${names.camelCase}?.${propertyName}
      ? { id: ${names.camelCase}.${propertyName}.id, name: ${names.camelCase}.${propertyName}.name, avatar: ${names.camelCase}.${propertyName}.avatar }
      : undefined,`);
    } else if (rel.single) {
      const displayProp = rel.targetHasName ? "name" : "id";
      defaults.push(`    ${fieldId}: ${names.camelCase}?.${propertyName}
      ? { id: ${names.camelCase}.${propertyName}.id, name: ${names.camelCase}.${propertyName}.${displayProp} }
      : undefined,`);
      if (rel.fields && rel.fields.length > 0) {
        rel.fields.forEach((field) => {
          switch (field.type) {
            case "number":
              defaults.push(`    ${field.name}: ${names.camelCase}?.${propertyName}?.${field.name} ?? 0,`);
              break;
            case "boolean":
              defaults.push(`    ${field.name}: ${names.camelCase}?.${propertyName}?.${field.name} ?? false,`);
              break;
            case "date":
            case "datetime":
            case "any":
              defaults.push(`    ${field.name}: ${names.camelCase}?.${propertyName}?.${field.name},`);
              break;
            case "string":
            default:
              defaults.push(`    ${field.name}: ${names.camelCase}?.${propertyName}?.${field.name} ?? "",`);
              break;
          }
        });
      }
    } else {
      const displayProp = rel.targetHasName ? "name" : "id";
      defaults.push(`    ${fieldId}: ${names.camelCase}?.${pluralPropertyName}
      ? ${names.camelCase}.${pluralPropertyName}.map((item) => ({ id: item.id, name: item.${displayProp} }))
      : [],`);
    }
  });

  return `  const getDefaultValues = useCallback(() => ({
${defaults.join("\n")}
  }), [${names.camelCase}]);`;
}

/**
 * Generate onSubmit body (payload building + service call, no try/catch)
 */
function generateOnSubmitBody(data: FrontendTemplateData): string {
  const { names, fields, relationships, extendsContent } = data;
  const payloadFields: string[] = [];

  // ID
  payloadFields.push(`          id: values.id,`);

  // Name for Content-extending modules
  if (extendsContent) {
    payloadFields.push(`          name: values.name,`);
  }

  // Fields
  const fieldsToInclude = extendsContent
    ? fields.filter((f) => !["name", "tldr", "abstract"].includes(f.name))
    : fields;

  fieldsToInclude.forEach((field) => {
    payloadFields.push(`          ${field.name}: values.${field.name},`);
  });

  // Relationships
  relationships.forEach((rel) => {
    const fieldId = toCamelCase(rel.alias || rel.variant || rel.name);
    const payloadKey = rel.single ? `${fieldId}Id` : `${toCamelCase(rel.alias || rel.name)}Ids`;

    if (rel.single) {
      payloadFields.push(`          ${payloadKey}: values.${fieldId}?.id,`);
      if (rel.fields && rel.fields.length > 0) {
        rel.fields.forEach((field) => {
          payloadFields.push(`          ${field.name}: values.${field.name},`);
        });
      }
    } else {
      payloadFields.push(`          ${payloadKey}: values.${fieldId} ? values.${fieldId}.map((item) => item.id) : [],`);
    }
  });

  return `        const payload: ${names.pascalCase}Input = {
${payloadFields.join("\n")}
        };

        return ${names.camelCase}
          ? await ${names.pascalCase}Service.update(payload)
          : await ${names.pascalCase}Service.create(payload);`;
}

/**
 * Generate form fields JSX (rendered as children of EditorSheet)
 */
function generateFormFields(data: FrontendTemplateData): string {
  const { names, fields, relationships, extendsContent } = data;
  const formElements: string[] = [];

  // Name field for Content-extending
  if (extendsContent) {
    formElements.push(`      <FormInput
        form={form}
        id="name"
        name={t(\`features.${names.camelCase.toLowerCase()}.fields.name.label\`)}
        placeholder={t(\`features.${names.camelCase.toLowerCase()}.fields.name.placeholder\`)}
        isRequired
      />`);
  }

  // Regular fields
  const fieldsToInclude = extendsContent
    ? fields.filter((f) => !["name", "tldr", "abstract"].includes(f.name))
    : fields;

  fieldsToInclude.forEach((field) => {
    if (field.isContentField) {
      formElements.push(`      <FormBlockNote
        form={form}
        id="${field.name}"
        name={t(\`features.${names.camelCase.toLowerCase()}.fields.${field.name}.label\`)}
        placeholder={t(\`features.${names.camelCase.toLowerCase()}.fields.${field.name}.placeholder\`)}
        type="${names.camelCase}"
      />`);
    } else if (field.name === "description" || field.type === "textarea") {
      formElements.push(`      <FormTextarea
        className="h-20 min-h-20"
        form={form}
        id="${field.name}"
        name={t(\`features.${names.camelCase.toLowerCase()}.fields.${field.name}.label\`)}
        placeholder={t(\`features.${names.camelCase.toLowerCase()}.fields.${field.name}.placeholder\`)}
      />`);
    } else {
      const isRequired = !field.nullable;
      formElements.push(`      <FormInput
        form={form}
        id="${field.name}"
        name={t(\`features.${names.camelCase.toLowerCase()}.fields.${field.name}.label\`)}
        placeholder={t(\`features.${names.camelCase.toLowerCase()}.fields.${field.name}.placeholder\`)}${isRequired ? "\n        isRequired" : ""}
      />`);
    }
  });

  // Relationship selectors
  relationships.forEach((rel) => {
    if (rel.variant === AUTHOR_VARIANT) {
      return;
    }

    const fieldId = toCamelCase(rel.alias || rel.variant || rel.name);
    const fieldIdLower = fieldId.toLowerCase();

    if (rel.single) {
      formElements.push(`      <${rel.name}Selector
        id="${fieldId}"
        form={form}
        label={t(\`features.${names.camelCase.toLowerCase()}.relationships.${fieldIdLower}.label\`)}
        placeholder={t(\`features.${names.camelCase.toLowerCase()}.relationships.${fieldIdLower}.placeholder\`)}${!rel.nullable ? "\n        isRequired" : ""}
      />`);
      if (rel.fields && rel.fields.length > 0) {
        rel.fields.forEach((field) => {
          const isRequired = !rel.nullable;
          switch (field.type) {
            case "number":
              formElements.push(`      <FormInput
        form={form}
        id="${field.name}"
        name={t(\`features.${names.camelCase.toLowerCase()}.relationships.${fieldIdLower}.fields.${field.name}.label\`)}
        placeholder={t(\`features.${names.camelCase.toLowerCase()}.relationships.${fieldIdLower}.fields.${field.name}.placeholder\`)}
        type="number"${isRequired ? "\n        isRequired" : ""}
      />`);
              break;
            case "boolean":
              formElements.push(`      <FormCheckbox
        form={form}
        id="${field.name}"
        name={t(\`features.${names.camelCase.toLowerCase()}.relationships.${fieldIdLower}.fields.${field.name}.label\`)}
      />`);
              break;
            case "date":
            case "datetime":
              formElements.push(`      <FormDate
        form={form}
        id="${field.name}"
        name={t(\`features.${names.camelCase.toLowerCase()}.relationships.${fieldIdLower}.fields.${field.name}.label\`)}${isRequired ? "\n        isRequired" : ""}
      />`);
              break;
            case "string":
            case "any":
            default:
              formElements.push(`      <FormInput
        form={form}
        id="${field.name}"
        name={t(\`features.${names.camelCase.toLowerCase()}.relationships.${fieldIdLower}.fields.${field.name}.label\`)}
        placeholder={t(\`features.${names.camelCase.toLowerCase()}.relationships.${fieldIdLower}.fields.${field.name}.placeholder\`)}${isRequired ? "\n        isRequired" : ""}
      />`);
              break;
          }
        });
      }
    } else {
      const multiComponentName = rel.isFoundation ? `${rel.name}MultiSelect` : `${rel.name}MultiSelector`;
      formElements.push(`      <${multiComponentName}
        id="${fieldId}"
        form={form}
        label={t(\`entities.${pluralize(rel.name.toLowerCase())}\`, { count: 2 })}
      />`);
    }
  });

  return formElements.join("\n");
}
