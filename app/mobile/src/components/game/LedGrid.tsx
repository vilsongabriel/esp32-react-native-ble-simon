import { View, StyleSheet } from "react-native"
import { LedButton } from "./LedButton"
import { LED_CONFIG } from "@/constants/game"
import type { LedColor } from "@/models/Game"

interface LedGridProps {
  flashingColor: LedColor | null
  disabled: boolean
  onPress: (color: LedColor) => void
}

export function LedGrid({ flashingColor, disabled, onPress }: LedGridProps) {
  return (
    <View style={styles.grid}>
      {LED_CONFIG.map((config) => (
        <LedButton
          key={config.color}
          config={config}
          isFlashing={flashingColor === config.color}
          disabled={disabled}
          onPress={() => onPress(config.color)}
        />
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 16,
  },
})
