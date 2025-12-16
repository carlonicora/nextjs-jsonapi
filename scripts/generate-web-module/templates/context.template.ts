/**
 * Context Template
 *
 * Generates {Module}Context.tsx for module state management.
 */

import { FrontendTemplateData } from "../types/template-data.interface";

/**
 * Generate the context file content
 *
 * @param data - Frontend template data
 * @returns Generated file content
 */
export function generateContextTemplate(data: FrontendTemplateData): string {
  const { names, extendsContent } = data;

  return `"use client";

import ${names.pascalCase}Deleter from "@/features/${data.targetDir}/${names.kebabCase}/components/forms/${names.pascalCase}Deleter";
import ${names.pascalCase}Editor from "@/features/${data.targetDir}/${names.kebabCase}/components/forms/${names.pascalCase}Editor";
import { ${names.pascalCase}Interface } from "@/features/${data.targetDir}/${names.kebabCase}/data/${names.pascalCase}Interface";
import { ${names.pascalCase}Service } from "@/features/${data.targetDir}/${names.kebabCase}/data/${names.pascalCase}Service";
import { SharedProvider } from "@carlonicora/nextjs-jsonapi/contexts";
import { usePageUrlGenerator } from "@carlonicora/nextjs-jsonapi/client";
import { BreadcrumbItemData } from "@carlonicora/nextjs-jsonapi/core";

import { JsonApiHydratedDataInterface, Modules, rehydrate } from "@carlonicora/nextjs-jsonapi/core";
import { useTranslations } from "next-intl";
import { createContext, ReactNode, useContext, useState } from "react";

interface ${names.pascalCase}ContextType {
  ${names.camelCase}: ${names.pascalCase}Interface | undefined;
  set${names.pascalCase}: (value: ${names.pascalCase}Interface | undefined) => void;
  reload${names.pascalCase}: () => Promise<void>;
}

const ${names.pascalCase}Context = createContext<${names.pascalCase}ContextType | undefined>(undefined);

type ${names.pascalCase}ProviderProps = {
  children: ReactNode;
  dehydrated${names.pascalCase}?: JsonApiHydratedDataInterface;
};

export const ${names.pascalCase}Provider = ({ children, dehydrated${names.pascalCase} }: ${names.pascalCase}ProviderProps) => {
  const generateUrl = usePageUrlGenerator();
  const t = useTranslations();

  const [${names.camelCase}, set${names.pascalCase}] = useState<${names.pascalCase}Interface | undefined>(
    dehydrated${names.pascalCase} ? rehydrate<${names.pascalCase}Interface>(Modules.${names.pascalCase}, dehydrated${names.pascalCase}) : undefined,
  );

  const reload${names.pascalCase} = async () => {
    if (!${names.camelCase}) return;

    const fresh${names.pascalCase} = await ${names.pascalCase}Service.findOne({ id: ${names.camelCase}.id });
    set${names.pascalCase}(fresh${names.pascalCase});
  };

  const breadcrumb = () => {
    const response: BreadcrumbItemData[] = [];

    response.push({
      name: t(\`types.${names.pluralCamel}\`, { count: 2 }),
      href: generateUrl({ page: Modules.${names.pascalCase} }),
    });

    if (${names.camelCase})
      response.push({
        name: ${names.camelCase}.name,
        href: generateUrl({ page: Modules.${names.pascalCase}, id: ${names.camelCase}.id }),
      });

    return response;
  };

  const title = () => {
    const response: any = {
      type: t(\`types.${names.pluralCamel}\`, { count: ${names.camelCase} ? 1 : 2 }),
    };

    const functions: ReactNode[] = [];

    if (${names.camelCase}) {
      response.element = ${names.camelCase}.name;

      functions.push(<${names.pascalCase}Deleter key={\`${names.pascalCase}Deleter\`} ${names.camelCase}={${names.camelCase}} />);
      functions.push(<${names.pascalCase}Editor key={\`${names.pascalCase}Editor\`} ${names.camelCase}={${names.camelCase}} propagateChanges={set${names.pascalCase}} />);
    } else {
      functions.push(<${names.pascalCase}Editor key={\`${names.pascalCase}Editor\`} />);
    }

    if (functions.length > 0) response.functions = functions;

    return response;
  };

  return (
    <SharedProvider value={{ breadcrumbs: breadcrumb(), title: title() }}>
      <${names.pascalCase}Context.Provider
        value={{
          ${names.camelCase}: ${names.camelCase},
          set${names.pascalCase}: set${names.pascalCase},
          reload${names.pascalCase}: reload${names.pascalCase},
        }}
      >
        {children}
      </${names.pascalCase}Context.Provider>
    </SharedProvider>
  );
};

export const use${names.pascalCase}Context = (): ${names.pascalCase}ContextType => {
  const context = useContext(${names.pascalCase}Context);
  if (context === undefined) {
    throw new Error("use${names.pascalCase}Context must be used within a ${names.pascalCase}Provider");
  }
  return context;
};
`;
}
