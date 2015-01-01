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

import lejos.hardware.port.Port;
import lejos.hardware.sensor.EV3ColorSensor;
import lejos.hardware.sensor.SensorMode;
import lejos.robotics.Color;

final public class SimpleEV3ColorSensor implements EV3Device {

  private final EV3ColorSensor delegate;
  private final SensorMonitor logger;
  // Reflected light mode
  private final SensorMode reflectedLightMode;
  private final float[] reflectedLightSample;
  // Ambient light mode
  private final SensorMode ambientLightMode;
  private final float[] ambientLightSample;
  // Color mode
  private final SensorMode colorMode;
  private final float[] colorModeSample;

  public SimpleEV3ColorSensor(Port port) {
    delegate = new EV3ColorSensor(port);
    logger = SensorMonitorFactory.getLogger(port);
    // Reflected light mode
    reflectedLightMode = delegate.getRedMode();
    reflectedLightSample = new float[reflectedLightMode.sampleSize()];
    // Ambient light mode
    ambientLightMode = delegate.getAmbientMode();
    ambientLightSample = new float[ambientLightMode.sampleSize()];
    // Color mode
    colorMode = delegate.getColorIDMode();
    colorModeSample = new float[colorMode.sampleSize()];
  }

  @Override
  public void release() {
    delegate.close();
  }

  /**
   * TODO: Confirm the value range
   * 
   * @return A value between 0 and 100.
   */
  public int getReflectedLight() {
    reflectedLightMode.fetchSample(reflectedLightSample, 0);
    float result = reflectedLightSample[0];
    logger.log(EV3Constants.COLOR_SENSOR_REFLECTED_LIGHT, result);
    return (int) (result * 100);
  }

  /**
   * TODO: Confirm the value range
   * 
   * @return A value between 0 and 100.
   */
  public int getAmbientLight() {
    ambientLightMode.fetchSample(ambientLightSample, 0);
    float result = ambientLightSample[0];
    logger.log(EV3Constants.COLOR_SENSOR_AMBIENT_LIGHT, result);
    return (int) (result * 100);
  }

  /**
   * Note: Color code are not the same as within the LEGO MINDSTORM software.
   */
  public ColorResult getColor() {
    colorMode.fetchSample(colorModeSample, 0);
    int temp = (int) colorModeSample[0];
    logger.log(EV3Constants.COLOR_SENSOR_COLOR, temp);
    return new ColorResult(temp);
  }

  public final static class ColorResult {
    private final int value;

    public ColorResult(int value) {
      this.value = value;
    }

    public int getValue() {
      return value;
    }

    public boolean isNoColor() {
      return value == Color.NONE;
    }

    public boolean isBlack() {
      return value == Color.BLACK;
    }

    public boolean isBlue() {
      return value == Color.BLUE;
    }

    public boolean isGreen() {
      return value == Color.GREEN;
    }

    public boolean isYellow() {
      return value == Color.YELLOW;
    }

    public boolean isRed() {
      return value == Color.RED;
    }

    public boolean isWhite() {
      return value == Color.WHITE;
    }

    public boolean isBrown() {
      return value == Color.BROWN;
    }

    public String getColorAsText() {
      if (isBlack())
        return "Black";
      if (isBlue())
        return "Blue";
      if (isBrown())
        return "Brown";
      if (isGreen())
        return "Green";
      if (isRed())
        return "Red";
      if (isWhite())
        return "White";
      if (isYellow())
        return "Yellow";
      return "NoColor";
    }

    @Override
    public String toString() {
      return "Color[" + getValue() + " - " + getColorAsText() + "]";
    }
  }
}
