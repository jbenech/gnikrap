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

import java.io.IOException;
import java.io.Serializable;
import java.lang.reflect.InvocationHandler;
import java.lang.reflect.Method;
import java.lang.reflect.Proxy;
import java.util.Arrays;
import java.util.logging.Level;
import java.util.logging.Logger;

import org.gnikrap.script.ev3api.SimpleEV3Brick;
import org.gnikrap.script.ev3api.SimpleEV3Keyboard.SimpleEV3Button;
import org.gnikrap.utils.LoggerUtils;

/**
 * Enable to provide main entry point to access ev3 device to the script engine.
 */
public final class EV3ScriptContext {
  private static final Logger LOGGER = LoggerUtils.getLogger(EV3ScriptContext.class);

  private boolean running;
  private final SimpleEV3Button escape;
  private final SimpleEV3Brick ev3;

  // Configuration
  private final Configuration configuration = new Configuration();
  private int confIsRunningWait = 0;
  private boolean confIsRunningCheckEscapeKey = true;
  private int confWaitingTimeBeforeHardKill = 5000;
  private final ScriptExecutionManager ctx;

  public EV3ScriptContext(SimpleEV3Brick ev3, ScriptExecutionManager ctx) {
    this.ev3 = ev3;
    this.ctx = ctx;
    if (ev3 != null) {
      escape = ev3.getKeyboard().getEscape();
    } else {
      escape = null;
    }
  }

  public Configuration getConfiguration() {
    return configuration;
  }

  public void start() {
    running = true;
  }

  void stop() {
    running = false;
  }

  public void message(String message) {
    try {
      ctx.sendBackMessage(EV3MessageBuilder.buildInfoUserMessage(message));
    } catch (IOException ioe) { // Should never happens
      LOGGER.log(Level.WARNING, "Exception ignored", ioe);
    }
  }

  /**
   * @return true if the script is running, false if the script should stop.
   */
  public boolean isRunning() {
    if (running) {
      // Thread friendly
      if (confIsRunningWait == 0) {
        Thread.yield();
      } else {
        sleepInMs(confIsRunningWait);
      }
      // Check button escape
      if (confIsRunningCheckEscapeKey && (escape != null) && escape.isDown()) {
        stop();
      }
    }
    return running;
  }

  /**
   * @return the object that enable to pilot the EV3 brick
   */
  public SimpleEV3Brick getBrick() {
    return ev3;
  }

  /**
   * Sleep for the given number of seconds
   */
  public void sleep(float s) {
    sleepInMs((int) (s * 1000));
  }

  public void sleepInMs(int ms) {
    try {
      Thread.sleep(ms);
    } catch (InterruptedException e) {
      // Ignore
    }
  }

  void releaseResources() {
    if (ev3 != null) {
      ev3.releaseResources();
    }
  }

  Object myProxy;

  public Object getPP() {
    if (myProxy == null) {
      myProxy = Proxy.newProxyInstance(this.getClass().getClassLoader(), new Class[] { Serializable.class }, new InvocationHandler() {

        @Override
        public Object invoke(Object proxy, Method method, Object[] args) throws Throwable {
          System.out.println("invoke: " + method + " with args: " + Arrays.toString(args));
          return "Wonderfull world !";
        }
      });
    }
    return myProxy;
  }

  public class Configuration {

    /**
     * @param waitTime the waiting time in seconds, between [0.0, 1.0]. 0 means no wait.
     */
    public Configuration setIsRunningWait(float waitTime) {
      int i = (int) (waitTime * 1000); // convert in ms
      if (i < 2) {
        confIsRunningWait = 0;
      } else if (i < 1000) {
        confIsRunningWait = i;
      } else {
        confIsRunningWait = 1000;
      }

      return this;
    }

    public float isRunningWait() {
      return confIsRunningWait / 1000f;
    }

    public Configuration setIsRunningCheckEscapeKey(boolean checkEscapeKey) {
      confIsRunningCheckEscapeKey = checkEscapeKey;

      return this;
    }

    public boolean isRunningCheckEscapeKey() {
      return confIsRunningCheckEscapeKey;
    }

    /**
     * @param time waiting time before hard kill of the script, between [0.5, 30]
     */
    public Configuration setWaitingTimeBeforeHardKill(float time) {
      int i = (int) (time * 1000); // convert in ms
      if (i < 500) {
        confWaitingTimeBeforeHardKill = 500;
      } else if (i < 30000) {
        confWaitingTimeBeforeHardKill = i;
      } else {
        confWaitingTimeBeforeHardKill = 30000;
      }

      return this;
    }

    public float getWaitingTimeBeforeHardKill() {
      return confWaitingTimeBeforeHardKill / 1000f;
    }
  }
}
