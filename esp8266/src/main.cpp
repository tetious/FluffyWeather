#include "Arduino.h"
#include "wifi_creds.h"
#include <ESP8266WiFi.h>
#include <ESP8266HTTPClient.h>

HTTPClient http;

void setup()
{
    Serial.begin(9600);
    Serial1.begin(9600);

    Serial1.print("Connecting to ");
    Serial1.println(ssid);
    
    WiFi.begin(ssid, password);
    
    while (WiFi.status() != WL_CONNECTED) {
      delay(500);
      Serial1.print(".");
    }
    Serial1.println("");
    Serial1.println("WiFi connected");  
    Serial1.println("IP address: ");
    Serial1.println(WiFi.localIP());
}

void loop() {
    if(Serial.available()) {
        auto line = Serial.readStringUntil('\n');
        Serial1.println(line);

        Serial1.print("Posting...");
        http.begin("http://192.168.0.4:3001/api/sensor");
        http.addHeader("Content-Type", "text/plain");
        http.POST(line);
        Serial1.println(http.getString());
        http.end();
        Serial1.println(" Complete!");
    }
}