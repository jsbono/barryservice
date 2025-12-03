import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, '..', '..', 'data', 'mechanic.db');

// Ensure data directory exists
import fs from 'fs';
const dataDir = path.dirname(dbPath);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

export const db = new Database(dbPath);
db.pragma('journal_mode = WAL');

// Convert PostgreSQL-style $1, $2 placeholders to SQLite ? placeholders
function convertPlaceholders(sql: string): string {
  let index = 0;
  return sql.replace(/\$\d+/g, () => '?');
}

// Convert PostgreSQL functions to SQLite equivalents
function convertSql(sql: string): string {
  let converted = convertPlaceholders(sql);

  // Replace gen_random_uuid() with a placeholder (we'll generate UUIDs in JS)
  converted = converted.replace(/gen_random_uuid\(\)/gi, "''");

  // Replace TIMESTAMPTZ with TEXT
  converted = converted.replace(/TIMESTAMPTZ/gi, 'TEXT');

  // Replace now() with datetime('now')
  converted = converted.replace(/\bnow\(\)/gi, "datetime('now')");

  // Replace CURRENT_DATE with date('now')
  converted = converted.replace(/CURRENT_DATE/gi, "date('now')");

  // Handle json_build_object - SQLite doesn't have this, we'll handle it differently
  // For now, just return the converted SQL

  return converted;
}

export function query<T = any>(text: string, params?: any[]): T[] {
  const sql = convertSql(text);
  try {
    const stmt = db.prepare(sql);
    if (sql.trim().toUpperCase().startsWith('SELECT')) {
      return stmt.all(...(params || [])) as T[];
    } else {
      stmt.run(...(params || []));
      return [] as T[];
    }
  } catch (error) {
    console.error('SQL Error:', error);
    console.error('Original SQL:', text);
    console.error('Converted SQL:', sql);
    throw error;
  }
}

export function queryOne<T = any>(text: string, params?: any[]): T | null {
  const rows = query<T>(text, params);
  return rows[0] || null;
}

export function execute(text: string, params?: any[]): number {
  const sql = convertSql(text);
  try {
    const stmt = db.prepare(sql);
    const result = stmt.run(...(params || []));
    return result.changes;
  } catch (error) {
    console.error('SQL Error:', error);
    console.error('Original SQL:', text);
    console.error('Converted SQL:', sql);
    throw error;
  }
}

export function runRaw(sql: string): void {
  db.exec(sql);
}
