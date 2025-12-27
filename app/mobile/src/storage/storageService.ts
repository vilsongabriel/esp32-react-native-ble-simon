import AsyncStorage from "@react-native-async-storage/async-storage"
import type { StorageKey } from "./storageKeys"
import { logger } from "@/services/logService"

export async function getItem<T = string>(key: StorageKey): Promise<T | null> {
  try {
    const value = await AsyncStorage.getItem(key)
    if (value === null) return null

    try {
      return JSON.parse(value) as T
    } catch {
      return value as T
    }
  } catch (error) {
    logger.warn(`[Storage] Falha ao obter ${key}:`, error)
    return null
  }
}

export async function setItem<T>(key: StorageKey, value: T): Promise<boolean> {
  try {
    const stringValue = typeof value === "string" ? value : JSON.stringify(value)
    await AsyncStorage.setItem(key, stringValue)
    return true
  } catch (error) {
    logger.warn(`[Storage] Falha ao salvar ${key}:`, error)
    return false
  }
}

export async function removeItem(key: StorageKey): Promise<boolean> {
  try {
    await AsyncStorage.removeItem(key)
    return true
  } catch (error) {
    logger.warn(`[Storage] Falha ao remover ${key}:`, error)
    return false
  }
}

export const storage = {
  get: getItem,
  set: setItem,
  remove: removeItem,
}
