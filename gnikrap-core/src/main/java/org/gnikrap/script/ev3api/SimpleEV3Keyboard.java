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

import lejos.hardware.Button;
import lejos.hardware.Key;

import org.gnikrap.script.EV3ScriptContext;

/**
 * Provide access to the brick keyboard and leds.
 */
final public class SimpleEV3Keyboard implements EV3Device {

  private static final int WAIT_TIME_FOR_KEY_EVENTS = 50;
  private static final float IS_RUNNING_WAIT_THRESHOLD = 0.02f; // 20ms

  private final SimpleEV3Button enter;
  private final SimpleEV3Button up;
  private final SimpleEV3Button down;
  private final SimpleEV3Button left;
  private final SimpleEV3Button right;
  private final SimpleEV3Button escape;
  private final SimpleEV3Led led;
  private final EV3ScriptContext sc;

  public SimpleEV3Keyboard(EV3ScriptContext sc) {
    this.sc = sc;
    enter = new SimpleEV3Button(Button.ENTER, sc);
    up = new SimpleEV3Button(Button.UP, sc);
    down = new SimpleEV3Button(Button.DOWN, sc);
    left = new SimpleEV3Button(Button.LEFT, sc);
    right = new SimpleEV3Button(Button.RIGHT, sc);
    escape = new SimpleEV3Button(Button.ESCAPE, sc);
    led = new SimpleEV3Led();
  }

  @Override
  public void release() {
    led.off();
    // Does nothing for buttons: buttons are static resources of lejos
  }

  public SimpleEV3Button getDown() {
    return down;
  }

  public SimpleEV3Button getEnter() {
    return enter;
  }

  public SimpleEV3Button getEscape() {
    return escape;
  }

  public SimpleEV3Button getLeft() {
    return left;
  }

  public SimpleEV3Button getRight() {
    return right;
  }

  public SimpleEV3Button getUp() {
    return up;
  }

  public int waitForAnyPress() {
    int button = 0;
    while (sc.isOk() && ((button = Button.waitForAnyPress(500)) == 0)) {
      // Does nothing
    }
    return button;
  }

  // private static long getEnd(float timeout) {
  // long lTimeout = (long) (timeout * 1000);
  // long end;
  // if (lTimeout < 2) {
  // end = 0x7fffffffffffffffL;
  // } else {
  // end = System.currentTimeMillis() + lTimeout;
  // }
  // return end;
  // }

  public SimpleEV3Led getLed() {
    return led;
  }

  final public static class SimpleEV3Button {
    private final Key delegate;
    private final EV3ScriptContext sc;

    public SimpleEV3Button(Key delegate, EV3ScriptContext sc) {
      this.delegate = delegate;
      this.sc = sc;
    }

    public boolean isUp() {
      return delegate.isUp();
    }

    public boolean isDown() {
      return delegate.isDown();
    }

    public void waitForPressAndRelease() {
      boolean wait = sc.getConfiguration().getIsOkWait() < IS_RUNNING_WAIT_THRESHOLD;
      waitForPress();
      while (sc.isOk() && isDown()) {
        if (wait) {
          sc.sleep(WAIT_TIME_FOR_KEY_EVENTS);
        }
      }
    }

    public void waitForPress() {
      boolean wait = sc.getConfiguration().getIsOkWait() < IS_RUNNING_WAIT_THRESHOLD;
      while (sc.isOk() && isUp()) {
        if (wait) {
          sc.sleep(WAIT_TIME_FOR_KEY_EVENTS);
        }
      }
    }

    public int getId() {
      return delegate.getId();
    }

    @Override
    public String toString() {
      return "{isUp: " + isUp() + ", isDown: " + isDown() + ", id: " + getId() + "}";
    }
  }
}
