import { Modal, View, Text, FlatList, StyleSheet } from "react-native"
import { Button } from "@/components/ui/Button"
import type { RankingEntry } from "@/services/rankingService"

interface RankingModalProps {
  visible: boolean
  ranking: RankingEntry[]
  isOnline: boolean
  onRefresh: () => void
  onClose: () => void
}

export function RankingModal({
  visible,
  ranking,
  isOnline,
  onRefresh,
  onClose,
}: RankingModalProps) {
  const renderItem = ({ item, index }: { item: RankingEntry; index: number }) => (
    <View style={styles.row}>
      <Text style={styles.position}>{index + 1}</Text>
      <Text style={styles.name}>{item.playerName || "Anonimo"}</Text>
      <Text style={styles.score}>{item.score}</Text>
    </View>
  )

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.content}>
          <Text style={styles.title}>Ranking Mundial</Text>

          {!isOnline && <Text style={styles.offlineText}>Sem conexao com internet</Text>}

          {ranking.length === 0 ? (
            <Text style={styles.emptyText}>
              {isOnline ? "Nenhum score registrado" : "Conecte-se para ver o ranking"}
            </Text>
          ) : (
            <FlatList
              data={ranking}
              keyExtractor={(item) => item.id.toString()}
              renderItem={renderItem}
              style={styles.list}
              showsVerticalScrollIndicator={false}
            />
          )}

          <View style={styles.buttons}>
            {isOnline && <Button title="Atualizar" onPress={onRefresh} variant="secondary" />}
            <Button title="Fechar" onPress={onClose} variant="ghost" />
          </View>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.85)",
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    backgroundColor: "#2a2a4a",
    borderRadius: 24,
    padding: 24,
    width: "90%",
    maxHeight: "80%",
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#60A5FA",
    textAlign: "center",
    marginBottom: 16,
  },
  offlineText: {
    fontSize: 14,
    color: "#EF4444",
    textAlign: "center",
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 16,
    color: "#888",
    textAlign: "center",
    marginVertical: 32,
  },
  list: {
    maxHeight: 300,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#3a3a5a",
  },
  position: {
    width: 32,
    fontSize: 16,
    fontWeight: "700",
    color: "#F59E0B",
  },
  name: {
    flex: 1,
    fontSize: 16,
    color: "#fff",
  },
  score: {
    fontSize: 18,
    fontWeight: "700",
    color: "#10B981",
  },
  buttons: {
    marginTop: 16,
    gap: 12,
  },
})
