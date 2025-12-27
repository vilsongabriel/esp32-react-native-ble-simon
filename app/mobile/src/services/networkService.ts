import NetInfo, { NetInfoState } from "@react-native-community/netinfo"

export async function isOnline(): Promise<boolean> {
  const state = await NetInfo.fetch()
  return state.isConnected === true && state.isInternetReachable !== false
}

export function onNetworkChange(callback: (isConnected: boolean) => void): () => void {
  const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
    const connected = state.isConnected === true && state.isInternetReachable !== false
    callback(connected)
  })

  return unsubscribe
}
