// Configuration
#define DEVICE_ID "ESP32_001"  // Change this for each device
#define NUM_GPIOS 16

// GPIO pins to monitor (as specified)
const int gpioPins[NUM_GPIOS] = {
  15, 2, 4, 16, 17, 5, 18, 19, 21, 13, 12, 14, 27, 26, 25, 33
};

#include <BLEDevice.h>
#include <BLEServer.h>
#include <BLEUtils.h>
#include <BLE2902.h>
#include <ArduinoJson.h>
#include <Preferences.h>

BLEServer* pServer = NULL;
BLECharacteristic* pCharacteristic = NULL;
bool deviceConnected = false;
bool oldDeviceConnected = false;
unsigned long lastKeepAlive = 0;
bool firstConnect = true;
bool isClientAuthorized = false;
String deviceUUID = "";
Preferences preferences;

// GPIO state tracking
int currentGPIOStates[NUM_GPIOS];
int previousGPIOStates[NUM_GPIOS];
bool hasChanges = false;

#define SERVICE_UUID        "4fafc201-1fb5-459e-8fcc-c5c9c331914b"
#define CHARACTERISTIC_UUID "beb5483e-36e1-4688-b7f5-ea07361b26a8"

class MyServerCallbacks: public BLEServerCallbacks {
    void onConnect(BLEServer* pServer) {
      deviceConnected = true;
      firstConnect = true;
      isClientAuthorized = false; // Reset authorization
      Serial.println("Device connected - waiting for authorization");
    };

    void onDisconnect(BLEServer* pServer) {
      deviceConnected = false;
      isClientAuthorized = false;
      Serial.println("Device disconnected");
      // Restart advertising to allow reconnection
      delay(500); // Wait a bit before restarting
      pServer->startAdvertising();
      Serial.println("Restarted advertising for reconnection");
    }
};

class MyCharacteristicCallbacks: public BLECharacteristicCallbacks {
    void onWrite(BLECharacteristic* pCharacteristic) {
      String value = pCharacteristic->getValue();
      if (value.length() > 0) {
        Serial.println("Received: " + value);
        
        // Parse the received JSON for pairing/authorization
        StaticJsonDocument<256> doc;
        DeserializationError error = deserializeJson(doc, value);
        
        if (!error) {
          if (doc.containsKey("client_uuid") && doc.containsKey("action")) {
            String action = doc["action"];
            String clientUUID = doc["client_uuid"];
            
            if (action == "pair") {
              // Store the client UUID and authorize
              deviceUUID = clientUUID;
              preferences.putString("client_uuid", clientUUID);
              isClientAuthorized = true;
              
              // Send pairing confirmation
              StaticJsonDocument<256> response;
              response["action"] = "pair_confirm";
              response["device_uuid"] = BLEDevice::getAddress().toString();
              response["device_id"] = DEVICE_ID;
              response["status"] = "paired";
              
              String responseStr;
              serializeJson(response, responseStr);
              pCharacteristic->setValue(responseStr.c_str());
              pCharacteristic->notify();
              
              Serial.println("Device paired with UUID: " + clientUUID);
            }
            else if (action == "connect") {
              // Check if this client is already paired
              String storedUUID = preferences.getString("client_uuid", "");
              if (storedUUID == clientUUID || storedUUID == "") {
                deviceUUID = clientUUID;
                isClientAuthorized = true;
                Serial.println("Client authorized: " + clientUUID);
              } else {
                Serial.println("Unauthorized client: " + clientUUID);
              }
            }
          }
        }
      }
    }
};

void setup() {
  // Initialize the Serial communication for debugging
  Serial.begin(115200);
  
  // Initialize preferences for UUID storage
  preferences.begin("streamdeck", false);
  
  // Set GPIO pins as inputs
  for (int i = 0; i < NUM_GPIOS; i++) {
    if (gpioPins[i] == 15) {
      // D15 is rotary encoder - set as analog input
      pinMode(gpioPins[i], INPUT);
      Serial.println("D15 configured as rotary encoder (analog input)");
    } else {
      pinMode(gpioPins[i], INPUT);
    }
    // Initialize GPIO state arrays
    previousGPIOStates[i] = -1; // Force initial send
    currentGPIOStates[i] = 0;
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
  pCharacteristic->setCallbacks(new MyCharacteristicCallbacks());
  
  pService->start();
  
  BLEAdvertising *pAdvertising = BLEDevice::getAdvertising();
  pAdvertising->addServiceUUID(SERVICE_UUID);
  pAdvertising->setScanResponse(true);
  pAdvertising->setMinPreferred(0x06);
  pAdvertising->setMinPreferred(0x12);
  BLEDevice::startAdvertising();
  
  Serial.println("BLE device is ready to pair");
  Serial.println("Device name: ESP32_Streamdeck_" + String(DEVICE_ID));
  Serial.println("Waiting for client connection and pairing...");
}

void readGPIOStates() {
  hasChanges = false;
  
  for (int i = 0; i < NUM_GPIOS; i++) {
    // Read current state
    if (gpioPins[i] == 15) { // D15 is rotary encoder (analog)
      currentGPIOStates[i] = analogRead(gpioPins[i]);
      // For rotary encoder, only consider changes > 100 units as significant
      if (abs(currentGPIOStates[i] - previousGPIOStates[i]) > 100) {
        hasChanges = true;
      }
    } else if (gpioPins[i] >= 32 && gpioPins[i] <= 39) { // Other ADC pins
      currentGPIOStates[i] = analogRead(gpioPins[i]);
      // For other analog pins, consider significant change (more than 10 units difference)
      if (abs(currentGPIOStates[i] - previousGPIOStates[i]) > 10) {
        hasChanges = true;
      }
    } else {
      currentGPIOStates[i] = digitalRead(gpioPins[i]);
      // For digital, any change is significant
      if (currentGPIOStates[i] != previousGPIOStates[i]) {
        hasChanges = true;
      }
    }
  }
}

void updatePreviousStates() {
  for (int i = 0; i < NUM_GPIOS; i++) {
    previousGPIOStates[i] = currentGPIOStates[i];
  }
}

void sendGPIOData(bool isVerify = false, bool isKeepAlive = false, bool forceData = false) {
  if (!deviceConnected || !isClientAuthorized) return;
  
  StaticJsonDocument<1024> doc;
  doc["device_id"] = DEVICE_ID;
  doc["device_uuid"] = BLEDevice::getAddress().toString();
  doc["client_uuid"] = deviceUUID;
  doc["timestamp"] = millis();
  
  // Always include GPIO data in the format expected by Python scanner
  JsonArray gpio_states = doc.createNestedArray("gpio_states");
  for (int i = 0; i < NUM_GPIOS; i++) {
    gpio_states.add(currentGPIOStates[i]);
  }
  
  // Add metadata
  if (isVerify) {
    doc["type"] = "verify";
  } else if (isKeepAlive) {
    doc["type"] = "keep_alive";
  } else {
    doc["type"] = "update";
  }
  
  String jsonString;
  serializeJson(doc, jsonString);
  
  pCharacteristic->setValue(jsonString.c_str());
  pCharacteristic->notify();
  
  // Logging
  if (isVerify) {
    Serial.println("VERIFY - Sent GPIO data with D15: " + String(currentGPIOStates[0]));
  } else if (isKeepAlive && !hasChanges) {
    Serial.println("KEEP_ALIVE - Device: " + String(DEVICE_ID) + " (no changes)");
  } else if (hasChanges) {
    Serial.println("CHANGE - Device: " + String(DEVICE_ID) + " | D15: " + String(currentGPIOStates[0]));
    // Update previous states after sending changes
    updatePreviousStates();
  }
}

void loop() {
  // Handle disconnection and restart advertising if needed
  if (!deviceConnected && oldDeviceConnected) {
    delay(500); // Give time for the disconnection to process
    pServer->startAdvertising(); // Restart advertising
    Serial.println("Disconnected - restarting advertising");
    oldDeviceConnected = deviceConnected;
  }
  
  // Handle new connection
  if (deviceConnected && !oldDeviceConnected) {
    Serial.println("New device connected - waiting for authorization");
    oldDeviceConnected = deviceConnected;
  }

  // Only process GPIO if device is connected AND authorized
  if (deviceConnected && isClientAuthorized) {
    // Read all GPIO states and check for changes
    readGPIOStates();
    
    // Send verification on first connect (with full data)
    if (firstConnect) {
      sendGPIOData(true, false, true); // verify = true, forceData = true
      firstConnect = false;
      updatePreviousStates(); // Update after first send
      Serial.println("Initial GPIO state sent with D15: " + String(currentGPIOStates[0]));
      delay(100);
    }
    
    // Send keep-alive every 10 seconds (includes current data)
    else if (millis() - lastKeepAlive > 10000) {
      sendGPIOData(false, true); // keep_alive = true
      lastKeepAlive = millis();
    }
    
    // Send immediate change data (not keep-alive)
    else if (hasChanges) {
      sendGPIOData(false, false); // Regular data with changes
    }
  } else if (deviceConnected && !isClientAuthorized) {
    // Device connected but not authorized - just wait
    delay(100);
  } else {
    // No device connected - reduce checking frequency to save power
    delay(1000);
  }
  
  // When authorized and connected, check more frequently for responsive GPIO
  if (deviceConnected && isClientAuthorized) {
    delay(50); // Check for changes every 50ms when active
  }
}