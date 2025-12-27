import { Router, Request, Response } from "express"
import { getTopScore, getRanking, insertScore } from "../database"
import { logger } from "../services/logger"

const router = Router()

router.get("/", (_req: Request, res: Response) => {
  const topScore = getTopScore()

  if (!topScore) {
    logger.debug("Ranking", "Nenhum score registrado")
    res.json({ score: 0, playerName: null, updatedAt: null })
    return
  }

  logger.debug("Ranking", `Top score: ${topScore.score} - ${topScore.player_name || "Anônimo"}`)

  res.json({
    score: topScore.score,
    playerName: topScore.player_name,
    updatedAt: topScore.created_at,
  })
})

router.get("/list", (req: Request, res: Response) => {
  const limit = parseInt(req.query.limit as string) || 10
  const ranking = getRanking(limit)

  logger.debug("Ranking", `Lista solicitada - ${ranking.length} registros`)

  res.json(
    ranking.map((record) => ({
      id: record.id,
      score: record.score,
      playerName: record.player_name,
      deviceId: record.device_id,
      espMac: record.esp_mac,
      createdAt: record.created_at,
    }))
  )
})

router.post("/", (req: Request, res: Response) => {
  const { score, playerName, deviceId, espMac } = req.body

  if (typeof score !== "number" || score < 0) {
    logger.warn("Ranking", "Score inválido recebido", { score })
    res.status(400).json({ error: "Score inválido" })
    return
  }

  const current = getTopScore()
  const isNewRecord = !current || score > current.score

  const record = insertScore(score, playerName, deviceId, espMac)

  if (isNewRecord) {
    logger.info("Ranking", `Novo recorde mundial! Score: ${score} - Jogador: ${playerName || "Anônimo"}`)
  } else {
    logger.info("Ranking", `Score registrado: ${score} - Jogador: ${playerName || "Anônimo"}`)
  }

  if (espMac) {
    logger.debug("Ranking", `ESP MAC: ${espMac}`)
  }
  if (deviceId) {
    logger.debug("Ranking", `Device ID: ${deviceId}`)
  }

  res.json({
    success: true,
    isNewRecord,
    record: {
      id: record.id,
      score: record.score,
      playerName: record.player_name,
      createdAt: record.created_at,
    },
  })
})

export default router
