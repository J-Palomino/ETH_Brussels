#include <Arduino.h>
#include <BLEDevice.h>
#include <BLEUtils.h>
#include <BLEServer.h>
#include "esp_camera.h"
#include "base64.h"
#include <algorithm>
#include <BLE2902.h>

// Pin definition for CAMERA_MODEL_AI_THINKER
#define PWDN_GPIO_NUM     -1
#define RESET_GPIO_NUM    -1
#define XCLK_GPIO_NUM      21
#define SIOD_GPIO_NUM     26
#define SIOC_GPIO_NUM     27
#define Y9_GPIO_NUM       35
#define Y8_GPIO_NUM       34
#define Y7_GPIO_NUM       39
#define Y6_GPIO_NUM       36
#define Y5_GPIO_NUM       19
#define Y4_GPIO_NUM       18
#define Y3_GPIO_NUM        5
#define Y2_GPIO_NUM        4
#define VSYNC_GPIO_NUM    25
#define HREF_GPIO_NUM     23
#define PCLK_GPIO_NUM     22

#define SERVICE_UUID          "12345678-1234-1234-1234-123456789012"
#define PHOTO_CHARACTERISTIC_UUID "87654321-4321-4321-4321-210987654321"
#define COMMAND_CHARACTERISTIC_UUID "87654321-4321-4321-4321-210987654322"
#define CHUNK_SIZE 500

BLECharacteristic *pPhotoCharacteristic;
BLECharacteristic *pCommandCharacteristic;
bool deviceConnected = false;

// Custom min function
size_t custom_min(size_t a, size_t b) {
    return (a < b) ? a : b;
}

// Function to handle photo capture
String capturePhoto() {
  camera_fb_t * fb = NULL;
  fb = esp_camera_fb_get();
  if (!fb) {
    Serial.println("Camera capture failed");
    return "";
  }

  String base64_image = base64::encode((const uint8_t*)fb->buf, fb->len);
  esp_camera_fb_return(fb);

  Serial.println("Photo captured and converted to base64:");
  Serial.println(base64_image.substring(0, 100));  // Print first 100 chars for debugging
  
  return base64_image;
}

class MyServerCallbacks: public BLEServerCallbacks {
    void onConnect(BLEServer* pServer) {
      deviceConnected = true;
      Serial.println("Client connected");
    };

    void onDisconnect(BLEServer* pServer) {
      deviceConnected = false;
      Serial.println("Client disconnected");
    }
};

class MyPhotoCallbacks: public BLECharacteristicCallbacks {
    void onRead(BLECharacteristic *pCharacteristic) {
      String image = capturePhoto();
      
      size_t length = image.length();
      size_t offset = 0;
      
      while (offset < length) {
        size_t chunkSize = custom_min(static_cast<size_t>(CHUNK_SIZE), length - offset);
        String chunk = image.substring(offset, offset + chunkSize);
        pCharacteristic->setValue((uint8_t*)chunk.c_str(), chunkSize);
        pCharacteristic->notify();
        offset += chunkSize;
        delay(50);  // Add a small delay to ensure BLE stack can handle the chunks
      }
      
      Serial.println("BLE characteristic value set");
    }
};

class MyCommandCallbacks: public BLECharacteristicCallbacks {
    void onWrite(BLECharacteristic *pCharacteristic) {
      String command = pCharacteristic->getValue().c_str();
      if (command == "TAKE_PHOTO") {
        Serial.println("Take photo command received");
        String image = capturePhoto();
        
        size_t length = image.length();
        size_t offset = 0;
        
        while (offset < length) {
          size_t chunkSize = custom_min(static_cast<size_t>(CHUNK_SIZE), length - offset);
          String chunk = image.substring(offset, offset + chunkSize);
          pPhotoCharacteristic->setValue((uint8_t*)chunk.c_str(), chunkSize);
          pPhotoCharacteristic->notify();
          offset += chunkSize;
          delay(50);  // Add a small delay to ensure BLE stack can handle the chunks
        }
        
        Serial.println("Photo sent after command");
      }
    }
};

void setup() {
  Serial.begin(115200);

  // Initialize PSRAM
  if (!psramInit()) {
    Serial.println("PSRAM initialization failed!");
    while (1);
  } else {
    Serial.println("PSRAM initialized successfully.");
  }

  // Print free heap size before camera init
  Serial.printf("Free heap before camera init: %d\n", esp_get_free_heap_size());

  // Camera configuration
  camera_config_t config;
  config.ledc_channel = LEDC_CHANNEL_0;
  config.ledc_timer = LEDC_TIMER_0;
  config.pin_d0 = Y2_GPIO_NUM;
  config.pin_d1 = Y3_GPIO_NUM;
  config.pin_d2 = Y4_GPIO_NUM;
  config.pin_d3 = Y5_GPIO_NUM;
  config.pin_d4 = Y6_GPIO_NUM;
  config.pin_d5 = Y7_GPIO_NUM;
  config.pin_d6 = Y8_GPIO_NUM;
  config.pin_d7 = Y9_GPIO_NUM;
  config.pin_xclk = XCLK_GPIO_NUM;
  config.pin_pclk = PCLK_GPIO_NUM;
  config.pin_vsync = VSYNC_GPIO_NUM;
  config.pin_href = HREF_GPIO_NUM;
  config.pin_sccb_sda = SIOD_GPIO_NUM;
  config.pin_sccb_scl = SIOC_GPIO_NUM;
  config.pin_pwdn = PWDN_GPIO_NUM;
  config.pin_reset = RESET_GPIO_NUM;
  config.xclk_freq_hz = 20000000;
  config.pixel_format = PIXFORMAT_JPEG;  
  config.frame_size = FRAMESIZE_QQVGA;
  config.jpeg_quality = 15;
  config.fb_location = CAMERA_FB_IN_PSRAM;
  config.fb_count = 1;

  // Camera init
  esp_err_t err = esp_camera_init(&config);
  if (err != ESP_OK) {
    Serial.printf("Camera init failed with error 0x%x", err);
    return;
  }

  // Print free heap size after camera init
  Serial.printf("Free heap after camera init: %d\n", esp_get_free_heap_size());

  // Initialize BLE
  BLEDevice::init("NounsGlasses");
  BLEServer *pServer = BLEDevice::createServer();
  pServer->setCallbacks(new MyServerCallbacks());

  BLEService *pService = pServer->createService(SERVICE_UUID);

  pPhotoCharacteristic = pService->createCharacteristic(
                          PHOTO_CHARACTERISTIC_UUID,
                          BLECharacteristic::PROPERTY_READ |
                          BLECharacteristic::PROPERTY_NOTIFY
                        );
  pPhotoCharacteristic->addDescriptor(new BLE2902());
  pPhotoCharacteristic->setCallbacks(new MyPhotoCallbacks());

  pCommandCharacteristic = pService->createCharacteristic(
                            COMMAND_CHARACTERISTIC_UUID,
                            BLECharacteristic::PROPERTY_WRITE
                          );
  pCommandCharacteristic->setCallbacks(new MyCommandCallbacks());

  pService->start();

  BLEAdvertising *pAdvertising = BLEDevice::getAdvertising();
  pAdvertising->addServiceUUID(SERVICE_UUID);
  pAdvertising->setScanResponse(true);
  pAdvertising->setMinPreferred(0x06);
  pAdvertising->setMinPreferred(0x12);
  BLEDevice::startAdvertising();
  Serial.println("Waiting for a client connection to notify...");
}

void loop() {
  // Do nothing here
}
