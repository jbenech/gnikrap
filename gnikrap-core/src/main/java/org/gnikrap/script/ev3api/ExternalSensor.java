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

import java.util.HashMap;
import java.util.Map;

import org.gnikrap.utils.JsonUtils;

import com.eclipsesource.json.JsonValue;

/**
 * Manage the external sensors values.</br>
 * 
 * This class take in account the thread race between the script (which perform reading) and the Java (which perform writing).
 */
public class ExternalSensor {

  private final Map<String, Sensor> sensors = new HashMap<String, Sensor>();

  /**
   * Returns the sensor object for the given name. (Note: Sensor object can be locally kept).
   */
  public Sensor getSensor(String name) {
    // We try to avoid the synchronization cost if possible
    Sensor s = sensors.get(name);
    if (s == null) {
      synchronized (sensors) {
        s = sensors.get(name);
        if (s == null) {
          s = new Sensor();
          sensors.put(name, s);
        }
      }
    }
    return s;
  }

  /**
   * The data for one sensor.
   * 
   * Don't need to synchronize here as the value is "atomic". However, the script in order to have data "atomicity" must call {@link #getValue()} and keep the object to make all the subsequent call on
   * the same "value" object.
   */
  public static class Sensor {
    private SensorValue value;

    public void setRawValue(JsonValue rawSensorvalue) {
      this.value = new SensorValue(rawSensorvalue);
    }

    public Object getValue() {
      return (value == null ? null : value.getValue());
    }
  }

  /**
   * The aim of this object is to store the value in an "raw/unprocessed" state and to process it while used (we assume that a lot of the data will not be consulted <=> No need to waste time to
   * process these data).
   */
  public static class SensorValue {
    private JsonValue rawData;
    private Object data;

    public SensorValue(JsonValue rawData) {
      this.rawData = rawData;
    }

    /**
     * Construct the value only when needed
     */
    public Object getValue() {
      // We try to avoid the synchronization cost if possible
      if (data == null) {
        synchronized (this) {
          if (data == null) {
            data = JsonUtils.toObject(rawData);
            rawData = null;
          }
        }
      }
      return data;
    }
  }
}
