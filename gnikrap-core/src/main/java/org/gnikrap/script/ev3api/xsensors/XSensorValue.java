/*
 * Gnikrap is a simple scripting environment for the Lego Mindstrom EV3
 * Copyright (C) 2015 Jean BENECH
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

import org.gnikrap.utils.ScriptApi;

/**
 * An XSensor value
 */
public class XSensorValue {
  private final boolean isStarted;

  XSensorValue(boolean isStarted) {
    this.isStarted = isStarted;
  }

  @ScriptApi
  public boolean isStarted() {
    return isStarted;
  }

  @Override
  public String toString() {
    return "{isStarted: " + isStarted + "}";
  }
}
