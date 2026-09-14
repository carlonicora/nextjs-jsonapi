/**
 * Handbook pages are created by the backend ingest from files, never by a
 * client. The input therefore carries identity only — it exists so the model
 * satisfies AbstractApiData's contract, not because anything writes attributes.
 */
export type HandbookPageInput = {
  id: string;
};
