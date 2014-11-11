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

import lejos.hardware.motor.EV3LargeRegulatedMotor;
import lejos.hardware.port.Port;

public class SimpleEV3LargeMotor extends SimpleEV3Motor {

  public SimpleEV3LargeMotor(Port port) {
    super(port, new EV3LargeRegulatedMotor(port));
  }

  /**
   * From the LEGO site (http://shop.lego.com/en-US/EV3-Large-Servo-Motor-45502):
   * <ul>
   * <li>Large motor can go to 160RPM => 960°/s - Don't see a big difference between 720 and 960.</li>
   * </ul>
   */
  @Override
  protected float getSpeedRatio() {
    return 7.2f;
  }
}
