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

import lejos.hardware.motor.EV3MediumRegulatedMotor;
import lejos.hardware.port.Port;

public class SimpleEV3MediumMotor extends SimpleEV3Motor {

  public SimpleEV3MediumMotor(Port port) {
    super(port, new EV3MediumRegulatedMotor(port));
  }

  /**
   * From the LEGO site (http://shop.lego.com/en-US/EV3-Large-Servo-Motor-45502):
   * <ul>
   * <li>Medium motor can go to 240RPM => 1440°/s - Don't see a big difference between 1080 and 1440.</li>
   * </ul>
   */
  @Override
  protected float getSpeedRatio() {
    return 10.8f;
  }
}
