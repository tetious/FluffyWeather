/*

Totally happy and ultra fluffy ESD safe weather tracker of doom.
Copyright (C) 2014 Greg Lincoln.
Released under the FreeBSD License.

Inspired by Nathan Seidle's WIMP. (https://github.com/sparkfun/Wimp_Weather_Station)
*/

#include <Wire.h>
#include <SoftwareSerial.h>

const byte AIO_WIND_DIRECTION = A0;

const byte DIO_RAIN = 2;
const byte DIO_WIND_SPEED = 3;

const byte DIO_XBEE_SLEEP = 9;
const byte DIO_XBEE_RX = 10;
const byte DIO_XBEE_TX = 11;

//

const byte BOUNCE_DELAY_MS = 10;
const int UPDATE_RATE_MS = 1000;

volatile float rainInches = 0, windSpeed = 0;
volatile int windDirection = 0;

//

SoftwareSerial xbeeSerial(DIO_XBEE_RX, DIO_XBEE_TX);

// Arduino //

void setup()
{
  pinMode(DIO_RAIN, INPUT_PULLUP);  
  attachInterrupt(0, IRQ_rain, FALLING);  
  pinMode(DIO_WIND_SPEED, INPUT_PULLUP);
  attachInterrupt(1, IRQ_windSpeed, FALLING);

  pinMode(DIO_XBEE_SLEEP, OUTPUT);
  digitalWrite(DIO_XBEE_SLEEP, HIGH);

  pinMode(AIO_WIND_DIRECTION, INPUT);

  interrupts();

  xbeeSerial.begin(9600);
  Serial.begin(9600);
}

void loop()
{
  // send update
  long deltaStart = millis();

  // wake radio
  digitalWrite(DIO_XBEE_SLEEP, LOW);
  delay(100);

  // send message
  sendWeatherUpdate(xbeeSerial);
  // TODO: make sure we keep up with the clock

  // sleep radio
  digitalWrite(DIO_XBEE_SLEEP, HIGH);
  delay(UPDATE_RATE_MS - (millis() - deltaStart)); // wait the rest of the update rate if we need to
}

// Interrupts //

void IRQ_rain()
{
  static long lastRainUpdate = 0;
  long now = millis();
  if(now - lastRainUpdate > BOUNCE_DELAY_MS)
  {
    lastRainUpdate = now;
    rainInches += 0.011;
  }
}

void IRQ_windSpeed()
{
  static long lastWindUpdate = 0;
  long now = millis();
  if(now - lastWindUpdate > BOUNCE_DELAY_MS)
  {
    windSpeed = ((now - lastWindUpdate) / 1000.0) * 1.492;
    lastWindUpdate = now;
  }
}

// Functions //

void sendWeatherUpdate(Stream &out)
{
  out.print("[");
  out.print("ms=");
  out.print(millis());
  out.print("ri=");
  out.print(getRainInches());
  out.print("wd=");
  out.print(getWindDirection());
  out.println("]");
}

int getWindDirection() 
{
  unsigned int adc = averageAnalogRead(AIO_WIND_DIRECTION); 

  if (adc <= 94) return 90;
  if (adc <= 186) return 135;
  if (adc <= 288) return 180;
  if (adc <= 461) return 45;
  if (adc <= 628) return 225;
  if (adc <= 783) return 0;
  if (adc <= 884) return 315;
  if (adc <= 941) return 270;

  return (-1);
}

float getRainInches()
{
  float rainTemp = rainInches;
  rainInches = 0;
  return rainTemp;
}

int averageAnalogRead(int pinToRead)
{
  byte numberOfReadings = 8;
  unsigned int runningValue = 0; 

  for(int x = 0 ; x < numberOfReadings ; x++)
    runningValue += analogRead(pinToRead);
  runningValue /= numberOfReadings;

  return(runningValue);  
}