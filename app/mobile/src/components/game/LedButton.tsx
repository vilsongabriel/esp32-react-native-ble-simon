import { TouchableOpacity, Text, StyleSheet } from "react-native"
import type { LedConfig } from "@/constants/game"

interface LedButtonProps {
  config: LedConfig
  isFlashing: boolean
  disabled: boolean
  onPress: () => void
}

export function LedButton({ config, isFlashing, disabled, onPress }: LedButtonProps) {
  const backgroundColor = isFlashing ? config.activeColor : config.inactiveColor

  return (
    <TouchableOpacity
      style={[styles.button, { backgroundColor }, disabled && styles.disabled]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
    >
      <Text style={styles.icon}>{isFlashing ? "💡" : "○"}</Text>
      <Text style={styles.label}>{config.label}</Text>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  button: {
    width: 140,
    height: 140,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  disabled: {
    opacity: 0.5,
  },
  icon: {
    fontSize: 32,
  },
  label: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    marginTop: 8,
  },
})
