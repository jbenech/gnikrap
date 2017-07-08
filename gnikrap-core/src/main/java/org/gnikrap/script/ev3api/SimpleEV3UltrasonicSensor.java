/*
 * Gnikrap is a simple scripting environment for the Lego Mindstrom EV3
 * Copyright (C) 2014-2017 Jean BENECH
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

import org.gnikrap.utils.ScriptApi;

import lejos.hardware.port.Port;
import lejos.hardware.sensor.EV3UltrasonicSensor;
import lejos.robotics.SampleProvider;

/**
 * Provide experimental API for EV3 Ultrasonic sensor
 * <p/>
 * <strong>API NOT TESTED AS I DON'T HAVE A NXT SOUND SENSOR.
 */
public class SimpleEV3UltrasonicSensor implements EV3Device {

  private final EV3UltrasonicSensor delegate;
  private final SensorMonitor logger;
  // Distance mode
  private final SampleProvider distanceMode;
  private final float[] distanceSample;
  // Listen mode
  private final SampleProvider listenMode;
  private final float[] listenSample;

  public SimpleEV3UltrasonicSensor(Port port) {
    delegate = new EV3UltrasonicSensor(port);
    logger = SensorMonitorFactory.getLogger(port);
    // Distance mode
    distanceMode = delegate.getDistanceMode();
    distanceSample = new float[distanceMode.sampleSize()];
    // Listen (presence) mode
    listenMode = delegate.getListenMode();
    listenSample = new float[listenMode.sampleSize()];
  }

  @Override
  public void release() {
    delegate.disable();
    delegate.close();
  }

  /**
   * @return The distance detected in cm.
   */
  @ScriptApi(isIncubating = true, versionAdded = "0.5.0")
  public int getDistance() {
    distanceMode.fetchSample(distanceSample, 0);
    float result = distanceSample[0];
    logger.log(EV3Constants.ULTRASONIC_DISTANCE, result);
    return (int) (result * 100);
  }

  /**
   * @return True if another ultrasonic sensor is detected, false otherwise.
   */
  @ScriptApi(isIncubating = true, versionAdded = "0.5.0")
  public boolean isAnotherSensorDetected() {
    listenMode.fetchSample(listenSample, 0);
    float result = listenSample[0];
    logger.log(EV3Constants.ULTRASONIC_PRESENCE, result);
    return (result > 0.9999); // 1 in documentation, but always take in account epsilon while working with float
  }
}
