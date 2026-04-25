import db from './connection';

db.exec(`
  CREATE TABLE IF NOT EXISTS companies (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    public_id  TEXT    NOT NULL UNIQUE,
    name       TEXT    NOT NULL,
    created_at TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    updated_at TEXT,
    deleted_at TEXT
  );

  CREATE TABLE IF NOT EXISTS branches (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    public_id  TEXT    NOT NULL UNIQUE,
    company_id INTEGER NOT NULL REFERENCES companies(id),
    name       TEXT    NOT NULL,
    address    TEXT,
    created_at TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    updated_at TEXT,
    deleted_at TEXT
  );

  CREATE TABLE IF NOT EXISTS employees (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    public_id  TEXT    NOT NULL UNIQUE,
    company_id INTEGER NOT NULL REFERENCES companies(id),
    branch_id  INTEGER NOT NULL REFERENCES branches(id),
    name       TEXT    NOT NULL,
    created_at TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    updated_at TEXT,
    deleted_at TEXT
  );
`);
