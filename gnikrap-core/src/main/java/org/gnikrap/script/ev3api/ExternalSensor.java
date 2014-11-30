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
 * This class is thread safe (2 threads can access: the script/reading and the Java/writing).
 */
public class ExternalSensor {

  private final Map<String, Sensor> sensors = new HashMap<String, Sensor>();

  /**
   * Returns the sensor object for the given name. (Note: Sensor object can be locally kept).
   */
  public Sensor getSensor(String name) {
    Sensor s = sensors.get(name);
    if (s == null) { // Avoid synchronization cost if possible
      synchronized (sensors) {
        s = sensors.get(name);
        if (s == null) {
          s = new Sensor(name);
          sensors.put(name, s);
        }
      }
    }
    return s;
  }

  /**
   * The data for one sensor.
   * 
   * The atomicity of the sensor value is managed at the value level (immutable): The script has to retrieve the value graph with {@link #getValue()} and then perform all the reading on this graph.
   * Subsequent call to {@link #getValue()} could return a different value graph.
   */
  public static class Sensor {
    private final String name;

    private SensorValue value;

    Sensor(String name) {
      this.name = name;
    }

    public String getName() {
      return name;
    }

    public void setRawValue(JsonValue rawSensorvalue) {
      this.value = new SensorValue(rawSensorvalue);
    }

    public Object getValue() {
      return (value == null ? null : value.getValue());
    }
  }

  /**
   * Immutable sensor value, so there is no threading issue. </br>
   * 
   * Basically store raw value and compute the "real" value on-demand (late processing) => This reduce the CPU need if not all the values are used by the script.
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
      if (data == null) { // Avoid synchronization cost if possible
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
