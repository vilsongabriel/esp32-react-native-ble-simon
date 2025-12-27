import { ActivityIndicator, View, Text, StyleSheet, ViewStyle } from "react-native"

interface LoadingIndicatorProps {
  message?: string
  submessage?: string
  size?: "small" | "large"
  color?: string
  style?: ViewStyle
}

export function LoadingIndicator({
  message,
  submessage,
  size = "large",
  color = "#3B82F6",
  style,
}: LoadingIndicatorProps) {
  return (
    <View style={[styles.container, style]}>
      <ActivityIndicator size={size} color={color} />
      {message && <Text style={styles.message}>{message}</Text>}
      {submessage && <Text style={styles.submessage}>{submessage}</Text>}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
  },
  message: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
    marginTop: 20,
  },
  submessage: {
    color: "#666",
    fontSize: 14,
    marginTop: 8,
  },
})
