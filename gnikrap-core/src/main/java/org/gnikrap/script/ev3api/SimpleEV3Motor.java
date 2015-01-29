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

import lejos.hardware.motor.BaseRegulatedMotor;
import lejos.hardware.port.Port;

public class SimpleEV3Motor implements EV3Device {

  private final BaseRegulatedMotor delegate;
  private final SensorMonitor logger;

  public SimpleEV3Motor(Port port, BaseRegulatedMotor delegate) {
    this.delegate = delegate;
    logger = SensorMonitorFactory.getLogger(port);
    resetTachoCount();
  }

  @Override
  public void release() {
    delegate.close();
  }

  /**
   * @return the tacho count in degree
   */
  final public int getTachoCount() {
    int result = delegate.getTachoCount();
    logger.log(result);
    return result;
  }

  final public void resetTachoCount() {
    delegate.resetTachoCount();
  }

  /**
   * Motor rotate forward until {{@link #stop()}. This call immediately return.
   */
  final public void forward() {
    delegate.forward();
  }

  /**
   * Motor rotate backward until {{@link #stop()}. This call immediately return.
   */
  final public void backward() {
    delegate.backward();
  }

  /**
   * Stop and lock the motor.
   */
  final public void stop() {
    stop(true);
  }

  /**
   * @param lockMotor is the motor locked at the end of the stop ?
   */
  final public void stop(boolean lockMotor) {
    stop(lockMotor, true); // Better felling with immediate return while stopping 2 motors that has to be synchronized.
  }

  /**
   * @param lockMotor is the motor locked at the end of the stop ?
   * @param immediateReturn is the function return before the stop was effective or not ?
   */
  final public void stop(boolean lockMotor, boolean immediateReturn) {
    if (lockMotor) {
      delegate.stop(immediateReturn);
    } else {
      delegate.flt(immediateReturn);
    }
  }

  final public boolean isMoving() {
    return delegate.isMoving();
  }

  /**
   * Set the speed of the motor (in degrees per second)
   * 
   * @param speed
   */
  final public void setSpeed(float degreePerSecond) {
    delegate.setSpeed(degreePerSecond);
  }

  /**
   * Set the speed of the motor (100 => about 120RPM for large motor and 180RPM for medium motor)
   * 
   * @param percent The percent of speed regarding the maximum speed.
   */
  final public void setSpeedPercent(int percent) {
    setSpeed(getSpeedRatio() * Math.min(Math.max(percent, 0), 100));
  }

  /**
   * Used to convert (set/get) the speed in %
   * 
   * @return the motor speed (degrees per second) for 1% of speed.
   */
  protected float getSpeedRatio() {
    // Default is based on the maximum speed of the lejos API (which don't take in account the motor type ?!).
    return delegate.getMaxSpeed() / 100.0f;
  }

  /**
   * @returns The speed in degrees by second
   */
  final public float getSpeed() {
    return delegate.getSpeed();
  }

  /**
   * @return The speed in percent
   */
  final public int getSpeedPercent() {
    return (int) (delegate.getSpeed() / getSpeedRatio());
  }

  /**
   * Rotate the given number of degree.
   */
  final public void rotate(int angle) {
    rotate(angle, false);
  }

  /**
   * Rotate the given number of degree.
   * 
   * @param immediateReturn is the function return before the stop was effective or not ?
   */
  final public void rotate(int angle, boolean immediateReturn) {
    delegate.rotate(angle, immediateReturn);
  }

  @Override
  public String toString() {
    return "{speed: " + getSpeed() + ", tachoCount: " + getTachoCount() + ", isMoving: " + isMoving() + "}";
  }
}