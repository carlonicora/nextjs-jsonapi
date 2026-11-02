export type ApiData = {
  data: any;
  ok: boolean;
  status: number;
  statusText: string;
  token?: string;
  refreshToken?: string;
  /** Set by `directFetch` when the API could not be reached at all (the 503 it reports). */
  networkError?: boolean;
};
