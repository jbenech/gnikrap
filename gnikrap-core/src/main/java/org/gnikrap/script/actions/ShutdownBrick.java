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
package org.gnikrap.script.actions;

import java.io.IOException;
import java.util.logging.Logger;

import org.gnikrap.ActionMessageProcessor;
import org.gnikrap.script.EV3ActionProcessor;
import org.gnikrap.script.EV3Exception;
import org.gnikrap.script.EV3Message;
import org.gnikrap.script.JsonMessageFields;
import org.gnikrap.utils.LoggerUtils;

/**
 * Shutdown the EV3 brick.
 */
public class ShutdownBrick implements ActionMessageProcessor {
  private static final Logger LOGGER = LoggerUtils.getLogger(ShutdownBrick.class);

  @Override
  public void process(EV3Message msg, EV3ActionProcessor context) throws EV3Exception {
    LOGGER.info("ShudtownBrick requested by the GUI");

    try {
      Runtime.getRuntime().exec("shutdown -h now"); // "init 0" in leJOS
    } catch (IOException e) {
      // Ignore
    }
  }

  @Override
  public String getName() {
    return JsonMessageFields.ACTION_SHUTDOWN_BRICK;
  }

  @Override
  public boolean isAsyncNeeded() {
    return false; // Shutdown now ! (<=> Shutdown will be done even if there is a bug in the async processing part)
  }
}
