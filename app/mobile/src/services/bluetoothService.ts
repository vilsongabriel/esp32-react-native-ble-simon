import { BleManager, Device, State, Subscription } from "react-native-ble-plx"
import { Buffer } from "buffer"
import { BLE_CONFIG } from "@/constants/bluetooth"
import { logger } from "@/services/logService"

export const bleManager = new BleManager()

let connectedDevice: Device | null = null
let notificationSubscription: Subscription | null = null

function toBase64(text: string): string {
  return Buffer.from(text, "utf8").toString("base64")
}

function fromBase64(base64: string): string {
  return Buffer.from(base64, "base64").toString("utf8")
}

export function onStateChange(
  callback: (state: State) => void,
  emitCurrentState = true
): Subscription {
  return bleManager.onStateChange(callback, emitCurrentState)
}

export function startScan(
  onDeviceFound: (device: Device) => void,
  onError?: (error: Error) => void
): void {
  bleManager.startDeviceScan(
    [BLE_CONFIG.SERVICE_UUID],
    { allowDuplicates: true },
    (error, device) => {
      if (error) {
        logger.warn("[BLE] Erro no scan:", error.message)
        onError?.(error)
        return
      }
      if (device) {
        onDeviceFound(device)
      }
    }
  )
}

export function stopScan(): void {
  bleManager.stopDeviceScan()
}

export async function connect(deviceId: string): Promise<Device> {
  if (connectedDevice && connectedDevice.id === deviceId) {
    const isConnected = await connectedDevice.isConnected()
    if (isConnected) {
      return connectedDevice
    }
  }

  if (connectedDevice) {
    await disconnect()
  }

  const device = await bleManager.connectToDevice(deviceId, {
    timeout: BLE_CONFIG.CONNECTION_TIMEOUT_MS,
    autoConnect: false,
  })

  await device.discoverAllServicesAndCharacteristics()
  connectedDevice = device

  return device
}

export async function disconnect(): Promise<void> {
  removeNotificationSubscription()

  if (connectedDevice) {
    try {
      await connectedDevice.cancelConnection()
    } catch {}
    connectedDevice = null
  }
}

export async function isConnected(deviceId?: string): Promise<boolean> {
  if (!connectedDevice) return false
  if (deviceId && connectedDevice.id !== deviceId) return false

  try {
    return await connectedDevice.isConnected()
  } catch {
    return false
  }
}

export async function getConnectedDevice(): Promise<Device | null> {
  if (connectedDevice) {
    const connected = await connectedDevice.isConnected()
    if (connected) {
      return connectedDevice
    }
    connectedDevice = null
  }

  try {
    const devices = await bleManager.connectedDevices([BLE_CONFIG.SERVICE_UUID])
    if (devices.length > 0) {
      const device = devices[0]
      await device.discoverAllServicesAndCharacteristics()
      connectedDevice = device
      return device
    }
  } catch (error) {
    logger.warn("[BLE] Erro ao verificar dispositivos conectados:", error)
  }

  return null
}

export async function sendCommand(command: string): Promise<void> {
  if (!connectedDevice) {
    throw new Error("Dispositivo não conectado")
  }

  const connected = await connectedDevice.isConnected()
  if (!connected) {
    connectedDevice = null
    throw new Error("Conexão perdida")
  }

  await connectedDevice.writeCharacteristicWithResponseForService(
    BLE_CONFIG.SERVICE_UUID,
    BLE_CONFIG.RX_UUID,
    toBase64(command)
  )
}

export function removeNotificationSubscription(): void {
  if (notificationSubscription) {
    notificationSubscription.remove()
    notificationSubscription = null
    logger.log("[BLE] Inscricao de notificacoes removida")
  }
}

export function monitorNotifications(
  onData: (data: string) => void,
  onError?: (error: Error) => void
): Subscription | null {
  if (!connectedDevice) {
    logger.warn("[BLE] Sem dispositivo conectado para monitorar")
    return null
  }

  removeNotificationSubscription()

  notificationSubscription = connectedDevice.monitorCharacteristicForService(
    BLE_CONFIG.SERVICE_UUID,
    BLE_CONFIG.TX_UUID,
    (error, characteristic) => {
      if (error) {
        logger.warn("[BLE] Erro na notificacao:", error.message)
        onError?.(error)
        return
      }
      if (characteristic?.value) {
        const decoded = fromBase64(characteristic.value).trim()
        onData(decoded)
      }
    }
  )

  return notificationSubscription
}

export async function readCharacteristic(): Promise<string | null> {
  if (!connectedDevice) return null

  try {
    const char = await connectedDevice.readCharacteristicForService(
      BLE_CONFIG.SERVICE_UUID,
      BLE_CONFIG.TX_UUID
    )
    return char.value ? fromBase64(char.value) : null
  } catch (error) {
    logger.warn("[BLE] Erro de leitura:", error)
    return null
  }
}
