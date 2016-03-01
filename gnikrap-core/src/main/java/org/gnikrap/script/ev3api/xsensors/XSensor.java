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
package org.gnikrap.script.ev3api.xsensors;

import java.util.concurrent.Future;
import java.util.logging.Level;
import java.util.logging.Logger;

import org.gnikrap.utils.LoggerUtils;
import org.gnikrap.utils.ScriptApi;

/**
 * The data for one sensor.
 * 
 * The atomicity of the sensor value is managed at the value level (immutable): The script has to retrieve the value graph with {@link #getValue()} and then perform all the reading on this graph.
 * Subsequent call to {@link #getValue()} could return a different value graph.
 */
public class XSensor {
  private static final Logger LOGGER = LoggerUtils.getLogger(XSensor.class);

  private final String name;

  private Future<XSensorValue> value;

  private static final XSensorValue DEFAULT_XSENSOR_VALUE = new XSensorValue(false);

  XSensor(String name) {
    this.name = name;
  }

  @ScriptApi
  public String getName() {
    return name;
  }

  public void setFutureValue(Future<XSensorValue> futureSensorValue) {
    this.value = futureSensorValue;
  }

  @ScriptApi
  public XSensorValue getValue() {
    try {
      Future<XSensorValue> temp = value; // Get locally to avoid race condition issues
      return (temp == null ? DEFAULT_XSENSOR_VALUE : temp.get());
    } catch (Exception ex) {
      LOGGER.log(Level.SEVERE, "Error while retrieving value for XSensor: \"" + getName() + "\"", ex);
      return DEFAULT_XSENSOR_VALUE;
    }
  }

  @Override
  public String toString() {
    return "{name: " + getName() + ", value: " + getValue() + "}";
  }
}
