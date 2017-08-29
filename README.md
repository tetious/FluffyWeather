# Totally happy and ultra fluffy ESD safe weather tracker of doom.
Copyright (C) Greg Lincoln.  
Released under the FreeBSD License.  
Inspired by Nathan Seidle's WIMP. (https://github.com/sparkfun/Wimp_Weather_Station)

This comprises three parts: an arduino sketch to transmit readings via XBee, a node app to recieve them and an 
express app to display them in a somewhat responsive but not particularly nice looking UI thing.

The esp8266 directory has a tiny sketch to fill the XBee -> http gateway duties. After a few years of using a Pi + PiHat running xbee.js, I decided keeping the Pi going through power failures and SD corruption was annoying enough to replace it. ;)

I really will eventually post schematics and details of the bits here eventually.
