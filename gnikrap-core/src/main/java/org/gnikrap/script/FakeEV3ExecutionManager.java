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
package org.gnikrap.script;

import org.gnikrap.script.ev3api.SimpleEV3Brick;

/**
 * Class mainly used in order to perform tests without EV3 brick
 */
public class FakeEV3ExecutionManager extends ScriptExecutionManager {

  public FakeEV3ExecutionManager() {
    super();
  }

  @Override
  public SimpleEV3Brick buildNewEV3Brick() {
    return null;
  }

  // static class FakeEV3Brick extends SimpleEV3Brick {
  //
  // @Override
  // public SimpleEV3Battery getBattery() {
  // return null;
  // }
  //
  // @Override
  // public SimpleEV3ColorSensor getColorSensor(String port) {
  // return null;
  // }
  //
  // @Override
  // public SimpleEV3IRSensor getIRSensor(String port) {
  // return null;
  // }
  //
  // @Override
  // public SimpleEV3Keyboard getKeyboard() {
  // return null;
  // }
  //
  // @Override
  // public SimpleEV3LargeMotor getLargeMotor(String port) {
  // return null;
  // }
  //
  // @Override
  // public SimpleEV3MediumMotor getMediumMotor(String port) {
  // return null;
  // }
  //
  // @Override
  // public SimpleEV3Screen getScreen() {
  // return null;
  // }
  //
  // @Override
  // public SimpleEV3Sound getSound() {
  // return null;
  // }
  //
  // @Override
  // public SimpleEV3TouchSensor getTouchSensor(String port) {
  // return null;
  // }
  // }

}
