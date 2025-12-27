# Genius Game

Projeto desenvolvido para a disciplina de **Introdução ao Desenvolvimento para IoT** do curso de Pós-Graduação em Programação para Dispositivos Móveis da **UTFPR**, ministrada pelo professor **Ricardo Ogliari**.

## Descrição

Jogo estilo Genius (Simon) que combina hardware IoT com aplicativo mobile. O jogador deve repetir sequências de cores e sons que vão aumentando progressivamente de dificuldade.

## Arquitetura

```
genius-game/
  app/
    mobile/     # App React Native/Expo
    api/        # API Node + Express + SQLite
  firmware/
    genius/     # Código do ESP32 (Arduino IDE)
```

## Tecnologias

### Hardware
- **ESP32** - Microcontrolador com Bluetooth Low Energy (BLE)
- **4 LEDs** - Cores vermelho, verde, azul e amarelo
- **Buzzer passivo** - Sons para feedback das cores

### App Mobile
- **React Native** com **Expo** SDK 54
- **TypeScript** para tipagem estática
- **Zustand** para gerenciamento de estado
- **react-native-ble-plx** para comunicação BLE
- **expo-application** para identificação do dispositivo
- **@react-native-community/netinfo** para detecção de conectividade

### API
- **Node.js** com **Express**
- **TypeScript**
- **better-sqlite3** para persistência de dados
- Sistema de ranking mundial com scores

## Comunicação

O ESP32 e o app mobile se comunicam via Bluetooth Low Energy (BLE):

- **Service UUID**: `6E400001-B5A3-F393-E0A9-E50E24DCCA9E`
- **TX Characteristic**: `6E400003-B5A3-F393-E0A9-E50E24DCCA9E` (ESP -> App)
- **RX Characteristic**: `6E400002-B5A3-F393-E0A9-E50E24DCCA9E` (App -> ESP)

### Comandos
- `START` - Inicia o jogo
- `RED`, `GREEN`, `BLUE`, `YELLOW` - Entradas do jogador
- `HIGH_SCORE` - Celebração de recorde

### Eventos do ESP
- `GAME_START` - Jogo iniciado
- `SHOW:<cor>` - ESP mostrando cor
- `YOUR_TURN` - Vez do jogador
- `LEVEL:<n>` - Nível atual
- `GAME_OVER:<score>` - Fim de jogo

## Setup

### 1. Firmware ESP32

O arquivo do firmware está em `firmware/genius/genius.ino`. Devido a requisitos do Arduino IDE, o arquivo deve estar em uma pasta com o mesmo nome.

1. Abra o arquivo na Arduino IDE
2. Configure a placa como ESP32 Dev Module
3. Faça upload para o ESP32

### 2. API

```bash
cd app/api
npm install
npm run dev
```

A API roda em `http://localhost:3000`

### 3. App Mobile

```bash
cd app/mobile
npm install
```

Configure a URL da API criando o arquivo `.env` a partir do exemplo:

```bash
cp .env.example .env
```

Edite o `.env` com o IP da sua máquina:

```
EXPO_PUBLIC_API_URL=http://SEU_IP_LOCAL:3000
```

Para descobrir seu IP: `ifconfig` (Mac/Linux) ou `ipconfig` (Windows)

```bash
npm start
# ou
npm run android
```

## Endpoints da API

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | /ranking | Retorna recorde mundial |
| GET | /ranking/list | Retorna lista de scores |
| POST | /ranking | Envia score |

### POST /ranking

```json
{
  "score": 10,
  "playerName": "Nome",
  "deviceId": "android_id",
  "espMac": "AA:BB:CC:DD:EE:FF"
}
```

## Funcionalidades

- Jogo Genius com dificuldade progressiva
- Recorde pessoal salvo localmente
- Ranking mundial via API
- Detecção de conectividade online/offline
- Celebração especial ao bater recorde
- Interface intuitiva com feedback visual e sonoro
