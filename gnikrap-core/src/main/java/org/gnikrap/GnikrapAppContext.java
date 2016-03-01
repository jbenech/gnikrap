/*
 * Gnikrap is a simple scripting environment for the Lego Mindstrom EV3
 * Copyright (C) 2015-2016 Jean BENECH
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
package org.gnikrap;

import org.gnikrap.script.EV3ActionProcessor;
import org.gnikrap.script.EV3SriptCommandSocketConnectionCallback;
import org.gnikrap.script.ScriptExecutionManager;
import org.gnikrap.utils.Configuration;

/**
 * The really (memory and CPU) poor mens Application Context Configuration.<br/>
 * The aim of this class is to have a 'global' application context to share easily the main application entry points.
 */
public interface GnikrapAppContext {

  /**
   * Returns the {@link GnikrapApp} object (the application entry point).
   */
  GnikrapApp getGnikrapApp();

  /**
   * Returns the {@link EV3ActionProcessor} object (process asynchronously all the actions/events from the GUI).
   */
  EV3ActionProcessor getEV3ActionProcessor();

  /**
   * Returns the {@link ScriptExecutionManager} object (manage the script that run on Gnikrap).
   */
  ScriptExecutionManager getScriptExecutionManager();

  /**
   * Returns {@link Configuration} object (Application configuration configuration loaded from the config file).
   */
  Configuration getConfiguration();

  /**
   * Returns the {@link EV3SriptCommandSocketConnectionCallback} object (Enable to send back information to the GUI).
   */
  EV3SriptCommandSocketConnectionCallback getEV3SriptCommandSocketConnectionCallback();
}
