/**
 * Device-copy schema (spec § 1). Every statement is idempotent so it runs on
 * every open; `user_version` records the layout. A file of an older layout is
 * recreated (pre-release: no migration), see `DEVICE_STORE_RESET`.
 *
 * 2: `record_campaigns` (a shared record, e.g. an artwork or a template, belongs
 *    to every root record that uses it) and `queue.package_id`.
 *    `skipped_records` was added later inside layout 2: `CREATE TABLE IF NOT EXISTS` adds it to
 *    an existing file without a reset (a reset would drop unsent changes).
 * 3: campaign columns and tables renamed to root (`campaign_id` -> `root_id`,
 *    `record_campaigns` -> `record_roots`).
 */
export const DEVICE_STORE_SCHEMA_VERSION = 3;

/**
 * Drops every table of an older layout before the schema is created again. Layout 2's
 * `record_campaigns` is dropped too, so a layout-2 file is fully recreated.
 */
export const DEVICE_STORE_RESET: string[] = [
  `DROP TABLE IF EXISTS records`,
  `DROP TABLE IF EXISTS record_campaigns`,
  `DROP TABLE IF EXISTS record_roots`,
  `DROP TABLE IF EXISTS links`,
  `DROP TABLE IF EXISTS queue`,
  `DROP TABLE IF EXISTS conflicts`,
  `DROP TABLE IF EXISTS sync_state`,
  `DROP TABLE IF EXISTS skipped_records`,
];

export const DEVICE_STORE_SCHEMA: string[] = [
  `CREATE TABLE IF NOT EXISTS records (
    type TEXT NOT NULL,
    id TEXT NOT NULL,
    root_id TEXT NOT NULL,
    resource TEXT NOT NULL,
    updated_at TEXT,
    base TEXT,
    local_only INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (type, id)
  )`,
  `CREATE INDEX IF NOT EXISTS records_type_root ON records (type, root_id)`,
  `CREATE TABLE IF NOT EXISTS record_roots (
    type TEXT NOT NULL,
    id TEXT NOT NULL,
    root_id TEXT NOT NULL,
    PRIMARY KEY (type, id, root_id)
  )`,
  `CREATE INDEX IF NOT EXISTS record_roots_root ON record_roots (root_id, type)`,
  `CREATE TABLE IF NOT EXISTS links (
    from_id TEXT NOT NULL,
    from_type TEXT NOT NULL,
    to_id TEXT NOT NULL,
    to_type TEXT NOT NULL,
    kind TEXT NOT NULL,
    props TEXT NOT NULL DEFAULT '{}',
    root_id TEXT,
    PRIMARY KEY (from_id, to_id, kind)
  )`,
  `CREATE INDEX IF NOT EXISTS links_from ON links (from_id)`,
  `CREATE INDEX IF NOT EXISTS links_to ON links (to_id)`,
  `CREATE INDEX IF NOT EXISTS links_root ON links (root_id)`,
  `CREATE TABLE IF NOT EXISTS queue (
    seq INTEGER PRIMARY KEY AUTOINCREMENT,
    root_id TEXT NOT NULL,
    request TEXT NOT NULL,
    base TEXT,
    created_at TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    package_id TEXT
  )`,
  `CREATE INDEX IF NOT EXISTS queue_status_seq ON queue (status, seq)`,
  `CREATE TABLE IF NOT EXISTS conflicts (
    id TEXT PRIMARY KEY,
    queue_seq INTEGER NOT NULL,
    root_id TEXT,
    kind TEXT NOT NULL,
    record_type TEXT,
    record_id TEXT,
    mine TEXT,
    theirs TEXT,
    base TEXT,
    merged TEXT,
    fields TEXT NOT NULL DEFAULT '[]',
    blocks TEXT,
    reason TEXT
  )`,
  `CREATE TABLE IF NOT EXISTS sync_state (
    root_id TEXT PRIMARY KEY,
    server_time TEXT,
    locked INTEGER NOT NULL DEFAULT 0,
    locked_from TEXT
  )`,
  `CREATE TABLE IF NOT EXISTS skipped_records (
    root_id TEXT NOT NULL,
    type TEXT NOT NULL,
    id TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    PRIMARY KEY (root_id, type, id)
  )`,
  `PRAGMA user_version = ${DEVICE_STORE_SCHEMA_VERSION}`,
];
