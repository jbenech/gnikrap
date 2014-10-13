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

import lejos.hardware.port.Port;

/**
 * A factory to retrieve the sensors loggers
 */
public class SensorMonitorFactory {

  private static final Map<String, SensorMonitor> loggers = new HashMap<String, SensorMonitor>();

  static {
    for (String s : EV3Constants.SENSORS) {
      loggers.put(s, new SensorMonitor(s));
    }
    for (String m : EV3Constants.MOTORS) {
      loggers.put(m, new SensorMonitor(m));
    }
    loggers.put(EV3Constants.BATTERY_KEY, new SensorMonitor(EV3Constants.BATTERY_KEY));
  };

  public static SensorMonitor getLogger(String port) {
    return loggers.get(port);
  }

  public static SensorMonitor getLogger(Port port) {
    return getLogger(port.getName());
  }
}
