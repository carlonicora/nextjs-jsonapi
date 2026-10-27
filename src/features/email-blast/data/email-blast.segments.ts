/**
 * URL segments of the email-blast child routes. The only place these strings
 * are written: services build every child URL from here through EndpointCreator.
 */
export const EMAIL_BLAST_SEGMENTS = {
  audience: "recipient-count",
  test: "test",
  send: "send",
  unsubscribe: "unsubscribe",
} as const;
