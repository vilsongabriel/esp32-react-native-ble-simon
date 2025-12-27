import { View, Text, StyleSheet } from "react-native"
import { Button } from "@/components/ui/Button"

interface DisconnectedPanelProps {
  onReconnect: () => void
}

export function DisconnectedPanel({ onReconnect }: DisconnectedPanelProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.icon}>📡</Text>
      <Text style={styles.text}>Desconectado</Text>
      <Button title="Reconectar" onPress={onReconnect} variant="secondary" style={styles.button} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  icon: {
    fontSize: 48,
    marginBottom: 16,
  },
  text: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  button: {
    marginTop: 24,
  },
})
