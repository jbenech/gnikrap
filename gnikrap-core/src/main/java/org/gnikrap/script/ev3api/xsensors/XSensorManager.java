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
package org.gnikrap.script.ev3api.xsensors;

import java.util.HashMap;
import java.util.Map;

/**
 * Manage the external sensors values.</br>
 * 
 * This class is thread safe (2 threads can access: the script/reading and the Java/writing).
 */
public class XSensorManager {

  private final Map<String, XSensor> sensors = new HashMap<String, XSensor>();

  /**
   * Returns the sensor object for the given name. (Note: Sensor object can be locally kept).
   */
  public synchronized XSensor getSensor(String name) {
    XSensor s = sensors.get(name);
    if (s == null) {
      s = new XSensor(name);
      sensors.put(name, s);
    }
    return s;
  }
}
