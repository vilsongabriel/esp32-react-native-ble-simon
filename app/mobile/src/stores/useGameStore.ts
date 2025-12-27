import { create } from "zustand"
import type { GameState, GameEvent, LedColor } from "@/models/Game"
import { parseGameEvent } from "@/models/Game"
import * as gameService from "@/services/gameService"
import * as rankingService from "@/services/rankingService"
import { monitorNotifications, removeNotificationSubscription } from "@/services/bluetoothService"
import { storage } from "@/storage/storageService"
import { StorageKeys } from "@/storage/storageKeys"
import { logger } from "@/services/logService"
import { getDeviceId } from "@/services/deviceService"
import { isOnline, onNetworkChange } from "@/services/networkService"

interface GameStore {
  state: GameState
  level: number
  flashingColor: LedColor | null
  finalScore: number
  highScore: number
  isNewHighScore: boolean
  isStartingGame: boolean
  showGameOver: boolean
  inputCount: number
  worldRecord: number
  worldRecordHolder: string | null
  playerName: string
  isSubmittingScore: boolean
  isOnline: boolean
  rankingList: rankingService.RankingEntry[]

  startGame: () => Promise<void>
  sendInput: (color: LedColor) => Promise<void>
  handleGameEvent: (event: GameEvent) => void
  loadHighScore: () => Promise<void>
  saveHighScore: (score: number) => Promise<void>
  loadWorldRecord: () => Promise<void>
  loadRankingList: () => Promise<void>
  loadPlayerName: () => Promise<void>
  setPlayerName: (name: string) => void
  submitToRanking: (name?: string, espMac?: string) => Promise<boolean>
  closeGameOver: () => void
  setupNotifications: () => void
  cleanupNotifications: () => void
  setupNetworkListener: () => () => void
  checkNetwork: () => Promise<void>
  canSendInput: () => boolean
  reset: () => void
}

export const useGameStore = create<GameStore>((set, get) => ({
  state: "idle",
  level: 0,
  flashingColor: null,
  finalScore: 0,
  highScore: 0,
  isNewHighScore: false,
  isStartingGame: false,
  showGameOver: false,
  inputCount: 0,
  worldRecord: 0,
  worldRecordHolder: null,
  playerName: "",
  isSubmittingScore: false,
  isOnline: true,
  rankingList: [],

  startGame: async () => {
    try {
      set({ isStartingGame: true, state: "playing", level: 1, showGameOver: false, inputCount: 0 })
      await gameService.startGame()
      logger.log("[Game] Jogo iniciado")
    } catch (error) {
      logger.warn("[Game] Falha ao iniciar:", error)
      set({ isStartingGame: false, state: "idle", level: 0 })
      throw error
    }
  },

  canSendInput: () => {
    const { state, inputCount, level, flashingColor } = get()
    return state === "your_turn" && inputCount < level && flashingColor === null
  },

  sendInput: async (color: LedColor) => {
    if (!get().canSendInput()) return

    set((s) => ({ inputCount: s.inputCount + 1 }))
    await gameService.sendInput(color)
  },

  handleGameEvent: (event: GameEvent) => {
    logger.log("[Game] Evento:", event.type)
    const { highScore } = get()

    switch (event.type) {
      case "GAME_START":
        logger.log("[Game] GAME_START - nivel definido para 1")
        set({ state: "playing", level: 1, showGameOver: false, isStartingGame: false })
        break

      case "PLAYING":
        set({ state: "playing" })
        break

      case "SHOW":
        set({ flashingColor: event.color })
        setTimeout(() => set({ flashingColor: null }), 400)
        break

      case "YOUR_TURN":
        const { inputCount: prevInputCount, level: prevLevel } = get()
        const completedSequence = prevInputCount > 0 && prevInputCount === prevLevel
        const newLevel = completedSequence ? prevLevel + 1 : prevLevel
        logger.log(
          "[Game] YOUR_TURN - input:",
          prevInputCount,
          "nivel:",
          prevLevel,
          "novoNivel:",
          newLevel
        )
        set({ state: "your_turn", flashingColor: null, inputCount: 0, level: newLevel })
        break

      case "LEVEL":
        set({ level: event.level + 1, state: "playing" })
        break

      case "GAME_OVER":
        const { state: currentState } = get()
        if (currentState === "game_over") {
          logger.log("[Game] GAME_OVER ignorado - ja em estado game_over")
          return
        }

        const score = event.score
        const isNewHigh = score > highScore

        set({
          finalScore: score,
          state: "game_over",
          isStartingGame: false,
          isNewHighScore: isNewHigh,
          showGameOver: true,
        })

        if (isNewHigh) {
          get().saveHighScore(score)
          gameService.sendHighScoreCelebration().catch(logger.warn)
        }
        break
    }
  },

  loadHighScore: async () => {
    const saved = await storage.get<string>(StorageKeys.HIGH_SCORE)
    const highScore = saved ? parseInt(saved, 10) : 0
    set({ highScore })
  },

  saveHighScore: async (score: number) => {
    await storage.set(StorageKeys.HIGH_SCORE, score.toString())
    set({ highScore: score })
  },

  loadWorldRecord: async () => {
    const record = await rankingService.getWorldRecord()
    if (record) {
      set({
        worldRecord: record.score,
        worldRecordHolder: record.playerName,
      })
    }
  },

  loadRankingList: async () => {
    const list = await rankingService.getRankingList(10)
    set({ rankingList: list })
  },

  loadPlayerName: async () => {
    const saved = await storage.get<string>(StorageKeys.PLAYER_NAME)
    if (saved) {
      set({ playerName: saved })
    }
  },

  setPlayerName: (name: string) => {
    set({ playerName: name })
    storage.set(StorageKeys.PLAYER_NAME, name)
  },

  submitToRanking: async (name?: string, espMac?: string) => {
    const { finalScore, playerName } = get()
    const nameToSubmit = name || playerName || undefined

    set({ isSubmittingScore: true })

    try {
      const deviceId = await getDeviceId()
      const result = await rankingService.submitScore(finalScore, nameToSubmit, deviceId, espMac)
      if (result?.isNewRecord) {
        set({
          worldRecord: finalScore,
          worldRecordHolder: nameToSubmit || null,
        })
      }
      if (nameToSubmit) {
        get().setPlayerName(nameToSubmit)
      }
      await get().loadRankingList()
      return result?.isNewRecord ?? false
    } catch (error) {
      logger.warn("[Ranking] Falha ao enviar:", error)
      return false
    } finally {
      set({ isSubmittingScore: false })
    }
  },

  closeGameOver: () => {
    set({ showGameOver: false, state: "idle" })
  },

  setupNotifications: () => {
    monitorNotifications((data) => {
      logger.log("[Game] Notificacao:", data)
      const event = parseGameEvent(data)
      if (event) {
        get().handleGameEvent(event)
      } else {
        logger.warn("[Game] Evento desconhecido:", data)
      }
    })
  },

  cleanupNotifications: () => {
    removeNotificationSubscription()
  },

  setupNetworkListener: () => {
    return onNetworkChange((connected) => {
      set({ isOnline: connected })
      if (connected) {
        get().loadWorldRecord()
        get().loadRankingList()
      }
    })
  },

  checkNetwork: async () => {
    const online = await isOnline()
    set({ isOnline: online })
  },

  reset: () => {
    set({
      state: "idle",
      level: 0,
      flashingColor: null,
      finalScore: 0,
      isNewHighScore: false,
      isStartingGame: false,
      showGameOver: false,
      inputCount: 0,
    })
  },
}))
