/*
 * Gnikrap is a simple scripting environment for the Lego Mindstrom EV3
 * Copyright (C) 2014-2016 Jean BENECH
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

/**
 * Process an action message.
 */
public interface ActionMessageProcessor {

  /**
   * Process the action.
   * 
   * If no exception launched, the action is considered successfully done.
   */
  void process(EV3Message msg, EV3ActionProcessor context) throws EV3Exception;

  /**
   * @return the name of the actions (received in the message from the browser).
   */
  String getName();

  /**
   * @return true if the action need to be processed in asynchronous or not (i.e. the action is really quick and don't need external resources).
   */
  boolean isAsyncNeeded();
}
