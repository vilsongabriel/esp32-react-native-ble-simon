# Documentação Técnica

Este documento descreve a arquitetura técnica completa do projeto, incluindo todos os componentes, protocolos de comunicação e fluxos de dados.

## Índice

1. [Visão Geral da Arquitetura](#visão-geral-da-arquitetura)
2. [Estrutura do Projeto](#estrutura-do-projeto)
3. [Firmware ESP32](#firmware-esp32)
4. [Aplicativo Mobile](#aplicativo-mobile)
5. [API de Ranking](#api-de-ranking)
6. [Protocolo de Comunicação BLE](#protocolo-de-comunicação-ble)
7. [Fluxo de Dados](#fluxo-de-dados)
8. [Persistência de Dados](#persistência-de-dados)
9. [Configurações e Variáveis de Ambiente](#configurações-e-variáveis-de-ambiente)

---

## Visão Geral da Arquitetura

O projeto é composto por três componentes principais que se comunicam entre si:

```
┌─────────────────┐     BLE      ┌─────────────────┐     HTTP     ┌─────────────────┐
│                 │◄────────────►│                 │─────────────►│                 │
│   ESP32         │              │   App Mobile    │              │   API Node.js   │
│   (Firmware)    │              │   (React Native)│◄─────────────│   (Express)     │
│                 │              │                 │              │                 │
└─────────────────┘              └─────────────────┘              └─────────────────┘
      │                                  │                               │
      │                                  │                               │
      ▼                                  ▼                               ▼
   4 LEDs                           AsyncStorage                      SQLite
   Buzzer                           (Local)                          (genius.db)
```

### Tecnologias Utilizadas

| Componente | Tecnologia | Versão |
|------------|------------|--------|
| Firmware | Arduino/C++ + NimBLE | ESP32 |
| Mobile | React Native + Expo | SDK 54 |
| API | Node.js + Express | 4.18.2 |
| Banco de Dados | SQLite (better-sqlite3) | 11.7.0 |
| State Management | Zustand | 5.0.9 |
| BLE Library | react-native-ble-plx | 3.5.0 |

---

## Estrutura do Projeto

```
genius-game/
├── app/
│   ├── api/                          # API REST Node.js
│   │   ├── src/
│   │   │   ├── index.ts              # Servidor Express
│   │   │   ├── database.ts           # Conexão SQLite
│   │   │   ├── routes/
│   │   │   │   └── ranking.ts        # Endpoints de ranking
│   │   │   └── services/
│   │   │       └── logger.ts         # Serviço de logging
│   │   ├── data/
│   │   │   └── genius.db             # Banco SQLite
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── mobile/                       # App React Native/Expo
│       ├── src/
│       │   ├── App.tsx               # Componente principal
│       │   ├── components/
│       │   │   ├── connection/       # Componentes de conexão BLE
│       │   │   ├── game/             # Componentes do jogo
│       │   │   └── ui/               # Componentes UI reutilizáveis
│       │   ├── constants/            # Configurações constantes
│       │   ├── models/               # Tipos TypeScript
│       │   ├── services/             # Serviços (BLE, API, etc.)
│       │   ├── storage/              # AsyncStorage wrapper
│       │   ├── stores/               # Zustand stores
│       │   └── utils/                # Utilitários
│       ├── .env                      # Variáveis de ambiente
│       ├── app.json                  # Configuração Expo
│       └── package.json
│
└── firmware/
    └── genius/
        └── genius.ino                # Código do ESP32
```

---

## Firmware ESP32

### Hardware

| Componente | Pino GPIO | Descrição |
|------------|-----------|-----------|
| LED Verde | 18 | LED de cor verde |
| LED Vermelho | 19 | LED de cor vermelha |
| LED Amarelo | 21 | LED de cor amarela |
| LED Azul | 22 | LED de cor azul |
| Buzzer | 23 | Buzzer passivo para sons |

### Notas Musicais

Cada LED está associado a uma frequência musical:

| LED | Nota | Frequência (Hz) |
|-----|------|-----------------|
| Verde | C4 | 261.63 |
| Vermelho | D4 | 293.66 |
| Amarelo | E4 | 329.63 |
| Azul | F4 | 349.23 |

### Configuração BLE

O ESP32 utiliza o Nordic UART Service (NUS) para comunicação:

```cpp
SERVICE_UUID: "6E400001-B5A3-F393-E0A9-E50E24DCCA9E"
RX_UUID:      "6E400002-B5A3-F393-E0A9-E50E24DCCA9E"  // App -> ESP32
TX_UUID:      "6E400003-B5A3-F393-E0A9-E50E24DCCA9E"  // ESP32 -> App
```

### Estado do Jogo

```cpp
MAX_SEQUENCE = 100          // Máximo de níveis
gameSequence[MAX_SEQUENCE]  // Array com a sequência de cores
gameLength                  // Tamanho atual da sequência
playerIndex                 // Índice do input do jogador
gameActive                  // Jogo está ativo
waitingInput                // Aguardando input do jogador
```

### Geração de Números Aleatórios

Utiliza o True Random Number Generator (TRNG) do hardware ESP32:

```cpp
gameSequence[gameLength++] = esp_random() % 4;
```

### Callbacks BLE

**ServerCallbacks:**
- `onConnect`: Reseta o jogo, toca beep de conexão
- `onDisconnect`: Reseta o jogo, reinicia advertising

**RxCallbacks:**
- Processa comandos recebidos do app

---

## Aplicativo Mobile

### Arquitetura de Estado (Zustand)

#### useBluetoothStore

Gerencia o estado da conexão Bluetooth:

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

Gerencia o estado do jogo:

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
  // ... outros métodos
}
```

### Serviços

#### bluetoothService.ts

```typescript
// Funções principais
startScan(onDeviceFound, onError)    // Inicia scan BLE
stopScan()                            // Para scan
connect(deviceId)                     // Conecta ao dispositivo
disconnect()                          // Desconecta
sendCommand(command)                  // Envia comando via RX
monitorNotifications(onData, onError) // Monitora TX
```

#### gameService.ts

```typescript
startGame()                    // Envia "START_GAME"
sendInput(color)               // Envia "INPUT_GREEN", etc.
sendHighScoreCelebration()     // Envia "NEW_HIGH_SCORE"
```

#### rankingService.ts

```typescript
getWorldRecord()                           // GET /ranking
getRankingList(limit)                      // GET /ranking/list
submitScore(score, playerName, deviceId, espMac)  // POST /ranking
```

#### networkService.ts

```typescript
isOnline()                     // Verifica conectividade
onNetworkChange(callback)      // Listener de mudanças
```

#### deviceService.ts

```typescript
getDeviceId()   // Retorna Android ID ou iOS Vendor ID
```

### Componentes

#### Hierarquia de Componentes

```
App.tsx
├── ConnectionStatus          # Mostra nome do dispositivo conectado
├── GameStatus                # Estado do jogo e nível atual
├── LedGrid                   # Grid 2x2 dos LEDs
│   └── LedButton (x4)        # Botão individual de cada cor
├── WaitingPanel              # Tela de busca/conexão
├── DisconnectedPanel         # Tela de reconexão
├── GameOverModal             # Modal de fim de jogo
└── RankingModal              # Modal do ranking mundial
```

### Modelos de Dados

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

#### Parser de Eventos

```typescript
function parseGameEvent(data: string): GameEvent | null {
  // "GAME_START"      -> { type: "GAME_START" }
  // "SHOW:G"          -> { type: "SHOW", color: "green" }
  // "LEVEL:5"         -> { type: "LEVEL", level: 5 }
  // "GAME_OVER:10"    -> { type: "GAME_OVER", score: 10 }
}
```

---

## API de Ranking

### Endpoints

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/` | Informações da API |
| GET | `/health` | Health check |
| GET | `/ranking` | Retorna o recorde mundial |
| GET | `/ranking/list?limit=10` | Lista top scores |
| POST | `/ranking` | Submete novo score |

### Schemas

#### GET /ranking (Response)

```json
{
  "score": 15,
  "playerName": "João",
  "updatedAt": "2025-12-27T10:00:00.000Z"
}
```

#### GET /ranking/list (Response)

```json
[
  {
    "id": 1,
    "score": 15,
    "playerName": "João",
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
  "playerName": "João",
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
    "playerName": "João",
    "createdAt": "2025-12-27T10:00:00.000Z"
  }
}
```

### Banco de Dados

#### Tabela: scores

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

## Protocolo de Comunicação BLE

### Comandos (App → ESP32)

| Comando | Descrição |
|---------|-----------|
| `START_GAME` | Inicia novo jogo |
| `INPUT_GREEN` | Jogador pressionou verde |
| `INPUT_RED` | Jogador pressionou vermelho |
| `INPUT_YELLOW` | Jogador pressionou amarelo |
| `INPUT_BLUE` | Jogador pressionou azul |
| `NEW_HIGH_SCORE` | Tocam celebração de recorde |

### Eventos (ESP32 → App)

| Evento | Descrição |
|--------|-----------|
| `GAME_START` | Jogo iniciado |
| `PLAYING` | ESP32 reproduzindo sequência |
| `SHOW:G` | Mostrando LED verde |
| `SHOW:R` | Mostrando LED vermelho |
| `SHOW:Y` | Mostrando LED amarelo |
| `SHOW:B` | Mostrando LED azul |
| `YOUR_TURN` | Vez do jogador |
| `LEVEL:N` | Nível atual (N = número) |
| `GAME_OVER:N` | Fim de jogo (N = score) |

### Diagrama de Sequência

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

## Fluxo de Dados

### 1. Conexão Inicial

```
1. App inicia scan BLE buscando SERVICE_UUID
2. ESP32 está em modo advertising
3. App encontra dispositivo com nome "ESP32-GENIUS"
4. App conecta ao dispositivo
5. App descobre serviços e características
6. App inscreve-se para notificações na característica TX
7. ESP32 toca beep de conexão
```

### 2. Início do Jogo

```
1. Usuário pressiona "Iniciar Jogo"
2. App envia "START_GAME" via característica RX
3. ESP32 reseta estado do jogo
4. ESP32 gera primeira cor aleatória (esp_random() % 4)
5. ESP32 envia "GAME_START"
6. ESP32 aguarda 1 segundo
7. ESP32 reproduz sequência (PLAYING, SHOW:X...)
8. ESP32 envia "YOUR_TURN"
9. App habilita botões para input
```

### 3. Input do Jogador

```
1. Jogador pressiona botão de cor
2. App envia "INPUT_<COR>"
3. ESP32 valida se é a cor correta
4. Se correto e sequência incompleta: waitingInput = true
5. Se correto e sequência completa: nextLevel()
6. Se incorreto: gameOver()
```

### 4. Fim de Jogo

```
1. ESP32 envia "GAME_OVER:<score>"
2. App exibe modal de Game Over
3. Se novo recorde pessoal:
   a. App salva no AsyncStorage
   b. App envia "NEW_HIGH_SCORE" (opcional)
   c. App permite envio ao ranking mundial
4. Se usuário enviar ao ranking:
   a. App obtém deviceId via expo-application
   b. App envia POST /ranking com score, nome, deviceId, espMac
   c. API salva no SQLite
   d. API retorna se é novo recorde mundial
```

---

## Persistência de Dados

### Local (AsyncStorage)

| Chave | Tipo | Descrição |
|-------|------|-----------|
| `@genius_high_score` | string (número) | Recorde pessoal |
| `@genius_player_name` | string | Último nome usado |

### Remoto (SQLite)

Todos os scores são armazenados na API para ranking global.

---

## Configurações e Variáveis de Ambiente

### App Mobile (.env)

```env
EXPO_PUBLIC_API_URL=http://192.168.0.100:3000
```

### API

```env
PORT=3000  # (opcional, default: 3000)
```

### Constantes BLE (bluetooth.ts)

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
