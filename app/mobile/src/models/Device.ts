import type { Device as BleDevice } from "react-native-ble-plx"

export interface Device {
  id: string
  name: string
  rssi: number
  lastSeenAt: number
}

export function fromBleDevice(bleDevice: BleDevice): Device {
  return {
    id: bleDevice.id,
    name: bleDevice.name?.trim() || bleDevice.localName?.trim() || "Unknown",
    rssi: bleDevice.rssi ?? -99,
    lastSeenAt: Date.now(),
  }
}

export function isTargetDevice(device: Device, targetName: string): boolean {
  if (device.name === "Unknown") {
    return false
  }
  return device.name.toUpperCase() === targetName.toUpperCase()
}
