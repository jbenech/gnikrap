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

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import lejos.hardware.BrickFinder;
import lejos.hardware.port.MotorPort;
import lejos.hardware.port.Port;
import lejos.hardware.port.SensorPort;

import org.gnikrap.script.EV3ScriptContext;
import org.gnikrap.utils.MapBuilder;

/**
 * This class act as a factory and is the main entry point to access to the EV3 devices.<br/>
 */
public class SimpleEV3Brick {

  private final Map<String, EV3Device> devices = new HashMap<String, EV3Device>();
  private EV3ScriptContext sc;

  public SimpleEV3Brick() {
    BrickFinder.getLocal();
  }

  public void setScriptContext(EV3ScriptContext sc) {
    this.sc = sc;
  }

  // Actions
  public SimpleEV3MediumMotor getMediumMotor(String port) throws EV3ScriptException {
    EV3Device d = devices.get(port);
    if (d != null) {
      if (d instanceof SimpleEV3MediumMotor) {
        return (SimpleEV3MediumMotor) d;
      }
      d.release();
      devices.remove(port);
    }
    devices.put(port, new SimpleEV3MediumMotor(getMotorPort(port)));
    return getMediumMotor(port);
  }

  public SimpleEV3LargeMotor getLargeMotor(String port) throws EV3ScriptException {
    EV3Device d = devices.get(port);
    if (d != null) {
      if (d instanceof SimpleEV3LargeMotor) {
        return (SimpleEV3LargeMotor) d;
      }
      d.release();
      devices.remove(port);
    }
    devices.put(port, new SimpleEV3LargeMotor(getMotorPort(port)));
    return getLargeMotor(port);
  }

  public SimpleEV3Screen getScreen() {
    EV3Device d = devices.get(EV3Constants.SCREEN_KEY);
    if (d != null) {
      return (SimpleEV3Screen) d;
    }
    devices.put(EV3Constants.SCREEN_KEY, new SimpleEV3Screen());
    return getScreen();
  }

  public SimpleEV3Sound getSound() {
    EV3Device d = devices.get(EV3Constants.SOUND_KEY);
    if (d != null) {
      return (SimpleEV3Sound) d;
    }
    devices.put(EV3Constants.SOUND_KEY, new SimpleEV3Sound());
    return getSound();
  }

  // Both sensor and action
  public SimpleEV3Keyboard getKeyboard() {
    EV3Device d = devices.get(EV3Constants.KEYBOARD_KEY);
    if (d != null) {
      return (SimpleEV3Keyboard) d;
    }
    devices.put(EV3Constants.KEYBOARD_KEY, new SimpleEV3Keyboard(sc));
    return getKeyboard();
  }

  // Sensors
  public SimpleEV3Battery getBattery() {
    EV3Device d = devices.get(EV3Constants.BATTERY_KEY);
    if (d != null) {
      return (SimpleEV3Battery) d;
    }
    devices.put(EV3Constants.BATTERY_KEY, new SimpleEV3Battery());
    return getBattery();
  }

  public SimpleEV3ColorSensor getColorSensor(String port) throws EV3ScriptException {
    EV3Device d = devices.get(port);
    if (d != null) {
      if (d instanceof SimpleEV3ColorSensor) {
        return (SimpleEV3ColorSensor) d;
      }
      d.release();
      devices.remove(port);
    }
    devices.put(port, new SimpleEV3ColorSensor(getSensorPort(port)));
    return getColorSensor(port);
  }

  public SimpleEV3IRSensor getIRSensor(String port) throws EV3ScriptException {
    EV3Device d = devices.get(port);
    if (d != null) {
      if (d instanceof SimpleEV3IRSensor) {
        return (SimpleEV3IRSensor) d;
      }
      d.release();
      devices.remove(port);
    }
    devices.put(port, new SimpleEV3IRSensor(getSensorPort(port)));
    return getIRSensor(port);
  }

  public SimpleEV3TouchSensor getTouchSensor(String port) throws EV3ScriptException {
    EV3Device d = devices.get(port);
    if (d != null) {
      if (d instanceof SimpleEV3TouchSensor) {
        return (SimpleEV3TouchSensor) d;
      }
      d.release();
      devices.remove(port);
    }
    devices.put(port, new SimpleEV3TouchSensor(getSensorPort(port)));
    return getTouchSensor(port);
  }

  public void releaseResources() {
    List<EV3Device> temp = new ArrayList<EV3Device>(devices.values());
    devices.clear();
    for (EV3Device d : temp) {
      d.release();
    }
  }

  // Utility methods
  static Port getSensorPort(String p) throws EV3ScriptException {
    switch (p) {
    case "1":
    case EV3Constants.S1:
      return SensorPort.S1;
    case "2":
    case EV3Constants.S2:
      return SensorPort.S2;
    case "3":
    case EV3Constants.S3:
      return SensorPort.S3;
    case "4":
    case EV3Constants.S4:
      return SensorPort.S4;
    }
    throw new EV3ScriptException(EV3ScriptException.INVALID_SENSOR_PORT, MapBuilder.buildHashMap("port", p).build());
  }

  static Port getMotorPort(String p) throws EV3ScriptException {
    switch (p) {
    case EV3Constants.A:
      return MotorPort.A;
    case EV3Constants.B:
      return MotorPort.B;
    case EV3Constants.C:
      return MotorPort.C;
    case EV3Constants.D:
      return MotorPort.D;
    }
    throw new EV3ScriptException(EV3ScriptException.INVALID_MOTOR_PORT, MapBuilder.buildHashMap("port", p).build());
  }
}
