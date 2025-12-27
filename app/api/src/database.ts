import Database from "better-sqlite3"
import path from "path"
import { logger } from "./services/logger"

const DB_PATH = path.join(__dirname, "../data/genius.db")
const db = new Database(DB_PATH)

logger.info("Database", `Conectado ao banco: ${DB_PATH}`)

db.exec(`
  CREATE TABLE IF NOT EXISTS scores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    score INTEGER NOT NULL,
    player_name TEXT,
    device_id TEXT,
    esp_mac TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )
`)

logger.debug("Database", "Tabela scores verificada/criada")

export interface ScoreRecord {
  id: number
  score: number
  player_name: string | null
  device_id: string | null
  esp_mac: string | null
  created_at: string
}

export function getTopScore(): ScoreRecord | null {
  const stmt = db.prepare(`
    SELECT * FROM scores ORDER BY score DESC LIMIT 1
  `)
  return stmt.get() as ScoreRecord | null
}

export function getRanking(limit = 10): ScoreRecord[] {
  const stmt = db.prepare(`
    SELECT * FROM scores ORDER BY score DESC LIMIT ?
  `)
  return stmt.all(limit) as ScoreRecord[]
}

export function insertScore(
  score: number,
  playerName?: string,
  deviceId?: string,
  espMac?: string
): ScoreRecord {
  const stmt = db.prepare(`
    INSERT INTO scores (score, player_name, device_id, esp_mac)
    VALUES (?, ?, ?, ?)
  `)
  const result = stmt.run(score, playerName || null, deviceId || null, espMac || null)

  logger.debug("Database", `Score inserido com ID: ${result.lastInsertRowid}`)

  return {
    id: result.lastInsertRowid as number,
    score,
    player_name: playerName || null,
    device_id: deviceId || null,
    esp_mac: espMac || null,
    created_at: new Date().toISOString(),
  }
}

export default db
