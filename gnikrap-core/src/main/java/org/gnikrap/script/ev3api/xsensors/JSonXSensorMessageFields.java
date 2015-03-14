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

/**
 * The constants for parsing xSensors values
 */
public final class JSonXSensorMessageFields {

  // XSensor types
  public static final String XSENSOR_TYPE_XGYRO = "Gyr1";
  public static final String XSENSOR_TYPE_XTOUCH = "Tch1";
  public static final String XSENSOR_TYPE_XVIDEO = "Vid1";
  public static final String XSENSOR_TYPE_XGEO = "Geo1";

  // Field(s) common to all XSensors
  public static final String IS_STARTED = "isStarted";

  // Fields for XGyro
  public static final String XGYRO_X_AXIS = "x";
  public static final String XGYRO_Y_AXIS = "y";
  public static final String XGYRO_Z_AXIS = "z";
  public static final String XGYRO_AXIS_ANGLE = "angle";

  // Fields for XTouch
  public static final String XTOUCH_TOUCHS = "touchs";

  // Fields for xVideo
  public static final String XVIDEO_OBJECTS = "objects";
  public static final String XVIDEO_OBJECT_X = "x";
  public static final String XVIDEO_OBJECT_Y = "y";

  // Fields for xGeo
  public static final String XGEO_TIMESTAMP = "timestamp";
  public static final String XGEO_LATITUDE = "latitude";
  public static final String XGEO_LONGITUDE = "longitude";
  public static final String XGEO_ACCURACY = "accuracy";
  public static final String XGEO_ALTITUDE = "altitude";
  public static final String XGEO_ALTITUDE_ACCURACY = "altitudeAccuracy";

  private JSonXSensorMessageFields() {
    // Avoid instanciation
  }
}
