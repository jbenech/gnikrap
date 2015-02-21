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

import lejos.hardware.BrickFinder;
import lejos.hardware.Power;

import org.gnikrap.utils.ScriptApi;

/**
 * Enable to access to the EV3 Battery HW.
 */
public final class SimpleEV3Battery implements EV3Device {

  private final Power power;
  private final SensorMonitor logger;

  public SimpleEV3Battery() {
    power = BrickFinder.getLocal().getPower();
    logger = SensorMonitorFactory.getLogger(EV3Constants.BATTERY_KEY);
  }

  @Override
  public void release() {
    // Does nothing, Sound is a static API within lejos
  }

  /**
   * @return current draw from the battery (in Amps)
   */
  @ScriptApi
  public float getBatteryCurrent() {
    float result = power.getBatteryCurrent();
    logger.log(EV3Constants.BATTERY_BATTERY_CURRENT, result);
    return result;
  }

  /**
   * @return the motor current draw (in Amps)
   */
  @ScriptApi
  public float getMotorCurrent() {
    float result = power.getMotorCurrent();
    logger.log(EV3Constants.BATTERY_MOTOR_CURRENT, result);
    return result;
  }

  /**
   * The EV3 uses 6 batteries of 1500 mV each.
   * 
   * @return Battery voltage in mV. ~9000 = full.
   */
  @ScriptApi
  public int getVoltageMilliVolt() {
    int result = power.getVoltageMilliVolt();
    logger.log(EV3Constants.BATTERY_VOLTAGE_MV, result);
    return result;
  }

  @Override
  public String toString() {
    return "{batteryCurrent: " + getBatteryCurrent() + //
        ", motorCurrent: " + getMotorCurrent() + //
        ", voltageMilliVolt: " + getVoltageMilliVolt() + "}";
  }
}
