import type { LedColor } from "@/models/Game"

export interface LedConfig {
  color: LedColor
  label: string
  activeColor: string
  inactiveColor: string
}

export const LED_CONFIG: LedConfig[] = [
  { color: "green", label: "Verde", activeColor: "#4ADE80", inactiveColor: "#166534" },
  { color: "red", label: "Vermelho", activeColor: "#F87171", inactiveColor: "#991B1B" },
  { color: "yellow", label: "Amarelo", activeColor: "#FDE047", inactiveColor: "#854D0E" },
  { color: "blue", label: "Azul", activeColor: "#60A5FA", inactiveColor: "#1E40AF" },
]

export const GAME_MESSAGES = {
  idle: "Toque em Iniciar para jogar",
  playing: "Observe a sequência...",
  your_turn: "Sua vez! Repita a sequência",
  game_over: "Game Over!",
} as const

export const SCORE_MESSAGES = {
  zero: "Tente novamente!",
  low: "Bom começo!",
  medium: "Muito bom!",
  high: "Excelente!",
  excellent: "Incrível!",
} as const

export function getScoreMessage(score: number): string {
  if (score === 0) return SCORE_MESSAGES.zero
  if (score < 5) return SCORE_MESSAGES.low
  if (score < 10) return SCORE_MESSAGES.medium
  if (score < 15) return SCORE_MESSAGES.high
  return SCORE_MESSAGES.excellent
}
