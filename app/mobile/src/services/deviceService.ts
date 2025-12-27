import { Platform } from "react-native"
import * as Application from "expo-application"

export async function getDeviceId(): Promise<string | null> {
  if (Platform.OS === "android") {
    return Application.getAndroidId()
  }

  if (Platform.OS === "ios") {
    return await Application.getIosIdForVendorAsync()
  }

  return null
}
