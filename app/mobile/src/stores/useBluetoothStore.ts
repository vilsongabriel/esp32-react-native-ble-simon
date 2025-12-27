import { create } from "zustand"
import type { Device as BleDevice } from "react-native-ble-plx"
import { Device, fromBleDevice, isTargetDevice } from "@/models/Device"
import { BLE_CONFIG } from "@/constants/bluetooth"
import * as bluetooth from "@/services/bluetoothService"
import { requestBluetoothPermissions } from "@/utils/permissions"
import { logger } from "@/services/logService"

interface BluetoothState {
  isScanning: boolean
  isConnecting: boolean
  isConnected: boolean
  isDisconnected: boolean
  device: Device | null
  permissionsGranted: boolean

  initialize: () => Promise<void>
  startScan: () => void
  stopScan: () => void
  connect: (device: Device) => Promise<void>
  disconnect: () => Promise<void>
  checkConnection: () => Promise<boolean>
  reset: () => void
}

export const useBluetoothStore = create<BluetoothState>((set, get) => {
  let scanTimeoutId: ReturnType<typeof setTimeout> | null = null
  let autoConnecting = false

  const clearScanTimeout = () => {
    if (scanTimeoutId) {
      clearTimeout(scanTimeoutId)
      scanTimeoutId = null
    }
  }

  return {
    isScanning: false,
    isConnecting: false,
    isConnected: false,
    isDisconnected: false,
    device: null,
    permissionsGranted: false,

    initialize: async () => {
      logger.log("[Bluetooth] Inicializando...")

      const hasPermission = await requestBluetoothPermissions()
      set({ permissionsGranted: hasPermission })

      if (!hasPermission) {
        logger.warn("[Bluetooth] Permissoes negadas")
        return
      }

      const existingDevice = await bluetooth.getConnectedDevice()
      if (existingDevice) {
        logger.log("[Bluetooth] Conexao existente encontrada")
        set({
          device: fromBleDevice(existingDevice),
          isConnected: true,
        })
        return
      }

      get().startScan()
    },

    startScan: () => {
      const state = get()
      if (state.isScanning || state.isConnected || autoConnecting) {
        return
      }

      logger.log("[Bluetooth] Iniciando busca...")
      set({ isScanning: true, isDisconnected: false })

      let deviceFound = false

      clearScanTimeout()
      scanTimeoutId = setTimeout(() => {
        if (!deviceFound && get().isScanning) {
          logger.log("[Bluetooth] Timeout na busca, reiniciando...")
          bluetooth.stopScan()
          set({ isScanning: false })
          setTimeout(() => get().startScan(), BLE_CONFIG.SCAN_RETRY_DELAY_MS)
        }
      }, BLE_CONFIG.SCAN_TIMEOUT_MS)

      bluetooth.startScan(
        (bleDevice: BleDevice) => {
          const device = fromBleDevice(bleDevice)

          const matchesByName = isTargetDevice(device, BLE_CONFIG.TARGET_DEVICE_NAME)
          const foundViaServiceFilter = bleDevice.serviceUUIDs?.some(
            (uuid) => uuid.toUpperCase() === BLE_CONFIG.SERVICE_UUID.toUpperCase()
          )

          if (matchesByName || foundViaServiceFilter) {
            deviceFound = true
            clearScanTimeout()
            logger.log("[Bluetooth] Dispositivo encontrado, conectando...")

            bluetooth.stopScan()
            set({ isScanning: false })

            get().connect(device)
          }
        },
        () => {
          clearScanTimeout()
          set({ isScanning: false })
          setTimeout(() => get().startScan(), 3000)
        }
      )
    },

    stopScan: () => {
      clearScanTimeout()
      bluetooth.stopScan()
      set({ isScanning: false })
    },

    connect: async (device: Device) => {
      if (autoConnecting) return
      autoConnecting = true

      set({ device, isConnecting: true, isConnected: false, isDisconnected: false })

      try {
        await bluetooth.connect(device.id)
        set({ isConnected: true })
        logger.log("[Bluetooth] Conectado")
      } catch (error) {
        logger.warn("[Bluetooth] Falha na conexao:", error)
        set({ isConnected: false, device: null })
        setTimeout(() => get().startScan(), 2000)
      } finally {
        set({ isConnecting: false })
        autoConnecting = false
      }
    },

    disconnect: async () => {
      await bluetooth.disconnect()
      set({
        isConnected: false,
        device: null,
        isDisconnected: true,
      })
    },

    checkConnection: async () => {
      const { device } = get()
      if (!device) return false

      const connected = await bluetooth.isConnected(device.id)
      if (!connected) {
        logger.log("[Bluetooth] Conexao perdida")
        set({ isConnected: false, device: null })
        setTimeout(() => get().startScan(), 1000)
      }
      return connected
    },

    reset: () => {
      clearScanTimeout()
      bluetooth.stopScan()
      set({
        isScanning: false,
        isConnecting: false,
        isConnected: false,
        isDisconnected: false,
        device: null,
      })
    },
  }
})
