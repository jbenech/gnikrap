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
package org.gnikrap.script;

import java.io.IOException;
import java.util.Collections;
import java.util.concurrent.Future;
import java.util.logging.Level;
import java.util.logging.Logger;

import javax.script.ScriptEngine;
import javax.script.ScriptEngineManager;

import org.gnikrap.EV3SriptCommandSocketConnectionCallback;
import org.gnikrap.script.ev3api.EV3ScriptException;
import org.gnikrap.script.ev3api.SimpleEV3Brick;
import org.gnikrap.script.ev3api.xsensors.FutureValue;
import org.gnikrap.script.ev3api.xsensors.XSensorManager;
import org.gnikrap.utils.LoggerUtils;
import org.gnikrap.utils.MapBuilder;
import org.gnikrap.utils.StopableExecutor;

/**
 * Manage the execution of the script
 */
public class ScriptExecutionManager {
  private static final Logger LOGGER = LoggerUtils.getLogger(EV3SriptCommandSocketConnectionCallback.class);

  // The script context
  private EV3ScriptContext scriptContext;

  private final ScriptEngineManager scriptEngineFactory = new ScriptEngineManager();
  // private final ExecutorService scriptProcessor = Executors.newSingleThreadExecutor();
  private final StopableExecutor scriptExecutor = new StopableExecutor();
  private Future<?> scriptResult;

  private EV3ActionProcessor actionProcessor;

  public void setActionProcessor(EV3ActionProcessor actionProcessor) {
    this.actionProcessor = actionProcessor;
  }

  public void reset() {
    if (scriptContext != null) {
      scriptContext.releaseResources();
    } else {
      SimpleEV3Brick brick = buildNewEV3Brick();
      scriptContext = new EV3ScriptContext(brick, this, new XSensorManager());
      if (brick != null) {
        brick.setScriptContext(scriptContext);
      }
    }
  }

  protected SimpleEV3Brick buildNewEV3Brick() {
    return new SimpleEV3Brick();
  }

  /**
   * Sample language: JavaScript, Groovy, Jython, etc..
   */
  public void runScript(final String language, final String scriptText, boolean stopRunningScriptIfNeeded) throws EV3Exception {
    if ((scriptResult != null) && (scriptResult.isDone() == false)) {
      // Script is running => Force stop or not
      if (stopRunningScriptIfNeeded) {
        LOGGER.warning("Submiting a new script while a first one is already running => Stoping the running script");
        stopScript();
      } else {
        throw new EV3ScriptException(EV3ScriptException.SCRIPT_ALREADY_RUNNING, Collections.<String, String> emptyMap());
      }
    }
    reset();

    Runnable scriptTask = new Runnable() {
      @Override
      public void run() {
        try {
          try {
            ScriptEngine engine = scriptEngineFactory.getEngineByName(language);
            if (engine == null) {
              throw new EV3Exception(EV3Exception.SCRITP_LANGUAGE_NOT_SUPPORTED, MapBuilder.buildHashMap("language", language).build());
            }
            engine.put("ev3", scriptContext);
            scriptContext.start();
            sendBackMessage(EV3MessageBuilder.buildInfoCodedMessage(CodedMessages.SCRIPT_STARTING, Collections.<String, String> emptyMap()));
            engine.eval(scriptText);
            sendBackMessage(EV3MessageBuilder.buildInfoCodedMessage(CodedMessages.SCRIPT_ENDED, Collections.<String, String> emptyMap()));
          } catch (EV3Exception ev3ex) {
            throw ev3ex;
          } catch (Exception ex1) {
            throw new EV3ScriptException(EV3ScriptException.UNEXPECTED_ERROR, MapBuilder.buildHashMap("error", ex1.toString()).build());
          } finally {
            try {
              reset();
            } catch (Exception ex) {
              LOGGER.log(Level.WARNING, "Exception ignored", ex);
            }
          }
        } catch (EV3Exception ev3ex) {
          actionProcessor.sendBackException(ev3ex);
        }
      }
    };
    scriptResult = scriptExecutor.submit(scriptTask);
  }

  void sendBackMessage(String msg) {
    actionProcessor.sendBackMessage(msg);
  }

  public void stopScript() {
    long waitTime = 5000;
    if (scriptContext != null) {
      waitTime = scriptContext.getConfiguration().getWaitingTimeBeforeHardKill();
    }
    stopScript(waitTime);
  }

  public void stopScript(long smoothStopTimeout) {
    if ((scriptResult != null) && (scriptResult.isDone() == false)) {
      // Try gentle stop
      scriptContext.stop();

      // Wait
      long end = System.currentTimeMillis() + smoothStopTimeout;
      while ((scriptResult.isDone() == false) && (System.currentTimeMillis() <= end)) {
        try {
          Thread.sleep(200);
        } catch (InterruptedException ie) {
          // Ignore
        }
      }

      // Enforce hard stop (for not friendly or buggy scripts)
      if (scriptResult.isDone() == false) {
        scriptExecutor.stop();
        try {
          // Script has not stopped gracefully => We act as if there is an EV3ScriptException
          sendBackMessage(EV3MessageBuilder.buildEV3ExceptionMessage(new EV3ScriptException(EV3ScriptException.SCRIPT_STOP_FORCED, Collections.<String, String> emptyMap())));
        } catch (IOException ioe) {
          LOGGER.log(Level.WARNING, "Exception ignored", ioe);
        }
      }
    }

    scriptResult = null;
    // Script ended, release all the hardware resources
    reset();
  }

  public void setXSensorFutureValue(String sensorName, FutureValue value) {
    if (scriptContext != null) {
      scriptContext.getXSensor(sensorName).setFutureValue(value);
    }
  }
}
