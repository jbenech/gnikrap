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
import lejos.hardware.sensor.NXTSoundSensor;
import lejos.robotics.SampleProvider;

/**
 * Provide experimental API for NXT Sound sensor
 * <p/>
 * <strong>API NOT TESTED AS I DON'T HAVE A NXT SOUND SENSOR.
 */
public class SimpleNXTSoundSensor implements EV3Device {

  private final NXTSoundSensor delegate;
  private final SensorMonitor logger;
  // DBA mode
  private final SampleProvider dbaMode;
  private final float[] dbaSample;
  // DB mode
  private final SampleProvider dbMode;
  private final float[] dbSample;

  public SimpleNXTSoundSensor(Port port) {
    delegate = new NXTSoundSensor(port);
    logger = SensorMonitorFactory.getLogger(port);
    // DBA mode
    dbaMode = delegate.getDBAMode();
    dbaSample = new float[dbaMode.sampleSize()];
    // DB mode
    dbMode = delegate.getDBMode();
    dbSample = new float[dbMode.sampleSize()];
  }

  @Override
  public void release() {
    delegate.close();
  }

  /**
   * @return an integer between 0 and 100 (normalized value in the {@link NXTSoundSensor} documentation).
   */
  @ScriptApi(isIncubating = true, versionAdded = "0.5.0")
  public int getDBA() {
    dbaMode.fetchSample(dbaSample, 0);
    float result = dbaSample[0];
    logger.log(EV3Constants.SOUND_SENSOR_DBA, result);
    return (int) (result * 100);
  }

  /**
   * @return an integer between 0 and 100 (normalized value in the {@link NXTSoundSensor} documentation).
   */
  @ScriptApi(isIncubating = true, versionAdded = "0.5.0")
  public int getDB() {
    dbMode.fetchSample(dbSample, 0);
    float result = dbSample[0];
    logger.log(EV3Constants.SOUND_SENSOR_DB, result);
    return (int) (result * 100);
  }
}
