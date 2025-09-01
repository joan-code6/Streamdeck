// Configuration
#define DEVICE_ID "ESP32_001"  // Change this for each device
#define NUM_GPIOS 24
const int gpioPins[NUM_GPIOS] = {0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 21, 22, 23, 25}; // GPIO pins to monitor

#include <BLEDevice.h>
#include <BLEServer.h>
#include <BLEUtils.h>
#include <BLE2902.h>
#include <ArduinoJson.h>

BLEServer* pServer = NULL;
BLECharacteristic* pCharacteristic = NULL;
bool deviceConnected = false;
bool oldDeviceConnected = false;
unsigned long lastKeepAlive = 0;
bool firstConnect = true;

#define SERVICE_UUID        "4fafc201-1fb5-459e-8fcc-c5c9c331914b"
#define CHARACTERISTIC_UUID "beb5483e-36e1-4688-b7f5-ea07361b26a8"

class MyServerCallbacks: public BLEServerCallbacks {
    void onConnect(BLEServer* pServer) {
      deviceConnected = true;
      firstConnect = true;
      Serial.println("Device connected");
    };

    void onDisconnect(BLEServer* pServer) {
      deviceConnected = false;
      Serial.println("Device disconnected");
    }
};

void setup() {
  // Initialize the Serial communication for debugging
  Serial.begin(115200);
  
  // Set GPIO pins as inputs
  for(int i = 0; i < NUM_GPIOS; i++) {
    pinMode(gpioPins[i], INPUT);
  }
  
  // Initialize BLE
  BLEDevice::init("ESP32_Streamdeck_" + String(DEVICE_ID));
  pServer = BLEDevice::createServer();
  pServer->setCallbacks(new MyServerCallbacks());
  
  BLEService *pService = pServer->createService(SERVICE_UUID);
  
  pCharacteristic = pService->createCharacteristic(
                      CHARACTERISTIC_UUID,
                      BLECharacteristic::PROPERTY_READ |
                      BLECharacteristic::PROPERTY_WRITE |
                      BLECharacteristic::PROPERTY_NOTIFY |
                      BLECharacteristic::PROPERTY_INDICATE
                    );
  
  pCharacteristic->addDescriptor(new BLE2902());
  
  pService->start();
  
  BLEAdvertising *pAdvertising = BLEDevice::getAdvertising();
  pAdvertising->addServiceUUID(SERVICE_UUID);
  pAdvertising->setScanResponse(true);
  pAdvertising->setMinPreferred(0x06);
  pAdvertising->setMinPreferred(0x12);
  BLEDevice::startAdvertising();
  
  Serial.println("BLE device is ready to pair");
}

void sendGPIOData(bool isVerify = false, bool isKeepAlive = false) {
  if (!deviceConnected) return;
  
  StaticJsonDocument<1024> doc;
  doc["device_id"] = DEVICE_ID;
  doc["timestamp"] = millis();
  doc["verify"] = isVerify;
  doc["keep_alive"] = isKeepAlive;
  
  JsonArray gpios = doc.createNestedArray("gpios");
  for(int i = 0; i < NUM_GPIOS; i++) {
    int value = digitalRead(gpioPins[i]);
    // For analog pins, use analogRead instead
    if(gpioPins[i] >= 32 && gpioPins[i] <= 39) { // ADC pins
      value = analogRead(gpioPins[i]);
    }
    gpios.add(value);
  }
  
  String jsonString;
  serializeJson(doc, jsonString);
  
  pCharacteristic->setValue(jsonString.c_str());
  pCharacteristic->notify();
  
  Serial.println("Sent GPIO data: " + jsonString);
}

void loop() {
  // Send verification on first connect
  if (deviceConnected && firstConnect) {
    sendGPIOData(true, false); // verify = true
    firstConnect = false;
    delay(100);
  }
  
  // Send keep-alive every 5 seconds
  if (deviceConnected && millis() - lastKeepAlive > 5000) {
    sendGPIOData(false, true); // keep_alive = true
    lastKeepAlive = millis();
  }
  
  // Send GPIO data every 100ms
  if (deviceConnected) {
    sendGPIOData();
  }
  
  delay(100);
}