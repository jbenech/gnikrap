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

/**
 * Define some constant used to representing the HW in the API.
 */
public class EV3Constants {

  // Sensors ports
  public static final String S1 = "S1";
  public static final String S2 = "S2";
  public static final String S3 = "S3";
  public static final String S4 = "S4";

  public static final String[] SENSORS = { S1, S2, S3, S4 };

  // Motors ports
  public static final String A = "A";
  public static final String B = "B";
  public static final String C = "C";
  public static final String D = "D";

  public static final String[] MOTORS = { A, B, C, D };

  // Other "ports"
  final static String KEYBOARD_KEY = "KEYBOARD";
  final static String SOUND_KEY = "SOUND";
  final static String BATTERY_KEY = "BATTERY";
  final static String SCREEN_KEY = "SCREEN";

  // Sensor (for notification)
  // IR sensor
  public static final String IR_SENSOR_REMOTE = "Remote";
  public static final String IR_SENSOR_DISTANCE = "Distance";
  public static final String IR_SENSOR_SEEK = "Seek";
  // Color sensor
  public static final String COLOR_SENSOR_REFLECTED_LIGHT = "Reflected";
  public static final String COLOR_SENSOR_AMBIENT_LIGHT = "Ambient";
  public static final String COLOR_SENSOR_COLOR = "Color";
  // Battery sensor
  public static final String BATTERY_BATTERY_CURRENT = "BatteryCur";
  public static final String BATTERY_MOTOR_CURRENT = "MotorCur";
  public static final String BATTERY_VOLTAGE_MV = "VoltageMv";
  // Sound sensor
  public static final String SOUND_SENSOR_DBA = "DBA";
  public static final String SOUND_SENSOR_DB = "DB";
  // Ultrasonic sensor
  public static final String ULTRASONIC_DISTANCE = "Distance";
  public static final String ULTRASONIC_PRESENCE = "Presence";
}
