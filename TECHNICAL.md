# Technical Documentation

This document describes the complete technical architecture of the project, including all components, communication protocols, and data flows.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Project Structure](#project-structure)
3. [ESP32 Firmware](#esp32-firmware)
4. [Mobile Application](#mobile-application)
5. [Ranking API](#ranking-api)
6. [BLE Communication Protocol](#ble-communication-protocol)
7. [Data Flow](#data-flow)
8. [Data Persistence](#data-persistence)
9. [Configuration and Environment Variables](#configuration-and-environment-variables)

---

## Architecture Overview

The project consists of three main components that communicate with each other:

```
┌─────────────────┐     BLE      ┌─────────────────┐     HTTP     ┌─────────────────┐
│                 │◄────────────►│                 │─────────────►│                 │
│   ESP32         │              │   Mobile App    │              │   Node.js API   │
│   (Firmware)    │              │   (React Native)│◄─────────────│   (Express)     │
│                 │              │                 │              │                 │
└─────────────────┘              └─────────────────┘              └─────────────────┘
      │                                  │                               │
      │                                  │                               │
      ▼                                  ▼                               ▼
   4 LEDs                           AsyncStorage                      SQLite
   Buzzer                           (Local)                          (genius.db)
```

### Technologies Used

| Component | Technology | Version |
|-----------|------------|---------|
| Firmware | Arduino/C++ + NimBLE | ESP32 |
| Mobile | React Native + Expo | SDK 54 |
| API | Node.js + Express | 4.18.2 |
| Database | SQLite (better-sqlite3) | 11.7.0 |
| State Management | Zustand | 5.0.9 |
| BLE Library | react-native-ble-plx | 3.5.0 |

---

## Project Structure

```
genius-game/
├── app/
│   ├── api/                          # Node.js REST API
│   │   ├── src/
│   │   │   ├── index.ts              # Express server
│   │   │   ├── database.ts           # SQLite connection
│   │   │   ├── routes/
│   │   │   │   └── ranking.ts        # Ranking endpoints
│   │   │   └── services/
│   │   │       └── logger.ts         # Logging service
│   │   ├── data/
│   │   │   └── genius.db             # SQLite database
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── mobile/                       # React Native/Expo App
│       ├── src/
│       │   ├── App.tsx               # Main component
│       │   ├── components/
│       │   │   ├── connection/       # BLE connection components
│       │   │   ├── game/             # Game components
│       │   │   └── ui/               # Reusable UI components
│       │   ├── constants/            # Constant configurations
│       │   ├── models/               # TypeScript types
│       │   ├── services/             # Services (BLE, API, etc.)
│       │   ├── storage/              # AsyncStorage wrapper
│       │   ├── stores/               # Zustand stores
│       │   └── utils/                # Utilities
│       ├── .env                      # Environment variables
│       ├── app.json                  # Expo configuration
│       └── package.json
│
└── firmware/
    └── genius/
        └── genius.ino                # ESP32 code
```

---

## ESP32 Firmware

### Hardware

| Component | GPIO Pin | Description |
|-----------|----------|-------------|
| Green LED | 18 | Green color LED |
| Red LED | 19 | Red color LED |
| Yellow LED | 21 | Yellow color LED |
| Blue LED | 22 | Blue color LED |
| Buzzer | 23 | Passive buzzer for sounds |

### Musical Notes

Each LED is associated with a musical frequency:

| LED | Note | Frequency (Hz) |
|-----|------|----------------|
| Green | C4 | 261.63 |
| Red | D4 | 293.66 |
| Yellow | E4 | 329.63 |
| Blue | F4 | 349.23 |

### BLE Configuration

The ESP32 uses the Nordic UART Service (NUS) for communication:

```cpp
SERVICE_UUID: "6E400001-B5A3-F393-E0A9-E50E24DCCA9E"
RX_UUID:      "6E400002-B5A3-F393-E0A9-E50E24DCCA9E"  // App -> ESP32
TX_UUID:      "6E400003-B5A3-F393-E0A9-E50E24DCCA9E"  // ESP32 -> App
```

### Game State

```cpp
MAX_SEQUENCE = 100          // Maximum levels
gameSequence[MAX_SEQUENCE]  // Color sequence array
gameLength                  // Current sequence length
playerIndex                 // Player input index
gameActive                  // Game is active
waitingInput                // Waiting for player input
```

### Random Number Generation

Uses the ESP32 hardware True Random Number Generator (TRNG):

```cpp
gameSequence[gameLength++] = esp_random() % 4;
```

### BLE Callbacks

**ServerCallbacks:**
- `onConnect`: Resets the game, plays connection beep
- `onDisconnect`: Resets the game, restarts advertising

**RxCallbacks:**
- Processes commands received from the app

---

## Mobile Application

### State Architecture (Zustand)

#### useBluetoothStore

Manages Bluetooth connection state:

```typescript
interface BluetoothState {
  isScanning: boolean
  isConnecting: boolean
  isConnected: boolean
  isDisconnected: boolean
  device: Device | null
  permissionsGranted: boolean

  initialize(): Promise<void>
  startScan(): void
  stopScan(): void
  connect(device: Device): Promise<void>
  disconnect(): Promise<void>
  checkConnection(): Promise<boolean>
  reset(): void
}
```

#### useGameStore

Manages game state:

```typescript
interface GameStore {
  state: GameState           // "idle" | "playing" | "your_turn" | "game_over"
  level: number
  flashingColor: LedColor | null
  finalScore: number
  highScore: number
  isNewHighScore: boolean
  isStartingGame: boolean
  showGameOver: boolean
  inputCount: number
  worldRecord: number
  worldRecordHolder: string | null
  playerName: string
  isSubmittingScore: boolean
  isOnline: boolean
  rankingList: RankingEntry[]

  startGame(): Promise<void>
  sendInput(color: LedColor): Promise<void>
  handleGameEvent(event: GameEvent): void
  loadHighScore(): Promise<void>
  saveHighScore(score: number): Promise<void>
  loadWorldRecord(): Promise<void>
  loadRankingList(): Promise<void>
  submitToRanking(name?: string, espMac?: string): Promise<boolean>
  // ... other methods
}
```

### Services

#### bluetoothService.ts

```typescript
// Main functions
startScan(onDeviceFound, onError)    // Starts BLE scan
stopScan()                            // Stops scan
connect(deviceId)                     // Connects to device
disconnect()                          // Disconnects
sendCommand(command)                  // Sends command via RX
monitorNotifications(onData, onError) // Monitors TX
```

#### gameService.ts

```typescript
startGame()                    // Sends "START_GAME"
sendInput(color)               // Sends "INPUT_GREEN", etc.
sendHighScoreCelebration()     // Sends "NEW_HIGH_SCORE"
```

#### rankingService.ts

```typescript
getWorldRecord()                           // GET /ranking
getRankingList(limit)                      // GET /ranking/list
submitScore(score, playerName, deviceId, espMac)  // POST /ranking
```

#### networkService.ts

```typescript
isOnline()                     // Checks connectivity
onNetworkChange(callback)      // Network change listener
```

#### deviceService.ts

```typescript
getDeviceId()   // Returns Android ID or iOS Vendor ID
```

### Components

#### Component Hierarchy

```
App.tsx
├── ConnectionStatus          # Shows connected device name
├── GameStatus                # Game state and current level
├── LedGrid                   # 2x2 LED grid
│   └── LedButton (x4)        # Individual color button
├── WaitingPanel              # Search/connection screen
├── DisconnectedPanel         # Reconnection screen
├── GameOverModal             # Game over modal
└── RankingModal              # World ranking modal
```

### Data Models

#### GameEvent

```typescript
type GameEvent =
  | { type: "GAME_START" }
  | { type: "PLAYING" }
  | { type: "SHOW"; color: LedColor }
  | { type: "YOUR_TURN" }
  | { type: "LEVEL"; level: number }
  | { type: "GAME_OVER"; score: number }
  | { type: "LED_STATE"; states: LedStates }
```

#### Event Parser

```typescript
function parseGameEvent(data: string): GameEvent | null {
  // "GAME_START"      -> { type: "GAME_START" }
  // "SHOW:G"          -> { type: "SHOW", color: "green" }
  // "LEVEL:5"         -> { type: "LEVEL", level: 5 }
  // "GAME_OVER:10"    -> { type: "GAME_OVER", score: 10 }
}
```

---

## Ranking API

### Endpoints

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/` | API information |
| GET | `/health` | Health check |
| GET | `/ranking` | Returns world record |
| GET | `/ranking/list?limit=10` | Lists top scores |
| POST | `/ranking` | Submits new score |

### Schemas

#### GET /ranking (Response)

```json
{
  "score": 15,
  "playerName": "John",
  "updatedAt": "2025-12-27T10:00:00.000Z"
}
```

#### GET /ranking/list (Response)

```json
[
  {
    "id": 1,
    "score": 15,
    "playerName": "John",
    "deviceId": "abc123",
    "espMac": "AA:BB:CC:DD:EE:FF",
    "createdAt": "2025-12-27T10:00:00.000Z"
  }
]
```

#### POST /ranking (Request)

```json
{
  "score": 15,
  "playerName": "John",
  "deviceId": "abc123",
  "espMac": "AA:BB:CC:DD:EE:FF"
}
```

#### POST /ranking (Response)

```json
{
  "success": true,
  "isNewRecord": true,
  "record": {
    "id": 1,
    "score": 15,
    "playerName": "John",
    "createdAt": "2025-12-27T10:00:00.000Z"
  }
}
```

### Database

#### Table: scores

```sql
CREATE TABLE scores (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  score INTEGER NOT NULL,
  player_name TEXT,
  device_id TEXT,
  esp_mac TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
)
```

---

## BLE Communication Protocol

### Commands (App → ESP32)

| Command | Description |
|---------|-------------|
| `START_GAME` | Starts new game |
| `INPUT_GREEN` | Player pressed green |
| `INPUT_RED` | Player pressed red |
| `INPUT_YELLOW` | Player pressed yellow |
| `INPUT_BLUE` | Player pressed blue |
| `NEW_HIGH_SCORE` | Plays record celebration |

### Events (ESP32 → App)

| Event | Description |
|-------|-------------|
| `GAME_START` | Game started |
| `PLAYING` | ESP32 playing sequence |
| `SHOW:G` | Showing green LED |
| `SHOW:R` | Showing red LED |
| `SHOW:Y` | Showing yellow LED |
| `SHOW:B` | Showing blue LED |
| `YOUR_TURN` | Player's turn |
| `LEVEL:N` | Current level (N = number) |
| `GAME_OVER:N` | Game over (N = score) |

### Sequence Diagram

```
    App                         ESP32
     │                            │
     │    START_GAME              │
     │───────────────────────────►│
     │                            │
     │    GAME_START              │
     │◄───────────────────────────│
     │                            │
     │    PLAYING                 │
     │◄───────────────────────────│
     │                            │
     │    SHOW:G                  │
     │◄───────────────────────────│
     │                            │
     │    YOUR_TURN               │
     │◄───────────────────────────│
     │                            │
     │    INPUT_GREEN             │
     │───────────────────────────►│
     │                            │
     │    LEVEL:2                 │
     │◄───────────────────────────│
     │                            │
     │    PLAYING                 │
     │◄───────────────────────────│
     │         ...                │
     │                            │
     │    GAME_OVER:5             │
     │◄───────────────────────────│
     │                            │
```

---

## Data Flow

### 1. Initial Connection

```
1. App starts BLE scan looking for SERVICE_UUID
2. ESP32 is in advertising mode
3. App finds device with name "ESP32-GENIUS"
4. App connects to device
5. App discovers services and characteristics
6. App subscribes to notifications on TX characteristic
7. ESP32 plays connection beep
```

### 2. Game Start

```
1. User presses "Start Game"
2. App sends "START_GAME" via RX characteristic
3. ESP32 resets game state
4. ESP32 generates first random color (esp_random() % 4)
5. ESP32 sends "GAME_START"
6. ESP32 waits 1 second
7. ESP32 plays sequence (PLAYING, SHOW:X...)
8. ESP32 sends "YOUR_TURN"
9. App enables buttons for input
```

### 3. Player Input

```
1. Player presses color button
2. App sends "INPUT_<COLOR>"
3. ESP32 validates if it's the correct color
4. If correct and sequence incomplete: waitingInput = true
5. If correct and sequence complete: nextLevel()
6. If incorrect: gameOver()
```

### 4. Game Over

```
1. ESP32 sends "GAME_OVER:<score>"
2. App displays Game Over modal
3. If new personal record:
   a. App saves to AsyncStorage
   b. App sends "NEW_HIGH_SCORE" (optional)
   c. App allows submission to world ranking
4. If user submits to ranking:
   a. App gets deviceId via expo-application
   b. App sends POST /ranking with score, name, deviceId, espMac
   c. API saves to SQLite
   d. API returns whether it's a new world record
```

---

## Data Persistence

### Local (AsyncStorage)

| Key | Type | Description |
|-----|------|-------------|
| `@genius_high_score` | string (number) | Personal record |
| `@genius_player_name` | string | Last used name |

### Remote (SQLite)

All scores are stored in the API for global ranking.

---

## Configuration and Environment Variables

### Mobile App (.env)

```env
EXPO_PUBLIC_API_URL=http://192.168.0.100:3000
```

### API

```env
PORT=3000  # (optional, default: 3000)
```

### BLE Constants (bluetooth.ts)

```typescript
BLE_CONFIG = {
  SERVICE_UUID: "6E400001-B5A3-F393-E0A9-E50E24DCCA9E",
  RX_UUID: "6E400002-B5A3-F393-E0A9-E50E24DCCA9E",
  TX_UUID: "6E400003-B5A3-F393-E0A9-E50E24DCCA9E",
  TARGET_DEVICE_NAME: "ESP32-GENIUS",
  SCAN_TIMEOUT_MS: 10000,
  SCAN_RETRY_DELAY_MS: 1000,
  CONNECTION_TIMEOUT_MS: 10000,
  CONNECTION_CHECK_INTERVAL_MS: 2000,
}
```
