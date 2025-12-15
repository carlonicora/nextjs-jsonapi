/**
 * Service Template
 *
 * Generates {Module}Service.ts class file with CRUD and relationship methods.
 */

import { FrontendTemplateData, FrontendRelationship } from "../../types/template-data.interface";
import { toCamelCase, toPascalCase } from "../../transformers/name-transformer";

/**
 * Generate the service file content
 *
 * @param data - Frontend template data
 * @returns Generated file content
 */
export function generateServiceTemplate(data: FrontendTemplateData): string {
  const { names, relationships, relationshipServiceMethods } = data;

  const imports = generateImports(data);
  const findOneMethod = generateFindOneMethod(data);
  const findManyMethod = generateFindManyMethod(data);
  const relationshipMethods = generateRelationshipMethods(data);
  const createMethod = generateCreateMethod(data);
  const updateMethod = generateUpdateMethod(data);
  const deleteMethod = generateDeleteMethod(data);

  return `${imports}

export class ${names.pascalCase}Service extends AbstractService {
${findOneMethod}

${findManyMethod}

${relationshipMethods}
${createMethod}

${updateMethod}

${deleteMethod}
}
`;
}

/**
 * Generate import statements
 */
function generateImports(data: FrontendTemplateData): string {
  const { names } = data;

  return `import { AbstractService, HttpMethod, NextRef, PreviousRef } from "@carlonicora/nextjs-jsonapi/core";
import { EndpointCreator } from "@carlonicora/nextjs-jsonapi/core";
import { ${names.pascalCase}Input, ${names.pascalCase}Interface } from "@/features/${data.targetDir}/${names.kebabCase}/data/${names.pascalCase}Interface";
import { Modules } from "@carlonicora/nextjs-jsonapi/core";`;
}

/**
 * Generate findOne method
 */
function generateFindOneMethod(data: FrontendTemplateData): string {
  const { names } = data;

  return `  static async findOne(params: { id: string }): Promise<${names.pascalCase}Interface> {
    return this.callApi<${names.pascalCase}Interface>({
      type: Modules.${names.pascalCase},
      method: HttpMethod.GET,
      endpoint: new EndpointCreator({ endpoint: Modules.${names.pascalCase}, id: params.id }).generate(),
    });
  }`;
}

/**
 * Generate findMany method
 */
function generateFindManyMethod(data: FrontendTemplateData): string {
  const { names } = data;

  return `  static async findMany(params: {
    search?: string;
    fetchAll?: boolean;
    next?: NextRef;
    prev?: PreviousRef;
  }): Promise<${names.pascalCase}Interface[]> {
    const endpoint = new EndpointCreator({ endpoint: Modules.${names.pascalCase} });

    if (params.fetchAll) endpoint.addAdditionalParam("fetchAll", "true");
    if (params.search) endpoint.addAdditionalParam("search", params.search);
    if (Modules.${names.pascalCase}.inclusions?.lists?.fields) endpoint.limitToFields(Modules.${names.pascalCase}.inclusions.lists.fields);
    if (Modules.${names.pascalCase}.inclusions?.lists?.types) endpoint.limitToType(Modules.${names.pascalCase}.inclusions.lists.types);

    return this.callApi({
      type: Modules.${names.pascalCase},
      method: HttpMethod.GET,
      endpoint: endpoint.generate(),
      next: params.next,
    });
  }`;
}

/**
 * Generate relationship query methods
 */
function generateRelationshipMethods(data: FrontendTemplateData): string {
  const { names, relationshipServiceMethods } = data;

  if (relationshipServiceMethods.length === 0) {
    return "";
  }

  return relationshipServiceMethods
    .map((method) => {
      return `  static async ${method.methodName}(params: {
    ${method.paramName}: string;
    search?: string;
    fetchAll?: boolean;
    next?: NextRef;
    prev?: PreviousRef;
  }): Promise<${names.pascalCase}Interface[]> {
    const endpoint = new EndpointCreator({
      endpoint: Modules.${method.relationshipName},
      id: params.${method.paramName},
      childEndpoint: Modules.${names.pascalCase},
    });

    if (params.fetchAll) endpoint.addAdditionalParam("fetchAll", "true");
    if (params.search) endpoint.addAdditionalParam("search", params.search);
    if (Modules.${names.pascalCase}.inclusions?.lists?.fields) endpoint.limitToFields(Modules.${names.pascalCase}.inclusions.lists.fields);
    if (Modules.${names.pascalCase}.inclusions?.lists?.types) endpoint.limitToType(Modules.${names.pascalCase}.inclusions.lists.types);

    return this.callApi({
      type: Modules.${names.pascalCase},
      method: HttpMethod.GET,
      endpoint: endpoint.generate(),
      next: params.next,
    });
  }`;
    })
    .join("\n\n");
}

/**
 * Generate create method
 */
function generateCreateMethod(data: FrontendTemplateData): string {
  const { names } = data;

  return `  static async create(params: ${names.pascalCase}Input): Promise<${names.pascalCase}Interface> {
    return this.callApi({
      type: Modules.${names.pascalCase},
      method: HttpMethod.POST,
      endpoint: new EndpointCreator({ endpoint: Modules.${names.pascalCase} }).generate(),
      input: params,
    });
  }`;
}

/**
 * Generate update method
 */
function generateUpdateMethod(data: FrontendTemplateData): string {
  const { names } = data;

  return `  static async update(params: ${names.pascalCase}Input): Promise<${names.pascalCase}Interface> {
    return this.callApi({
      type: Modules.${names.pascalCase},
      method: HttpMethod.PUT,
      endpoint: new EndpointCreator({ endpoint: Modules.${names.pascalCase}, id: params.id }).generate(),
      input: params,
    });
  }`;
}

/**
 * Generate delete method
 */
function generateDeleteMethod(data: FrontendTemplateData): string {
  const { names } = data;

  return `  static async delete(params: { ${names.camelCase}Id: string }): Promise<void> {
    await this.callApi({
      type: Modules.${names.pascalCase},
      method: HttpMethod.DELETE,
      endpoint: new EndpointCreator({ endpoint: Modules.${names.pascalCase}, id: params.${names.camelCase}Id }).generate(),
    });
  }`;
}
