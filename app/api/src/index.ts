import express, { Request, Response, NextFunction } from "express"
import cors from "cors"
import rankingRouter from "./routes/ranking"
import { logger } from "./services/logger"

const app = express()
const PORT = process.env.PORT || 3000

app.use(cors())
app.use(express.json())

app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now()

  res.on("finish", () => {
    const duration = Date.now() - start
    logger.info("HTTP", `${req.method} ${req.path} ${res.statusCode} - ${duration}ms`)
  })

  next()
})

app.use("/ranking", rankingRouter)

app.get("/", (_req, res) => {
  res.json({ message: "Genius Game API", version: "1.0.0" })
})

app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() })
})

app.listen(PORT, () => {
  logger.info("Server", `API iniciada em http://localhost:${PORT}`)
})
