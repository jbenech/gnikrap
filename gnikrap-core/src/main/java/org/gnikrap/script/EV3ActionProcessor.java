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
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.BlockingQueue;
import java.util.concurrent.Executors;
import java.util.concurrent.LinkedBlockingQueue;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;
import java.util.logging.Level;
import java.util.logging.Logger;

import org.gnikrap.ActionMessageProcessor;
import org.gnikrap.EV3SriptCommandSocketConnectionCallback;
import org.gnikrap.utils.LoggerUtils;
import org.gnikrap.utils.MapBuilder;

/**
 * Process the action from all the WebSocket sessions in a FIFO order. <br/>
 * Note: The action are performed by only one thread.
 */
public final class EV3ActionProcessor {
  private static final Logger LOGGER = LoggerUtils.getLogger(EV3ActionProcessor.class);

  private final Map<String, ActionMessageProcessor> actionMessageProcessorRepository = new HashMap<String, ActionMessageProcessor>();
  private EV3SriptCommandSocketConnectionCallback remoteControlService;
  private ScriptExecutionManager context;

  // private final ExecutorService executor = Executors.newSingleThreadExecutor();
  private final ScheduledExecutorService executor = Executors.newSingleThreadScheduledExecutor();
  private final BlockingQueue<String> messagesToSend = new LinkedBlockingQueue<String>();

  public EV3ActionProcessor() {
    setContext(new ScriptExecutionManager());
  }

  public void setContext(ScriptExecutionManager context) {
    this.context = context;
    if (context != null) {
      this.context.setActionProcessor(this);
    }
  }

  /**
   * Start processing of tasks
   */
  public void start() {
    // Start the answer processor executor
    executor.scheduleAtFixedRate(new Runnable() {
      @Override
      public void run() {
        try {
          String toSend;
          while ((toSend = messagesToSend.poll()) != null) {
            sendBackMessage(toSend);
          }
        } catch (Exception ex) {
          LOGGER.log(Level.WARNING, "Error while sending message to browser", ex);
        }
      }
    }, 0, 50, TimeUnit.MILLISECONDS);
  }

  public void setRemoteControlService(EV3SriptCommandSocketConnectionCallback remoteControlService) {
    this.remoteControlService = remoteControlService;
  }

  /**
   * Enqueue the message in order to process it as soon as possible.
   * 
   * @param message The message to process
   */
  public void processMessage(final String rawMessage) {
    try {
      // Parse the message and check if the action is quick or not
      final EV3Message message = new EV3Message(rawMessage);
      String key = message.getActionName();
      final ActionMessageProcessor processor = actionMessageProcessorRepository.get(key);
      if (processor == null) {
        throw new EV3Exception(EV3Exception.UNKNOWN_ACTION, MapBuilder.buildHashMap("action", key).build());
      }

      // Process the action (in the executor'thread or in the XNIO'thread)
      if (processor.isAsyncNeeded()) {
        executor.execute(new Runnable() {
          @Override
          public void run() {
            try {
              processor.process(message, EV3ActionProcessor.this);
            } catch (EV3Exception ev3e) {
              sendBackException(ev3e);
            }
          }
        });
      } else {
        processor.process(message, EV3ActionProcessor.this);
      }
    } catch (EV3Exception ev3e) {
      sendBackException(ev3e);
    }
  }

  /**
   * Send a message to the client
   */
  public void sendBackMessage(String message) {
    remoteControlService.sendMessage(message);
  }

  void sendBackException(EV3Exception ex) {
    LOGGER.info("sendBackException(" + ex + ")");
    try {
      sendBackMessage(EV3MessageBuilder.buildEV3ExceptionMessage(ex));
    } catch (IOException ignore) {
      LOGGER.log(Level.WARNING, "Error send back exception to the browser", ignore);
    }
  }

  public void registerActionMessageProcessor(ActionMessageProcessor processor) {
    actionMessageProcessorRepository.put(processor.getName(), processor);
  }

  public void unregisterActionMessageProcessor(String action) {
    actionMessageProcessorRepository.remove(action);
  }

  public ScriptExecutionManager getContext() {
    return context;
  }
}
