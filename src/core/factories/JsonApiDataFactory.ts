import { ApiDataInterface } from "../interfaces/ApiDataInterface";
import { ApiRequestDataTypeInterface } from "../interfaces/ApiRequestDataTypeInterface";
import { DataClassRegistry } from "../registry/DataClassRegistry";

export class JsonApiDataFactory {
  public static create(classKey: ApiRequestDataTypeInterface, data: any): any {
    console.log("[DEBUG JsonApiDataFactory.create] classKey:", classKey?.name);
    console.log("[DEBUG JsonApiDataFactory.create] data:", JSON.stringify(data, null, 2));
    const factoryClass = DataClassRegistry.get(classKey);
    console.log("[DEBUG JsonApiDataFactory.create] factoryClass:", factoryClass?.name);

    const instance = new factoryClass() as ApiDataInterface;
    const result = instance.createJsonApi(data);
    console.log("[DEBUG JsonApiDataFactory.create] result:", JSON.stringify(result, null, 2));
    return result;
  }
}
