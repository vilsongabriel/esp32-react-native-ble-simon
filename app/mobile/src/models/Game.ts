export type LedColor = "green" | "red" | "yellow" | "blue"

export type LedStates = {
  green: boolean
  red: boolean
  yellow: boolean
  blue: boolean
}

export type GameState = "idle" | "playing" | "your_turn" | "game_over"

export type GameEvent =
  | { type: "GAME_START" }
  | { type: "PLAYING" }
  | { type: "SHOW"; color: LedColor }
  | { type: "YOUR_TURN" }
  | { type: "LEVEL"; level: number }
  | { type: "GAME_OVER"; score: number }
  | { type: "LED_STATE"; states: LedStates }

const COLOR_MAP: Record<string, LedColor> = {
  G: "green",
  R: "red",
  Y: "yellow",
  B: "blue",
}

export function parseGameEvent(data: string): GameEvent | null {
  if (data === "GAME_START") {
    return { type: "GAME_START" }
  }
  if (data === "PLAYING") {
    return { type: "PLAYING" }
  }
  if (data === "YOUR_TURN") {
    return { type: "YOUR_TURN" }
  }
  if (data.startsWith("SHOW:")) {
    const colorChar = data.substring(5)
    const color = COLOR_MAP[colorChar]
    if (color) {
      return { type: "SHOW", color }
    }
  }
  if (data.startsWith("LEVEL:")) {
    const level = parseInt(data.substring(6), 10)
    return { type: "LEVEL", level }
  }
  if (data.startsWith("GAME_OVER:")) {
    const score = parseInt(data.substring(10), 10)
    return { type: "GAME_OVER", score }
  }
  if (/^[01]{4}$/.test(data)) {
    return {
      type: "LED_STATE",
      states: {
        green: data[0] === "1",
        red: data[1] === "1",
        yellow: data[2] === "1",
        blue: data[3] === "1",
      },
    }
  }
  return null
}
