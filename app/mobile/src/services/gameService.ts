import { sendCommand } from "./bluetoothService"
import type { LedColor } from "@/models/Game"

export async function startGame(): Promise<void> {
  await sendCommand("START_GAME")
}

export async function sendInput(color: LedColor): Promise<void> {
  const command = `INPUT_${color.toUpperCase()}`
  await sendCommand(command)
}

export async function sendHighScoreCelebration(): Promise<void> {
  await sendCommand("NEW_HIGH_SCORE")
}
