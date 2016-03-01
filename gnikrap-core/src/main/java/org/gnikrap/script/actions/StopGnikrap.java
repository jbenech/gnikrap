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

import java.util.logging.Logger;

import org.gnikrap.GnikrapAppContext;
import org.gnikrap.script.ActionMessageProcessor;
import org.gnikrap.script.EV3ActionProcessor;
import org.gnikrap.script.EV3Exception;
import org.gnikrap.script.EV3Message;
import org.gnikrap.script.JsonMessageFields;
import org.gnikrap.utils.LoggerUtils;

/**
 * Stop the Gnikrap application.
 */
public class StopGnikrap implements ActionMessageProcessor {
  private static final Logger LOGGER = LoggerUtils.getLogger(StopGnikrap.class);

  private final GnikrapAppContext appContext;

  public StopGnikrap(GnikrapAppContext appContext) {
    this.appContext = appContext;
  }

  @Override
  public void process(EV3Message msg, EV3ActionProcessor context) throws EV3Exception {
    LOGGER.info("StopGnikrap application requested by the GUI");

    // Stop Gnikrap - Need to create a new Thread in order to avoid the action been stopped while stopping Gnikrap application.
    new Thread(new Runnable() {
      @Override
      public void run() {
        appContext.getGnikrapApp().stop();
      }
    }).run();
  }

  @Override
  public String getName() {
    return JsonMessageFields.ACTION_STOP_GNIKRAP;
  }

  @Override
  public boolean isAsyncNeeded() {
    return false; // Shutdown now ! (<=> Shutdown will be done even if there is a bug in the async processing part)
  }
}
