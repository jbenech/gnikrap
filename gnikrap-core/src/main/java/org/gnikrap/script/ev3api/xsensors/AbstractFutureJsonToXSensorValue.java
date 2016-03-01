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

import java.util.concurrent.ExecutionException;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.TimeoutException;

import com.eclipsesource.json.JsonObject;
import com.eclipsesource.json.JsonValue;

/**
 * The aim is to have the computation performed only if the {@link #get()} was called. <br/>
 * If {@link #get()} wasn't called, no computation was done.
 */
abstract class AbstractFutureJsonToXSensorValue implements Future<XSensorValue> {
  private JsonValue rawValue;
  private XSensorValue value;

  protected AbstractFutureJsonToXSensorValue(JsonValue rawValue) {
    this.rawValue = rawValue;
  }

  /**
   * Build the value of the XSensor while required. This method will only be called once and only while the value has to be created.
   */
  protected abstract XSensorValue buildValue(JsonObject rawValue);

  /**
   * Construct the value only when needed
   */
  @Override
  public synchronized XSensorValue get() {
    if (value == null) {
      value = buildValue(rawValue.asObject());
      rawValue = null;
    }
    return value;
  }

  @Override
  public boolean isDone() {
    return (value != null);
  }

  @Override
  public boolean cancel(boolean mayInterruptIfRunning) {
    return false; // false: Cannot be canceled
  }

  @Override
  public boolean isCancelled() {
    return false; // false: Cannot be canceled
  }

  @Override
  public XSensorValue get(long timeout, TimeUnit unit) throws InterruptedException, ExecutionException, TimeoutException {
    return get(); // Computation should be very fast => Don't manage the timeout
  }
}
