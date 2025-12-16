/**
 * Editor Template
 *
 * Generates {Module}Editor.tsx dialog-based form component.
 */

import { FrontendTemplateData, FrontendField, FrontendRelationship } from "../../types/template-data.interface";
import { toCamelCase, pluralize, toPascalCase } from "../../transformers/name-transformer";
import { AUTHOR_VARIANT } from "../../types/field-mapping.types";
import { getFormFieldJsx } from "../../transformers/field-mapper";
import { getRelationshipFormJsx, getDefaultValueExpression, getPayloadMapping, isFoundationImport, FOUNDATION_PACKAGE } from "../../transformers/relationship-resolver";

/**
 * Generate the editor component file content
 *
 * @param data - Frontend template data
 * @returns Generated file content
 */
export function generateEditorTemplate(data: FrontendTemplateData): string {
  const { names, fields, relationships, extendsContent } = data;

  const imports = generateImports(data);
  const propsType = generatePropsType(data);
  const formSchema = generateFormSchema(data);
  const defaultValues = generateDefaultValues(data);
  const onSubmit = generateOnSubmit(data);
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
  const generateUrl = usePageUrlGenerator();
  const [open, setOpen] = useState<boolean>(false);
  const t = useTranslations();
${hasAuthor ? `  const { currentUser } = useCurrentUserContext<UserInterface>();` : ""}

  useEffect(() => {
    if (dialogOpen !== undefined) {
      setOpen(dialogOpen);
    }
  }, [dialogOpen]);

  useEffect(() => {
    if (typeof onDialogOpenChange === "function") {
      onDialogOpenChange(open);
    }
  }, [open, onDialogOpenChange]);

  useEffect(() => {
    if (forceShow) setOpen(true);
  }, [forceShow]);

${formSchema}

${defaultValues}

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: getDefaultValues(),
  });

  useEffect(() => {
    if (!open) {
      form.reset(getDefaultValues());
      if (onClose) onClose();
    }
  }, [open]);

${hasAuthor ? `  useEffect(() => {
    if (currentUser && !form.getValues("author")?.id) {
      form.setValue("author", { id: currentUser.id, name: currentUser.name, avatar: currentUser.avatar });
    }
  }, [currentUser]);` : ""}

${onSubmit}

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && open) {
        event.preventDefault();
        event.stopPropagation();
      }
    };

    if (open) {
      document.addEventListener("keydown", handleKeyDown, true);
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown, true);
    };
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {dialogOpen === undefined && (trigger ? trigger : <CommonEditorTrigger isEdit={!!${names.camelCase}} />)}
      <DialogContent
        className={\`flex max-h-[90vh] max-w-[90vw] flex-col overflow-y-auto\`}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <CommonEditorHeader type={t(\`types.${names.pluralKebab}\`, { count: 1 })} name={${names.camelCase}?.name} />
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex w-full flex-col gap-y-4">
            <div className="flex flex-col justify-between gap-x-4">
${formFields}
              <CommonEditorButtons form={form} setOpen={setOpen} isEdit={!!${names.camelCase}} />
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export default function ${names.pascalCase}Editor(props: ${names.pascalCase}EditorProps) {
  const action = props.${names.camelCase} ? Action.Update : Action.Create;

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
  imports.push(`import { ${names.pascalCase}Input, ${names.pascalCase}Interface } from "@/features/${data.targetDir}/${names.kebabCase}/data/${names.pascalCase}Interface";`);
  imports.push(`import { ${names.pascalCase}Service } from "@/features/${data.targetDir}/${names.kebabCase}/data/${names.pascalCase}Service";`);

  // Relationship selector imports
  const hasAuthor = relationships.some((r) => r.variant === AUTHOR_VARIANT);

  relationships.forEach((rel) => {
    if (rel.variant === AUTHOR_VARIANT) {
      imports.push(`import { UserInterface } from "@/features/foundations/user/data/UserInterface";`);
    } else {
      const componentName = rel.single ? `${rel.name}Selector` : `${rel.name}MultiSelector`;
      if (rel.isFoundation) {
        // Foundation entities use named imports from the package
        imports.push(`import { ${componentName} } from "${FOUNDATION_PACKAGE}";`);
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
  const componentImports: string[] = [
    "CommonEditorButtons",
    "CommonEditorHeader",
    "CommonEditorTrigger",
    "errorToast",
  ];

  // Check for field types that need specific components
  const hasContentField = fields.some((f) => f.isContentField || f.name === "content");
  if (hasContentField) {
    componentImports.push("BlockNoteEditorContainer", "FormContainerGeneric");
  }

  const hasStringFields = fields.some((f) => f.formComponent === "FormInput" || f.formComponent === "FormInputNumber");
  if (hasStringFields) {
    componentImports.push("FormInput");
  }

  imports.push(`import {
  ${componentImports.join(",\n  ")},
} from "@carlonicora/nextjs-jsonapi/components";`);

  // Context imports
  if (hasAuthor) {
    imports.push(`import { useCurrentUserContext } from "@carlonicora/nextjs-jsonapi/contexts";`);
  }

  // Core imports
  imports.push(`import { Modules } from "@carlonicora/nextjs-jsonapi/core";`);
  imports.push(`import { usePageUrlGenerator } from "@carlonicora/nextjs-jsonapi/client";`);
  imports.push(`import { Action } from "@carlonicora/nextjs-jsonapi/core";`);
  imports.push(`import { Dialog, DialogContent, Form } from "@carlonicora/nextjs-jsonapi/components";`);

  // Zod schema imports
  const zodSchemaImports = ["entityObjectSchema"];
  if (hasAuthor) {
    zodSchemaImports.push("userObjectSchema");
  }
  imports.push(`import { ${zodSchemaImports.join(", ")} } from "@carlonicora/nextjs-jsonapi/core";`);

  // Other imports
  imports.push(`import { zodResolver } from "@hookform/resolvers/zod";`);
  imports.push(`import { useTranslations } from "next-intl";`);
  imports.push(`import { ReactNode, useEffect, useState } from "react";`);
  imports.push(`import { SubmitHandler, useForm } from "react-hook-form";`);
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
 * Generate form schema
 */
function generateFormSchema(data: FrontendTemplateData): string {
  const { names, fields, relationships, extendsContent } = data;
  const schemaFields: string[] = [];

  // ID field
  schemaFields.push(`    id: z.uuidv4(),`);

  // Regular fields (excluding inherited)
  const fieldsToInclude = extendsContent
    ? fields.filter((f) => !["name", "tldr", "abstract"].includes(f.name))
    : fields;

  // Add name field for Content-extending modules
  if (extendsContent) {
    schemaFields.push(`    name: z.string().min(1, {
      message: t(\`features.${names.camelCase}.fields.name.error\`),
    }),`);
  }

  fieldsToInclude.forEach((field) => {
    if (field.name === "content" || field.isContentField) {
      schemaFields.push(`    ${field.name}: z.any(),`);
    } else if (field.type === "string") {
      if (field.nullable) {
        schemaFields.push(`    ${field.name}: z.string().optional(),`);
      } else {
        schemaFields.push(`    ${field.name}: z.string().min(1, {
      message: t(\`features.${names.camelCase}.fields.${field.name}.error\`),
    }),`);
      }
    } else {
      schemaFields.push(`    ${field.name}: ${field.zodSchema},`);
    }
  });

  // Relationship fields
  relationships.forEach((rel) => {
    const fieldId = toCamelCase(rel.variant || rel.name);
    if (rel.variant === AUTHOR_VARIANT) {
      schemaFields.push(`    ${fieldId}: userObjectSchema.refine((data) => data.id && data.id.length > 0, {
      message: t(\`generic.relationships.author.error\`),
    }),`);
    } else if (rel.single) {
      if (rel.nullable) {
        schemaFields.push(`    ${fieldId}: entityObjectSchema.optional(),`);
      } else {
        schemaFields.push(`    ${fieldId}: entityObjectSchema.refine((data) => data.id && data.id.length > 0, {
      message: t(\`generic.relationships.${fieldId}.error\`),
    }),`);
      }
    } else {
      schemaFields.push(`    ${fieldId}: z.array(entityObjectSchema).optional(),`);
    }
  });

  return `  const formSchema = z.object({
${schemaFields.join("\n")}
  });`;
}

/**
 * Generate default values function
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
    if (field.name === "content" || field.isContentField) {
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
    const fieldId = toCamelCase(rel.variant || rel.name);
    const propertyName = rel.variant ? toCamelCase(rel.variant) : toCamelCase(rel.name);
    const pluralPropertyName = pluralize(toCamelCase(rel.name));

    if (rel.variant === AUTHOR_VARIANT) {
      defaults.push(`    ${fieldId}: ${names.camelCase}?.${propertyName}
      ? { id: ${names.camelCase}.${propertyName}.id, name: ${names.camelCase}.${propertyName}.name, avatar: ${names.camelCase}.${propertyName}.avatar }
      : undefined,`);
    } else if (rel.single) {
      defaults.push(`    ${fieldId}: ${names.camelCase}?.${propertyName}
      ? { id: ${names.camelCase}.${propertyName}.id, name: ${names.camelCase}.${propertyName}.name }
      : undefined,`);
    } else {
      defaults.push(`    ${fieldId}: ${names.camelCase}?.${pluralPropertyName}
      ? ${names.camelCase}.${pluralPropertyName}.map((item) => ({ id: item.id, name: item.name }))
      : [],`);
    }
  });

  return `  const getDefaultValues = () => ({
${defaults.join("\n")}
  });`;
}

/**
 * Generate onSubmit handler
 */
function generateOnSubmit(data: FrontendTemplateData): string {
  const { names, fields, relationships, extendsContent } = data;
  const payloadFields: string[] = [];

  // ID
  payloadFields.push(`      id: values.id,`);

  // Name for Content-extending modules
  if (extendsContent) {
    payloadFields.push(`      name: values.name,`);
  }

  // Fields
  const fieldsToInclude = extendsContent
    ? fields.filter((f) => !["name", "tldr", "abstract"].includes(f.name))
    : fields;

  fieldsToInclude.forEach((field) => {
    payloadFields.push(`      ${field.name}: values.${field.name},`);
  });

  // Relationships
  relationships.forEach((rel) => {
    const fieldId = toCamelCase(rel.variant || rel.name);
    const payloadKey = rel.single
      ? `${fieldId}Id`
      : `${toCamelCase(rel.name)}Ids`;

    if (rel.single) {
      payloadFields.push(`      ${payloadKey}: values.${fieldId}?.id,`);
    } else {
      payloadFields.push(`      ${payloadKey}: values.${fieldId} ? values.${fieldId}.map((item) => item.id) : [],`);
    }
  });

  return `  const onSubmit: SubmitHandler<z.infer<typeof formSchema>> = async (values: z.infer<typeof formSchema>) => {
    const payload: ${names.pascalCase}Input = {
${payloadFields.join("\n")}
    };

    try {
      const updated${names.pascalCase} = ${names.camelCase} ? await ${names.pascalCase}Service.update(payload) : await ${names.pascalCase}Service.create(payload);

      setOpen(false);
      revalidatePaths(generateUrl({ page: Modules.${names.pascalCase}, id: updated${names.pascalCase}.id, language: \`[locale]\` }));
      if (${names.camelCase} && propagateChanges) {
        propagateChanges(updated${names.pascalCase});
      } else {
        router.push(generateUrl({ page: Modules.${names.pascalCase}, id: updated${names.pascalCase}.id }));
      }
    } catch (error) {
      errorToast({
        title: ${names.camelCase} ? t(\`generic.errors.update\`) : t(\`generic.errors.create\`),
        error,
      });
    }
  };`;
}

/**
 * Generate form fields JSX
 */
function generateFormFields(data: FrontendTemplateData): string {
  const { names, fields, relationships, extendsContent } = data;
  const formElements: string[] = [];

  // Name field for Content-extending
  if (extendsContent) {
    formElements.push(`              <FormInput
                form={form}
                id="name"
                name={t(\`features.${names.camelCase}.fields.name.label\`)}
                placeholder={t(\`features.${names.camelCase}.fields.name.placeholder\`)}
                isRequired
              />`);
  }

  // Regular fields
  const fieldsToInclude = extendsContent
    ? fields.filter((f) => !["name", "tldr", "abstract"].includes(f.name))
    : fields;

  fieldsToInclude.forEach((field) => {
    if (field.name === "content" || field.isContentField) {
      formElements.push(`              <FormContainerGeneric form={form} id="${field.name}" name={t(\`features.${names.camelCase}.fields.${field.name}.label\`)}>
                <BlockNoteEditorContainer
                  id={form.getValues("id")}
                  type="${names.camelCase}"
                  initialContent={form.getValues("${field.name}")}
                  onChange={(content, isEmpty, hasUnresolvedDiff) => {
                    form.setValue("${field.name}", content);
                  }}
                  placeholder={t(\`features.${names.camelCase}.fields.${field.name}.placeholder\`)}
                  bordered
                />
              </FormContainerGeneric>`);
    } else {
      const isRequired = !field.nullable;
      formElements.push(`              <FormInput
                form={form}
                id="${field.name}"
                name={t(\`features.${names.camelCase}.fields.${field.name}.label\`)}
                placeholder={t(\`features.${names.camelCase}.fields.${field.name}.placeholder\`)}${isRequired ? "\n                isRequired" : ""}
              />`);
    }
  });

  // Relationship selectors
  relationships.forEach((rel) => {
    if (rel.variant === AUTHOR_VARIANT) {
      // Author is auto-set, skip
      return;
    }

    const fieldId = toCamelCase(rel.variant || rel.name);

    if (rel.single) {
      formElements.push(`              <${rel.name}Selector
                id="${fieldId}"
                form={form}
                label={t(\`generic.relationships.${fieldId}.label\`)}
                placeholder={t(\`generic.relationships.${fieldId}.placeholder\`)}${!rel.nullable ? "\n                isRequired" : ""}
              />`);
    } else {
      formElements.push(`              <${rel.name}MultiSelector
                id="${fieldId}"
                form={form}
                label={t(\`types.${pluralize(rel.name.toLowerCase())}\`, { count: 2 })}
              />`);
    }
  });

  return formElements.join("\n");
}
