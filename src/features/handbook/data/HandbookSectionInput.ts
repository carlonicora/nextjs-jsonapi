/**
 * Handbook sections are written only by the backend ingest, which replaces
 * every one of them on each sync. No client ever posts one; this type exists so
 * the model can satisfy AbstractApiData's `createJsonApi()` contract.
 */
export type HandbookSectionInput = {
  id: string;
  key: string;
  title: string;
  summary?: string;
  order: string;
};
