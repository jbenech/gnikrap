/*
 * Gnikrap is a simple scripting environment for the Lego Mindstrom EV3
 * Copyright (C) 2014 Jean BENECH
 * 
 * Gnikrap is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 * 
 * Gnikrap is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU General Public License
 * along with Gnikrap.  If not, see <http://www.gnu.org/licenses/>.
 */
package org.gnikrap.script.ev3api;

import lejos.hardware.Button;

/**
 * Provide access to the EV3 led (behind the keyboard).
 */
final public class SimpleEV3Led {

  final int BUTTON_LED_OFF = 0;
  final int BUTTON_LED_GREEN = 1;
  final int BUTTON_LED_RED = 2;
  final int BUTTON_LED_ORANGE = 3;
  // final int BUTTON_LED_GREEN_BLINK = 4;
  // final int BUTTON_LED_RED_BLINK = 5;
  // final int BUTTON_LED_ORANGE_BLINK = 5;
  // final int BUTTON_LED_GREEN_BLINK2 = 7;
  // final int BUTTON_LED_RED_BLINK2 = 8;
  // final int BUTTON_LED_ORANGE_BLINK2 = 9;
  // final int BUTTON_LED_UNK = 10;

  private int color;
  private int blink;

  private void doLight() {
    int temp;
    if (color == BUTTON_LED_OFF) {
      temp = color;
    } else {
      temp = color + 3 * blink;
    }
    Button.LEDPattern(temp);
  }

  public void off() {
    color = BUTTON_LED_OFF;
    doLight();
  }

  public SimpleEV3Led green() {
    color = BUTTON_LED_GREEN;
    blink = 0;
    doLight();
    return this;
  }

  public SimpleEV3Led red() {
    color = BUTTON_LED_RED;
    blink = 0;
    doLight();
    return this;
  }

  public SimpleEV3Led orange() {
    color = BUTTON_LED_ORANGE;
    blink = 0;
    doLight();
    return this;
  }

  /**
   * 2 blink mode available, call {@link #blink()} twice to enable the 2nd mode.
   */
  public SimpleEV3Led blink() {
    blink = (blink + 1) % 3;
    doLight();
    return this;
  }
}