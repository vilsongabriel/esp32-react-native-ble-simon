#include <NimBLEDevice.h>

// Pinos dos LEDs
static const int LED_GREEN  = 18;
static const int LED_RED    = 19;
static const int LED_YELLOW = 21;
static const int LED_BLUE   = 22;

// Buzzer passivo
static const int BUZZER_PIN = 23;

// Notas musicais (Hz)
static const float NOTE_C4  = 261.63;
static const float NOTE_D4  = 293.66;
static const float NOTE_E4  = 329.63;
static const float NOTE_F4  = 349.23;
static const float NOTE_G4  = 392.00;
static const float NOTE_Ab4 = 415.30;
static const float NOTE_A4  = 440.00;
static const float NOTE_Bb4 = 466.16;
static const float NOTE_B4  = 493.88;
static const float NOTE_C5  = 523.25;
static const float NOTE_Cs5 = 554.37;
static const float NOTE_D5  = 587.33;
static const float NOTE_Ds5 = 622.25;
static const float NOTE_E5  = 659.25;
static const float NOTE_A5  = 880.00;
static const float NOTE_B5  = 987.77;

// Notas para cada LED do jogo
static const float NOTE_LED_GREEN  = NOTE_C4;
static const float NOTE_LED_RED    = NOTE_D4;
static const float NOTE_LED_YELLOW = NOTE_E4;
static const float NOTE_LED_BLUE   = NOTE_F4;

// Duracao do flash/buzz (ms)
static const int FLASH_DURATION = 400;

// Jogo Genius
static const int MAX_SEQUENCE = 100;
int gameSequence[MAX_SEQUENCE];
int gameLength = 0;
int playerIndex = 0;
bool gameActive = false;
bool waitingInput = false;

static const char* SERVICE_UUID = "6E400001-B5A3-F393-E0A9-E50E24DCCA9E";
static const char* RX_UUID = "6E400002-B5A3-F393-E0A9-E50E24DCCA9E";
static const char* TX_UUID = "6E400003-B5A3-F393-E0A9-E50E24DCCA9E";

NimBLEServer* pServer = nullptr;
NimBLECharacteristic* pTxChar = nullptr;
bool deviceConnected = false;

void sendEvent(const char* event) {
  if (pTxChar && deviceConnected) {
    pTxChar->setValue(event);
    pTxChar->notify();
    Serial.printf("TX: %s\n", event);
  }
}

void beep(float frequency, int duration) {
  tone(BUZZER_PIN, (int)frequency, duration);
  delay(duration);
  noTone(BUZZER_PIN);
}

void beepConnect() {
  beep(NOTE_A5, 100);
  delay(50);
  beep(NOTE_A5, 100);
}

void beepDisconnect() {
  beep(NOTE_A4, 200);
}

void beepBoot() {
  beep(NOTE_C5, 100);
}

void flashAllLeds(int times, int duration) {
  for (int i = 0; i < times; i++) {
    digitalWrite(LED_GREEN, HIGH);
    digitalWrite(LED_RED, HIGH);
    digitalWrite(LED_YELLOW, HIGH);
    digitalWrite(LED_BLUE, HIGH);
    delay(duration);
    digitalWrite(LED_GREEN, LOW);
    digitalWrite(LED_RED, LOW);
    digitalWrite(LED_YELLOW, LOW);
    digitalWrite(LED_BLUE, LOW);
    if (i < times - 1) {
      delay(duration);
    }
  }
}

void victorySound() {
  tone(BUZZER_PIN, NOTE_C5, 100);
  delay(100);
  tone(BUZZER_PIN, NOTE_E5, 100);
  delay(100);
  tone(BUZZER_PIN, NOTE_G4, 100);
  delay(100);
  tone(BUZZER_PIN, NOTE_C5, 300);
  delay(300);
  noTone(BUZZER_PIN);
}

void victoryTheme() {
  tone(BUZZER_PIN, NOTE_C5, 133);
  delay(133);
  tone(BUZZER_PIN, NOTE_C5, 133);
  delay(133);
  tone(BUZZER_PIN, NOTE_C5, 133);
  delay(133);
  tone(BUZZER_PIN, NOTE_C5, 400);
  delay(400);
  tone(BUZZER_PIN, NOTE_Ab4, 400);
  delay(400);
  tone(BUZZER_PIN, NOTE_Bb4, 400);
  delay(400);
  tone(BUZZER_PIN, NOTE_C5, 133);
  delay(133);
  delay(133);
  tone(BUZZER_PIN, NOTE_Bb4, 133);
  delay(133);
  tone(BUZZER_PIN, NOTE_C5, 1200);
  delay(1200);
  noTone(BUZZER_PIN);
}

void gameOverSound() {
  tone(BUZZER_PIN, NOTE_Ds5);
  delay(300);
  tone(BUZZER_PIN, NOTE_D5);
  delay(300);
  tone(BUZZER_PIN, NOTE_Cs5);
  delay(300);
  for (byte i = 0; i < 10; i++) {
    for (int pitch = -10; pitch <= 10; pitch++) {
      tone(BUZZER_PIN, (int)NOTE_C5 + pitch);
      delay(6);
    }
  }
  noTone(BUZZER_PIN);
}

void allLedsOff() {
  digitalWrite(LED_GREEN, LOW);
  digitalWrite(LED_RED, LOW);
  digitalWrite(LED_YELLOW, LOW);
  digitalWrite(LED_BLUE, LOW);
}

void flashLed(int index, int duration, bool sendShowEvent) {
  int pin;
  float freq;
  const char* color;

  switch(index) {
    case 0: pin = LED_GREEN;  freq = NOTE_LED_GREEN;  color = "G"; break;
    case 1: pin = LED_RED;    freq = NOTE_LED_RED;    color = "R"; break;
    case 2: pin = LED_YELLOW; freq = NOTE_LED_YELLOW; color = "Y"; break;
    case 3: pin = LED_BLUE;   freq = NOTE_LED_BLUE;   color = "B"; break;
    default: return;
  }

  if (sendShowEvent) {
    char event[10];
    sprintf(event, "SHOW:%s", color);
    sendEvent(event);
  }

  digitalWrite(pin, HIGH);
  tone(BUZZER_PIN, (int)freq);
  delay(duration);
  digitalWrite(pin, LOW);
  noTone(BUZZER_PIN);
  delay(100);
}

void playSequence() {
  sendEvent("PLAYING");
  delay(500);

  for (int i = 0; i < gameLength; i++) {
    flashLed(gameSequence[i], FLASH_DURATION, true);
  }

  playerIndex = 0;
  waitingInput = true;
  sendEvent("YOUR_TURN");
}

void resetGameState() {
  gameActive = false;
  waitingInput = false;
  gameLength = 0;
  playerIndex = 0;
  allLedsOff();
}

void startGame() {
  resetGameState();
  delay(100);
  gameActive = true;
  sendEvent("GAME_START");
  gameSequence[gameLength++] = esp_random() % 4;
  delay(1000);
  playSequence();
}

void nextLevel() {
  waitingInput = false;

  char event[20];
  sprintf(event, "LEVEL:%d", gameLength);
  sendEvent(event);

  delay(100);
  flashAllLeds(1, 200);
  victorySound();

  gameSequence[gameLength++] = esp_random() % 4;

  delay(500);
  playSequence();
}

void gameOver() {
  int score = gameLength - 1;
  resetGameState();

  char event[20];
  sprintf(event, "GAME_OVER:%d", score);

  Serial.printf("Sending: %s\n", event);
  sendEvent(event);

  delay(300);
  flashAllLeds(3, 150);
  delay(200);

  Serial.printf("Game Over! Score: %d\n", score);
  gameOverSound();
}

int colorToIndex(const char* color) {
  if (strcmp(color, "GREEN") == 0)  return 0;
  if (strcmp(color, "RED") == 0)    return 1;
  if (strcmp(color, "YELLOW") == 0) return 2;
  if (strcmp(color, "BLUE") == 0)   return 3;
  return -1;
}

void handlePlayerInput(int index) {
  if (!gameActive || !waitingInput) {
    Serial.println("Input ignorado - jogo nao ativo ou nao esperando input");
    return;
  }

  waitingInput = false;
  flashLed(index, FLASH_DURATION, false);

  if (gameSequence[playerIndex] == index) {
    playerIndex++;

    if (playerIndex >= gameLength) {
      nextLevel();
    } else {
      waitingInput = true;
    }
  } else {
    gameOver();
  }
}

void playHighScoreCelebration() {
  flashAllLeds(2, 100);
  delay(100);
  victoryTheme();
  flashAllLeds(3, 150);
}

class ServerCallbacks : public NimBLEServerCallbacks {
  void onConnect(NimBLEServer* server, NimBLEConnInfo& connInfo) {
    deviceConnected = true;
    resetGameState();
    Serial.println("Cliente conectado");
    beepConnect();
  }

  void onDisconnect(NimBLEServer* server, NimBLEConnInfo& connInfo, int reason) {
    deviceConnected = false;
    resetGameState();
    Serial.printf("Cliente desconectado (reason: %d)\n", reason);
    beepDisconnect();
    NimBLEDevice::startAdvertising();
  }
};

class RxCallbacks : public NimBLECharacteristicCallbacks {
  void onWrite(NimBLECharacteristic* c, NimBLEConnInfo& connInfo) {
    std::string v = c->getValue();
    Serial.printf("RX: %s\n", v.c_str());

    if (v == "START_GAME") {
      startGame();
      return;
    }

    if (v == "NEW_HIGH_SCORE") {
      playHighScoreCelebration();
      return;
    }

    if (v.rfind("INPUT_", 0) == 0) {
      std::string color = v.substr(6);
      int index = colorToIndex(color.c_str());
      if (index >= 0) {
        handlePlayerInput(index);
      }
      return;
    }
  }
};

void setup() {
  pinMode(LED_GREEN, OUTPUT);
  pinMode(LED_RED, OUTPUT);
  pinMode(LED_YELLOW, OUTPUT);
  pinMode(LED_BLUE, OUTPUT);
  pinMode(BUZZER_PIN, OUTPUT);

  allLedsOff();

  Serial.begin(115200);

  beepBoot();

  NimBLEDevice::init("ESP32-GENIUS");

  pServer = NimBLEDevice::createServer();
  pServer->setCallbacks(new ServerCallbacks());

  NimBLEService* service = pServer->createService(SERVICE_UUID);

  NimBLECharacteristic* rx = service->createCharacteristic(
    RX_UUID,
    NIMBLE_PROPERTY::WRITE | NIMBLE_PROPERTY::WRITE_NR
  );
  rx->setCallbacks(new RxCallbacks());

  pTxChar = service->createCharacteristic(
    TX_UUID,
    NIMBLE_PROPERTY::READ | NIMBLE_PROPERTY::NOTIFY
  );
  pTxChar->setValue("0000");

  service->start();

  NimBLEAdvertising* adv = NimBLEDevice::getAdvertising();
  adv->addServiceUUID(SERVICE_UUID);
  adv->start();

  Serial.println("Advertising as ESP32-GENIUS");
}

void loop() {
  delay(100);
}
