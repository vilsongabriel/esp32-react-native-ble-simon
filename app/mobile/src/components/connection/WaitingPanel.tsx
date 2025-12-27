import { View, StyleSheet } from "react-native"
import { LoadingIndicator } from "@/components/ui/LoadingIndicator"

interface WaitingPanelProps {
  isConnecting: boolean
  targetDeviceName: string
}

export function WaitingPanel({ isConnecting, targetDeviceName }: WaitingPanelProps) {
  const message = isConnecting ? "Conectando..." : "Procurando ESP32..."

  return (
    <View style={styles.container}>
      <LoadingIndicator message={message} submessage={`Aguardando ${targetDeviceName}`} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
})
