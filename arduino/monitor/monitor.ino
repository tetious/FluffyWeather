/*

Totally happy and ultra fluffy ESD safe weather tracker of doom.
Copyright (C) 2014 Greg Lincoln.
Released under the FreeBSD License.

Inspired by Nathan Seidle's WIMP. (https://github.com/sparkfun/Wimp_Weather_Station)
*/

#include <Wire.h>
#include <SoftwareSerial.h>
#include <HTU21D.h>
#include <SFE_BMP180.h>
#include <avr/wdt.h>

const byte AIO_WIND_DIRECTION = A0;

const byte DIO_RAIN = 2;
const byte DIO_WIND_SPEED = 3;

const byte DIO_XBEE_SLEEP = 10;
const byte DIO_XBEE_RX = 11;
const byte DIO_XBEE_TX = 12;

const byte LED = 13;

//

const float ALTITUDE = 254.8;
const byte V_OFFSET = 100;

const byte BOUNCE_DELAY_MS = 10;
const int UPDATE_RATE_MS = 1000;
const byte WIND_SPEED_SAMPLE_COUNT = 5;

volatile float rainInches = 0, windClicks = 0;
volatile int windDirection = 0;

//

SoftwareSerial xbeeSerial(DIO_XBEE_RX, DIO_XBEE_TX);
HTU21D htuSensor;
SFE_BMP180 bmpSensor;

// Arduino //

void setup()
{
  wdt_reset();

  pinMode(LED, OUTPUT); 
  sayHi();

  wdt_enable(WDTO_8S);

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

  if(!bmpSensor.begin()) {
    sendError(xbeeSerial, "Could not initialize BMP180.");
  }
}

void loop()
{
  wdt_reset();
  
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
    windClicks++;
    lastWindUpdate = now;
  }
}

// Functions //

void sendWeatherUpdate(Stream &out)
{
  out.print("[");
  out.print("ms=");
  out.print(millis());
  out.print("&ri=");
  out.print(getRainInches());
  out.print("&ws=");
  out.print(getWindSpeed());
  out.print("&wd=");
  out.print(getWindDirection());
  out.print("&t=");
  out.print(htuSensor.readTemperature());
  out.print("&p=");
  out.print(getPressure());
  out.print("&h=");
  out.print(htuSensor.readHumidity());
  out.print("&v=");
  out.print(getVcc());
  out.println("]");
}

void sendError(Stream &out, String error) 
{
  out.print("[e=");
  out.print(error);
  out.println("]");
}

int getWindDirection() 
{
  unsigned int adc = averageAnalogRead(AIO_WIND_DIRECTION); 

  if (adc <= 93) return 90;
  if (adc <= 186) return 135;
  if (adc <= 289) return 180;
  if (adc <= 465) return 45;
  if (adc <= 632) return 225;
  if (adc <= 789) return 0;
  if (adc <= 890) return 315;
  if (adc <= 947) return 270;

  return (-1);
}

float getRainInches()
{
  float rainTemp = rainInches;
  rainInches = 0;
  return rainTemp;
}

float getWindSpeed()
{
  static long lastWindFetch = 0;
  static float windSpeed = 0;

  long now = millis();
  long deltaTime = now - lastWindFetch;

  // The wind sensor has fairly low resolution, so we should not update as frequently to get nearer
  // to a valid instant wind speed.
  if(deltaTime > WIND_SPEED_SAMPLE_COUNT * UPDATE_RATE_MS)
  {
    windSpeed = windClicks / (deltaTime / 1000.0) * 1.492;

    lastWindFetch = now;
    windClicks = 0;
  }

  return windSpeed;
}

double getBmpSensorTemp()
{
  byte wait = bmpSensor.startTemperature();
  if(wait == 0) {
    return -1;
  }

  delay(wait);
  double temperature;
  wait = bmpSensor.getTemperature(temperature);
  if(wait == 0) {
    return -2;
  }

  return temperature;
}

double getPressure()
{
  byte wait = bmpSensor.startPressure(3);
  if(wait == 0) {
    return -10;
  }

  delay(wait);
  double pressure=0;
  double temp = getBmpSensorTemp();
  if(temp == 0) {
    return temp;
  }

  wait = bmpSensor.getPressure(pressure, temp);
  if(wait == 0) {
    return -20;
  }

  return bmpSensor.sealevel(pressure, ALTITUDE);
}

long getVcc() {
  // Read 1.1V reference against AVcc
  // set the reference to Vcc and the measurement to the internal 1.1V reference
  ADMUX = _BV(REFS0) | _BV(MUX3) | _BV(MUX2) | _BV(MUX1);

  delay(2); // Wait for Vref to settle
  ADCSRA |= _BV(ADSC); // Start conversion
  while (bit_is_set(ADCSRA,ADSC)); // measuring
 
  uint8_t low  = ADCL; // must read ADCL first - it then locks ADCH  
  uint8_t high = ADCH; // unlocks both
 
  long result = (high<<8) | low;
 
  result = 1125300L / result; // Calculate Vcc (in mV); 1125300 = 1.1*1023*1000
  return result + V_OFFSET; // Vcc in millivolts
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

void sayHi()
{
  digitalWrite(LED, HIGH);
  delay(100);
  digitalWrite(LED, LOW);
  delay(100);
  digitalWrite(LED, HIGH);
  delay(100);
  digitalWrite(LED, LOW);
  delay(100);
  digitalWrite(LED, HIGH);
  delay(100);
  digitalWrite(LED, LOW);
  delay(100);
  digitalWrite(LED, HIGH);
  delay(100);
  digitalWrite(LED, LOW);
  delay(100);
  digitalWrite(LED, HIGH);
  delay(100);
  digitalWrite(LED, LOW);
}