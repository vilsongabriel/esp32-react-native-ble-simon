import { logger } from "./logService"
import { isOnline } from "./networkService"

const API_URL = process.env.EXPO_PUBLIC_API_URL

export interface WorldRecord {
  score: number
  playerName: string | null
  updatedAt: string | null
}

export interface RankingEntry {
  id: number
  score: number
  playerName: string | null
  createdAt: string
}

export interface SubmitResult {
  success: boolean
  isNewRecord: boolean
}

export async function getWorldRecord(): Promise<WorldRecord | null> {
  const online = await isOnline()
  if (!online) {
    logger.warn("[Ranking] Sem conexão com internet")
    return null
  }

  try {
    const response = await fetch(`${API_URL}/ranking`)
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }
    return await response.json()
  } catch (error) {
    logger.warn("[Ranking] Falha ao buscar recorde mundial:", error)
    return null
  }
}

export async function getRankingList(limit = 10): Promise<RankingEntry[]> {
  const online = await isOnline()
  if (!online) {
    logger.warn("[Ranking] Sem conexão com internet")
    return []
  }

  try {
    const response = await fetch(`${API_URL}/ranking/list?limit=${limit}`)
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }
    return await response.json()
  } catch (error) {
    logger.warn("[Ranking] Falha ao buscar ranking:", error)
    return []
  }
}

export async function submitScore(
  score: number,
  playerName?: string,
  deviceId?: string | null,
  espMac?: string | null
): Promise<SubmitResult | null> {
  const online = await isOnline()
  if (!online) {
    logger.warn("[Ranking] Sem conexão - score não enviado")
    return null
  }

  try {
    const response = await fetch(`${API_URL}/ranking`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ score, playerName, deviceId, espMac }),
    })
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }
    logger.log("[Ranking] Score enviado com sucesso")
    return await response.json()
  } catch (error) {
    logger.warn("[Ranking] Falha ao enviar score:", error)
    return null
  }
}
