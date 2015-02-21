/*
 * Gnikrap is a simple scripting environment for the Lego Mindstrom EV3
 * Copyright (C) 2014-2015 Jean BENECH
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
import lejos.hardware.sensor.EV3IRSensor;
import lejos.hardware.sensor.SensorMode;

import org.gnikrap.utils.MapBuilder;
import org.gnikrap.utils.ScriptApi;

/**
 * Note: Switching from one mode to another have delay (250ms in 0.6.0 implementation)
 */
final public class SimpleEV3IRSensor implements EV3Device {

  private final EV3IRSensor delegate;
  private final SensorMonitor logger;
  private int channel = 0;
  // Distance mode
  private final SensorMode distanceMode;
  private final float[] distanceSample;
  // Seek mode
  private final SensorMode seekMode;
  private final float[] seekSample;

  public SimpleEV3IRSensor(Port port) throws EV3ScriptException {
    delegate = new EV3IRSensor(port);
    logger = SensorMonitorFactory.getLogger(port);
    setChannel(1); // Set default channel
    // Distance mode
    distanceMode = delegate.getDistanceMode();
    distanceSample = new float[distanceMode.sampleSize()];
    // Seek mode
    seekMode = delegate.getSeekMode();
    seekSample = new float[seekMode.sampleSize()];
  }

  @Override
  public void release() {
    delegate.close();
  }

  @ScriptApi
  public int getChannel() {
    return channel;
  }

  /**
   * @param channel from 1 to 4 (like on the beacon)
   * @throws EV3ScriptException
   */
  @ScriptApi
  public void setChannel(int channel) throws EV3ScriptException {
    checkChannel(channel);
    this.channel = channel;
  }

  @ScriptApi
  public RemoteCommandResult getRemoteCommand() {
    int temp = delegate.getRemoteCommand(channel - 1); // channel 0-based
    logger.log(EV3Constants.IR_SENSOR_REMOTE, temp);
    return new RemoteCommandResult(temp);
  }

  @ScriptApi
  public float getDistance() {
    distanceMode.fetchSample(distanceSample, 0);
    float result = distanceSample[0];
    logger.log(EV3Constants.IR_SENSOR_DISTANCE, result);
    return result;
  }

  @ScriptApi
  public SeekBeaconResult seekBeacon() {
    seekMode.fetchSample(seekSample, 0);
    // TODO: Something to log ?!
    return new SeekBeaconResult(seekSample, channel);
  }

  protected static void checkChannel(int channel) throws EV3ScriptException {
    if (channel < 1 || channel > 4) {
      throw new EV3ScriptException(EV3ScriptException.INVALID_CHANNEL_VALUE, MapBuilder.buildHashMap("channel", Integer.toString(channel)).build());
    }
  }

  /**
   * Helper class to easy process the remote command buttons status
   */
  public static final class RemoteCommandResult {
    private final int value;

    RemoteCommandResult(int value) {
      this.value = value;
    }

    @ScriptApi
    public int getValue() {
      return value;
    }

    @ScriptApi
    public boolean isTopLeftEnabled() {
      return value == 1 || value == 5 || value == 6 || value == 10;
    }

    @ScriptApi
    public boolean isTopRightEnabled() {
      return value == 3 || value == 5 || value == 7 || value == 11;
    }

    @ScriptApi
    public boolean isBottomLeftEnabled() {
      return value == 2 || value == 7 || value == 8 || value == 10;
    }

    @ScriptApi
    public boolean isBottomRightEnabled() {
      return value == 4 || value == 6 || value == 8 || value == 11;
    }

    @ScriptApi
    public boolean isBeaconEnabled() {
      return value == 9;
    }

    public boolean isNothingEnabled() {
      return value == 0;
    }

    @Override
    public String toString() {
      return "{value: " + getValue() + //
          ", isTopLeftEnabled: " + isTopLeftEnabled() + //
          ", isTopRightEnabled: " + isTopRightEnabled() + //
          ", isBottomLeftEnabled: " + isBottomLeftEnabled() + //
          ", isBottomRightEnabled: " + isBottomRightEnabled() + //
          ", isBeaconEnabled: " + isBeaconEnabled() + "}";
    }
  }

  public static final class SeekBeaconResult {
    private final float[] data;
    private final int defaultChannel;

    SeekBeaconResult(float[] values, int defaultChannel) {
      this.defaultChannel = defaultChannel;
      int length = values.length; // Should always be 8
      data = new float[length];
      System.arraycopy(values, 0, data, 0, length);
    }

    /**
     * @return true if beacon detected, false otherwise.
     */
    @ScriptApi
    public boolean isBeaconFound() {
      return (getBearing() != 0) && (getDistance() != 128);
    }

    /**
     * @param channel 1 to 4 like on the beacon.
     * @return true if bearing detected, false otherwise.
     * @throws EV3ScriptException
     */
    @ScriptApi
    public boolean isBeaconFound(int channel) throws EV3ScriptException {
      return (getBearing(channel) != 0) && (getDistance(channel) != 128);
    }

    /**
     * @return The bearing from -12 to 12 (clockwise when looking behind the sensor, 0 means beacon in front)
     */
    @ScriptApi
    public int getBearing() {
      return (int) data[(defaultChannel - 1) * 2];
    }

    /**
     * @return The bearing from -12 to 12 (clockwise when looking behind the sensor, 0 means beacon in front)
     * @throws EV3ScriptException
     */
    @ScriptApi
    public int getBearing(int channel) throws EV3ScriptException {
      checkChannel(channel);
      return (int) data[(channel - 1) * 2];
    }

    /**
     * @return The distance in cm (from 0 to 100cm)
     */
    @ScriptApi
    public int getDistance() {
      return (int) data[((defaultChannel - 1) * 2) + 1];
    }

    /**
     * @return The distance in cm (from 0 to 100cm)
     * @throws EV3ScriptException
     */
    @ScriptApi
    public int getDistance(int channel) throws EV3ScriptException {
      checkChannel(channel);
      return (int) data[((channel - 1) * 2) + 1];
    }

    @Override
    public String toString() {
      return "{isBeaconFound: " + isBeaconFound() + //
          ", distance: " + getDistance() + //
          ", bearing: " + getBearing() + "}";
    }
  }
}
