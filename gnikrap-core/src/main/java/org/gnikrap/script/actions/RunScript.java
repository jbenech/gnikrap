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
package org.gnikrap.script.actions;

import org.gnikrap.script.ActionMessageProcessor;
import org.gnikrap.script.EV3ActionProcessor;
import org.gnikrap.script.EV3Exception;
import org.gnikrap.script.EV3Message;
import org.gnikrap.script.JsonMessageFields;

/**
 * Run the script that is inside the message. Can also stop the running script (if force stop was enabled).
 */
public class RunScript implements ActionMessageProcessor {

  @Override
  public void process(EV3Message msg, EV3ActionProcessor context) throws EV3Exception {
    String language = msg.getFieldAsText(JsonMessageFields.SCRIPT_LANGUAGE);
    String scriptText = msg.getFieldAsText(JsonMessageFields.SCRIPT_TEXT);
    boolean force = msg.getFieldAsBoolean(JsonMessageFields.SCRIPT_FORCE_STOP);

    context.getScriptExecutionManager().runScript(language, scriptText, force);
  }

  @Override
  public String getName() {
    return JsonMessageFields.ACTION_RUN_SCRIPT;
  }

  @Override
  public boolean isAsyncNeeded() {
    return true;
  }
}
