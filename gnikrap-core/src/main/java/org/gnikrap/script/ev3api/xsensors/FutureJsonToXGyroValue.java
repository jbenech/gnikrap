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

import com.eclipsesource.json.JsonObject;
import com.eclipsesource.json.JsonValue;

/**
 * Convert the json raw value to an XGyro sensor value.
 */
public class FutureJsonToXGyroValue extends AbstractFutureJsonToXSensorValue {

  public FutureJsonToXGyroValue(JsonValue rawValue) {
    super(rawValue);
  }

  @Override
  protected XSensorValue buildValue(JsonObject rawValue) {
    return new XGyroValue(rawValue);
  }

  public static final class XGyroValue extends XSensorValue {
    private final XAxis x;
    private final XAxis y;
    private final XAxis z;

    XGyroValue(JsonObject raw) {
      super(raw.get(JSonXSensorMessageFields.IS_STARTED).asBoolean());
      if (isStarted()) {
        x = new XAxis(raw.get(JSonXSensorMessageFields.XGYRO_X_AXIS).asObject());
        y = new XAxis(raw.get(JSonXSensorMessageFields.XGYRO_Y_AXIS).asObject());
        z = new XAxis(raw.get(JSonXSensorMessageFields.XGYRO_Z_AXIS).asObject());
      } else {
        x = new XAxis();
        y = new XAxis();
        z = new XAxis();
      }
    }

    public XAxis getX() {
      return x;
    }

    public XAxis getY() {
      return y;
    }

    public XAxis getZ() {
      return z;
    }

    @Override
    public String toString() {
      return "{isStarted: " + isStarted() + ", x: " + getX() + ", y: " + getY() + ", z: " + getZ() + "}";
    }
  }

  public static final class XAxis {
    private final float angle;

    XAxis() {
      angle = 0;
    }

    XAxis(JsonObject raw) {
      angle = raw.get(JSonXSensorMessageFields.XGYRO_AXIS_ANGLE).asFloat();
    }

    public float getAngle() {
      return angle;
    }

    @Override
    public String toString() {
      return "{angle: " + angle + "}";
    }
  }
}
