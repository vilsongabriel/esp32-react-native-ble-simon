import { useState, useEffect } from "react"
import { Modal, View, Text, TextInput, StyleSheet } from "react-native"
import { Button } from "@/components/ui/Button"
import { getScoreMessage } from "@/constants/game"

interface GameOverModalProps {
  visible: boolean
  score: number
  isNewHighScore: boolean
  playerName: string
  isSubmitting: boolean
  espMac?: string
  onSubmitToRanking: (name?: string, espMac?: string) => Promise<boolean>
  onPlayAgain: () => void
  onClose: () => void
}

export function GameOverModal({
  visible,
  score,
  isNewHighScore,
  playerName,
  isSubmitting,
  espMac,
  onSubmitToRanking,
  onPlayAgain,
  onClose,
}: GameOverModalProps) {
  const [name, setName] = useState(playerName)
  const [submitted, setSubmitted] = useState(false)
  const [isWorldRecord, setIsWorldRecord] = useState(false)

  useEffect(() => {
    if (visible) {
      setName(playerName)
      setSubmitted(false)
      setIsWorldRecord(false)
    }
  }, [visible, playerName])

  const handleSubmit = async () => {
    const result = await onSubmitToRanking(name.trim() || undefined, espMac)
    setSubmitted(true)
    setIsWorldRecord(result)
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.content}>
          <Text style={styles.title}>Game Over!</Text>

          {isNewHighScore && <Text style={styles.newHighScore}>Novo Recorde!</Text>}

          <Text style={styles.scoreLabel}>Nível</Text>
          <Text style={styles.score}>{score}</Text>

          <Text style={styles.message}>{getScoreMessage(score)}</Text>

          {isNewHighScore && !submitted && (
            <View style={styles.rankingSection}>
              <Text style={styles.rankingTitle}>Enviar ao Ranking Mundial</Text>
              <TextInput
                style={styles.nameInput}
                placeholder="Seu nome (opcional)"
                placeholderTextColor="#666"
                value={name}
                onChangeText={setName}
                maxLength={20}
              />
              <Button
                title={isSubmitting ? "Enviando..." : "Enviar"}
                onPress={handleSubmit}
                disabled={isSubmitting}
                loading={isSubmitting}
              />
            </View>
          )}

          {submitted && (
            <Text style={styles.submittedText}>
              {isWorldRecord ? "Novo recorde mundial!" : "Enviado com sucesso!"}
            </Text>
          )}

          <View style={styles.buttons}>
            <Button title="Jogar Novamente" onPress={onPlayAgain} variant="secondary" />
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
    padding: 32,
    alignItems: "center",
    width: "85%",
  },
  title: {
    fontSize: 32,
    fontWeight: "700",
    color: "#EF4444",
    marginBottom: 8,
  },
  newHighScore: {
    fontSize: 18,
    fontWeight: "600",
    color: "#F59E0B",
    marginBottom: 16,
  },
  score: {
    fontSize: 72,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 16,
  },
  scoreLabel: {
    fontSize: 16,
    color: "#888",
    marginTop: 8,
  },
  message: {
    fontSize: 18,
    color: "#888",
    marginBottom: 24,
  },
  rankingSection: {
    width: "100%",
    marginBottom: 24,
    gap: 12,
  },
  rankingTitle: {
    fontSize: 14,
    color: "#60A5FA",
    textAlign: "center",
    fontWeight: "600",
  },
  nameInput: {
    backgroundColor: "#1a1a2e",
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: "#fff",
    textAlign: "center",
  },
  submittedText: {
    fontSize: 16,
    color: "#10B981",
    marginBottom: 24,
    fontWeight: "600",
  },
  buttons: {
    width: "100%",
    gap: 12,
  },
})
