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
import lejos.hardware.sensor.EV3TouchSensor;
import lejos.hardware.sensor.SensorMode;

/**
 * Provide a simple API for the touch sensor.
 * <p/>
 * TODO: 2 mode in EV3 software (touch and pitch)
 */
final public class SimpleEV3TouchSensor implements EV3Device {

  private final EV3TouchSensor delegate;
  private final SensorMonitor logger;
  // Touch mode
  private final SensorMode touchMode;
  private final float[] touchSample;

  public SimpleEV3TouchSensor(Port port) {
    delegate = new EV3TouchSensor(port);
    logger = SensorMonitorFactory.getLogger(port);
    // Touch mode
    touchMode = delegate.getTouchMode();
    touchSample = new float[touchMode.sampleSize()];
  }

  @Override
  public void release() {
    delegate.close();
  }

  public boolean isPushed() {
    touchMode.fetchSample(touchSample, 0);
    float result = touchSample[0];
    logger.log(result);
    return (result > 0.99);
  }
}
