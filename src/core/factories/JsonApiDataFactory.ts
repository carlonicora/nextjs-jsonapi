import { ApiDataInterface } from "../interfaces/ApiDataInterface";
import { ApiRequestDataTypeInterface } from "../interfaces/ApiRequestDataTypeInterface";
import { DataClassRegistry } from "../registry/DataClassRegistry";

export class JsonApiDataFactory {
  public static create(classKey: ApiRequestDataTypeInterface, data: any): any {
    const factoryClass = DataClassRegistry.get(classKey);

    const instance = new factoryClass() as ApiDataInterface;
    const result = instance.createJsonApi(data);
    return result;
  }
}
