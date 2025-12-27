export const StorageKeys = {
  HIGH_SCORE: "@genius_high_score",
  PLAYER_NAME: "@genius_player_name",
} as const

export type StorageKey = (typeof StorageKeys)[keyof typeof StorageKeys]
