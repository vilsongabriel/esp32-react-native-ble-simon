import { View, Text, StyleSheet } from "react-native"

export function ConnectionStatus() {
  return (
    <View style={styles.container}>
      <View style={styles.dot} />
      <Text style={styles.text}>Conectado</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#10B981",
    marginRight: 8,
  },
  text: {
    color: "#10B981",
    fontSize: 16,
    fontWeight: "500",
  },
})
