import { useEffect, useState } from "react"
import { StyleSheet, Text, View, Alert, TouchableOpacity } from "react-native"
import { StatusBar } from "expo-status-bar"
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context"

import { useBluetoothStore } from "@/stores/useBluetoothStore"
import { useGameStore } from "@/stores/useGameStore"
import { BLE_CONFIG } from "@/constants/bluetooth"
import { onStateChange } from "@/services/bluetoothService"

import { Button } from "@/components/ui/Button"
import { LedGrid } from "@/components/game/LedGrid"
import { GameStatus } from "@/components/game/GameStatus"
import { GameOverModal } from "@/components/game/GameOverModal"
import { RankingModal } from "@/components/game/RankingModal"
import { ConnectionStatus } from "@/components/connection/ConnectionStatus"
import { WaitingPanel } from "@/components/connection/WaitingPanel"
import { DisconnectedPanel } from "@/components/connection/DisconnectedPanel"

export default function App() {
  const {
    isConnecting,
    isConnected,
    isDisconnected,
    device,
    initialize: initBluetooth,
    startScan,
    disconnect,
    checkConnection,
  } = useBluetoothStore()

  const {
    state: gameState,
    level,
    flashingColor,
    finalScore,
    highScore,
    isNewHighScore,
    isStartingGame,
    showGameOver,
    inputCount,
    worldRecord,
    worldRecordHolder,
    playerName,
    isSubmittingScore,
    isOnline,
    rankingList,
    startGame,
    sendInput,
    loadHighScore,
    loadWorldRecord,
    loadRankingList,
    loadPlayerName,
    submitToRanking,
    closeGameOver,
    setupNotifications,
    cleanupNotifications,
    setupNetworkListener,
    checkNetwork,
    reset: resetGame,
  } = useGameStore()

  const [showRanking, setShowRanking] = useState(false)

  useEffect(() => {
    const subscription = onStateChange((state) => {
      if (state === "PoweredOn") {
        initBluetooth()
      }
    }, true)

    return () => subscription.remove()
  }, [initBluetooth])

  useEffect(() => {
    loadHighScore()
    loadWorldRecord()
    loadRankingList()
    loadPlayerName()
    checkNetwork()

    const unsubscribe = setupNetworkListener()
    return () => unsubscribe()
  }, [
    loadHighScore,
    loadWorldRecord,
    loadRankingList,
    loadPlayerName,
    checkNetwork,
    setupNetworkListener,
  ])

  useEffect(() => {
    if (isConnected) {
      setupNotifications()
    }
    return () => {
      cleanupNotifications()
    }
  }, [isConnected, setupNotifications, cleanupNotifications])

  useEffect(() => {
    if (!device || !isConnected) return

    const interval = setInterval(() => {
      checkConnection().then((connected) => {
        if (!connected) {
          resetGame()
        }
      })
    }, BLE_CONFIG.CONNECTION_CHECK_INTERVAL_MS)

    return () => clearInterval(interval)
  }, [device, isConnected, checkConnection, resetGame])

  const handleDisconnect = async () => {
    await disconnect()
    resetGame()
  }

  const handleReconnect = () => {
    startScan()
  }

  const handleStartGame = async () => {
    try {
      await startGame()
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error)
      Alert.alert("Erro", message)
    }
  }

  const handlePlayAgain = async () => {
    closeGameOver()
    await handleStartGame()
  }

  const canPressButtons = gameState === "your_turn" && inputCount < level && flashingColor === null

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
        <StatusBar style="light" />

        <Text style={styles.title}>GENIUS</Text>

        <View style={styles.recordsContainer}>
          {highScore > 0 && <Text style={styles.highScore}>Recorde: {highScore}</Text>}
          <TouchableOpacity onPress={() => setShowRanking(true)}>
            {worldRecord > 0 ? (
              <Text style={styles.worldRecord}>
                Mundial: {worldRecord}
                {worldRecordHolder ? ` (${worldRecordHolder})` : ""} {!isOnline && "(offline)"}
              </Text>
            ) : (
              <Text style={styles.worldRecord}>Ver Ranking Mundial</Text>
            )}
          </TouchableOpacity>
        </View>

        {isConnected && device ? (
          <View style={styles.connectedPanel}>
            <ConnectionStatus />

            <GameStatus state={gameState} level={level} />

            <LedGrid
              flashingColor={flashingColor}
              disabled={!canPressButtons}
              onPress={sendInput}
            />

            {gameState === "idle" && (
              <Button
                title={isStartingGame ? "Iniciando..." : "Iniciar Jogo"}
                onPress={handleStartGame}
                loading={isStartingGame}
                disabled={isStartingGame}
                style={styles.startButton}
              />
            )}

            <Button
              title="Desconectar"
              onPress={handleDisconnect}
              variant="danger"
              style={styles.disconnectButton}
            />
          </View>
        ) : isDisconnected ? (
          <DisconnectedPanel onReconnect={handleReconnect} />
        ) : (
          <WaitingPanel
            isConnecting={isConnecting}
            targetDeviceName={BLE_CONFIG.TARGET_DEVICE_NAME}
          />
        )}

        <GameOverModal
          visible={showGameOver}
          score={finalScore}
          isNewHighScore={isNewHighScore}
          playerName={playerName}
          isSubmitting={isSubmittingScore}
          espMac={device?.id}
          onSubmitToRanking={submitToRanking}
          onPlayAgain={handlePlayAgain}
          onClose={closeGameOver}
        />

        <RankingModal
          visible={showRanking}
          ranking={rankingList}
          isOnline={isOnline}
          onRefresh={loadRankingList}
          onClose={() => setShowRanking(false)}
        />
      </SafeAreaView>
    </SafeAreaProvider>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#111",
    paddingHorizontal: 20,
    justifyContent: "center",
  },
  title: {
    fontSize: 32,
    fontWeight: "700",
    color: "#fff",
    textAlign: "center",
  },
  recordsContainer: {
    marginBottom: 20,
    alignItems: "center",
  },
  highScore: {
    fontSize: 14,
    color: "#F59E0B",
    textAlign: "center",
  },
  worldRecord: {
    fontSize: 14,
    color: "#60A5FA",
    textAlign: "center",
    marginTop: 4,
  },
  connectedPanel: {
    alignItems: "center",
  },
  startButton: {
    marginTop: 30,
    paddingHorizontal: 48,
  },
  disconnectButton: {
    marginTop: 30,
  },
})
