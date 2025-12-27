# Genius Game

Project developed for the **Introduction to IoT Development** course in the Mobile Device Programming Graduate Program at **UTFPR**, taught by professor **Ricardo Ogliari**.

## Description

A Genius (Simon) style game that combines IoT hardware with a mobile app. The player must repeat color and sound sequences that progressively increase in difficulty.

## Screenshoots

<p float="left">
  <img width="300" alt="Initial screen" src="https://github.com/user-attachments/assets/f989fa71-6b4d-40c1-ad09-059bc7d98cd9" />
  <img width="300" alt="Game Over Screen" src="https://github.com/user-attachments/assets/d656e600-a81d-49a3-87cd-67f78932930a" />
</p>


## Architecture

```
genius-game/
  app/
    mobile/     # React Native/Expo App
    api/        # Node + Express + SQLite API
  firmware/
    genius/     # ESP32 Code (Arduino IDE)
```

## Technologies

### Hardware
- **ESP32** - Microcontroller with Bluetooth Low Energy (BLE)
- **4 LEDs** - Red, green, blue, and yellow colors
- **Passive Buzzer** - Sound feedback for colors

### Mobile App
- **React Native** with **Expo** SDK 54
- **TypeScript** for static typing
- **Zustand** for state management
- **react-native-ble-plx** for BLE communication
- **expo-application** for device identification
- **@react-native-community/netinfo** for connectivity detection

### API
- **Node.js** with **Express**
- **TypeScript**
- **better-sqlite3** for data persistence
- World ranking system with scores

## Communication

The ESP32 and mobile app communicate via Bluetooth Low Energy (BLE):

- **Service UUID**: `6E400001-B5A3-F393-E0A9-E50E24DCCA9E`
- **TX Characteristic**: `6E400003-B5A3-F393-E0A9-E50E24DCCA9E` (ESP -> App)
- **RX Characteristic**: `6E400002-B5A3-F393-E0A9-E50E24DCCA9E` (App -> ESP)

### Commands
- `START` - Start game
- `RED`, `GREEN`, `BLUE`, `YELLOW` - Player inputs
- `HIGH_SCORE` - High score celebration

### ESP Events
- `GAME_START` - Game started
- `SHOW:<color>` - ESP showing color
- `YOUR_TURN` - Player's turn
- `LEVEL:<n>` - Current level
- `GAME_OVER:<score>` - Game over

## Setup

### 1. ESP32 Firmware

The firmware file is located at `firmware/genius/genius.ino`. Due to Arduino IDE requirements, the file must be in a folder with the same name.

1. Open the file in Arduino IDE
2. Set the board to ESP32 Dev Module
3. Upload to the ESP32

### 2. API

```bash
cd app/api
npm install
npm run dev
```

The API runs at `http://localhost:3000`

### 3. Mobile App

```bash
cd app/mobile
npm install
```

Configure the API URL by creating the `.env` file from the example:

```bash
cp .env.example .env
```

Edit the `.env` file with your machine's IP:

```
EXPO_PUBLIC_API_URL=http://YOUR_LOCAL_IP:3000
```

To find your IP: `ifconfig` (Mac/Linux) or `ipconfig` (Windows)

```bash
npm start
# or
npm run android
```

## API Endpoints

| Method | Route | Description |
|--------|-------|-------------|
| GET | /ranking | Returns world record |
| GET | /ranking/list | Returns score list |
| POST | /ranking | Submit score |

### POST /ranking

```json
{
  "score": 10,
  "playerName": "Name",
  "deviceId": "android_id",
  "espMac": "AA:BB:CC:DD:EE:FF"
}
```

## Features

- Genius game with progressive difficulty
- Personal record saved locally
- World ranking via API
- Online/offline connectivity detection
- Special celebration when breaking records
- Intuitive interface with visual and audio feedback
