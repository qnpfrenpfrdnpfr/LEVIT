import sqlite3 from "sqlite3";
import { open } from "sqlite";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// server/src/db/sqlite.js 기준 → server/data/faq.db
const dbPath = path.join(__dirname, "../../data/faq.db");

export async function getDb() {
  return open({
    filename: dbPath,
    driver: sqlite3.Database,
  });
}