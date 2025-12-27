import { View, Text, StyleSheet } from "react-native"
import type { GameState } from "@/models/Game"
import { GAME_MESSAGES } from "@/constants/game"

interface GameStatusProps {
  state: GameState
  level: number
}

const STATUS_COLORS: Record<GameState, string> = {
  idle: "#888",
  playing: "#F59E0B",
  your_turn: "#22C55E",
  game_over: "#EF4444",
}

export function GameStatus({ state, level }: GameStatusProps) {
  const statusColor = STATUS_COLORS[state]
  const statusText = GAME_MESSAGES[state]

  return (
    <View style={styles.container}>
      <Text style={[styles.statusText, { color: statusColor }]}>{statusText}</Text>
      {level > 0 && state !== "idle" && <Text style={styles.levelText}>Nível: {level}</Text>}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    marginBottom: 20,
  },
  statusText: {
    fontSize: 16,
    fontWeight: "600",
  },
  levelText: {
    fontSize: 28,
    fontWeight: "700",
    color: "#fff",
    marginTop: 8,
  },
})
