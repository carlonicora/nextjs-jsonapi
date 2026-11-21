import { ApiDataInterface } from "./ApiDataInterface";

export interface ApiResponseInterface {
  ok: boolean;
  response: number;
  raw?: any;
  meta?: Record<string, any>;

  self?: string;
  next?: string;
  prev?: string;
  nextPage?: () => Promise<ApiResponseInterface>;
  prevPage?: () => Promise<ApiResponseInterface>;

  /** Undefined when the server answered a JSON:API document whose primary data is null. */
  data: ApiDataInterface | ApiDataInterface[] | undefined;

  error: string;
}
