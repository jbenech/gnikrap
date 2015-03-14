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
package org.gnikrap;

import io.undertow.websockets.WebSocketConnectionCallback;
import io.undertow.websockets.core.AbstractReceiveListener;
import io.undertow.websockets.core.BufferedTextMessage;
import io.undertow.websockets.core.StreamSourceFrameChannel;
import io.undertow.websockets.core.WebSocketCallback;
import io.undertow.websockets.core.WebSocketChannel;
import io.undertow.websockets.core.WebSockets;
import io.undertow.websockets.spi.WebSocketHttpExchange;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.logging.Level;
import java.util.logging.Logger;

import org.gnikrap.script.EV3ActionProcessor;
import org.gnikrap.utils.ApplicationContext;
import org.gnikrap.utils.LoggerUtils;
import org.xnio.ChannelListener;

/**
 * Handle the WebSocket connections for the Gnikrap web application.
 */
final public class EV3SriptCommandSocketConnectionCallback implements WebSocketConnectionCallback {
  private static final Logger LOGGER = LoggerUtils.getLogger(EV3SriptCommandSocketConnectionCallback.class);

  /** List of currently active WebSocket connections */
  private final List<WebSocketSession> sessions = new ArrayList<WebSocketSession>();

  private final EV3ActionProcessor ev3ActionProcessor;

  public EV3SriptCommandSocketConnectionCallback(ApplicationContext context) {
    this.ev3ActionProcessor = context.getObject(EV3ActionProcessor.class);
  }

  @Override
  public void onConnect(WebSocketHttpExchange exchange, WebSocketChannel channel) {
    LOGGER.info("Connecting: " + this + " to " + channel);
    WebSocketSession wss = new WebSocketSession(channel, ev3ActionProcessor);
    sessions.add(wss);
    if (sessions.size() > 5) {
      // Potential issue on CPU and bandwidth (seems limited to 128Kb/s with Wifi)
      LOGGER.warning("Important number (" + sessions.size() + ") of session opened at the same time: Potential performance issues");
    }
    channel.resumeReceives(); // /!\ channel don't receive nothing if not called
  }

  void unregisterSession(WebSocketSession session) {
    sessions.remove(session);
  }

  /**
   * Send a message to only one WebSocket session. If UUID is null, the message is broadcasted to all sessions.
   * 
   * @param message The message to sent.
   * @param session The UUID of the session (null for broadcast)
   */
  public void sendMessage(String message, UUID sessionUUID) {
    if (sessionUUID == null) {
      for (WebSocketSession session : sessions) {
        session.sendMessage(message);
      }
    } else {
      // For loop is quicker than Map if there is very few elements
      for (WebSocketSession session : sessions) {
        if (sessionUUID.equals(session.getUUID())) {
          session.sendMessage(message);
          break;
        }
      }
    }
  }

  /**
   * A websocket session.<br/>
   * Manage the various listener and callback associated to the channel.
   */
  class WebSocketSession {
    private final WebSocketChannel myChannel;
    private final UUID uuid = UUID.randomUUID();

    private final ChannelListener<WebSocketChannel> channelListener = new AbstractReceiveListener() {
      @Override
      protected void onFullTextMessage(WebSocketChannel channel, BufferedTextMessage message) throws IOException {
        String textMsg = message.getData(); // /!\ getData has to be called only once.
        if (LOGGER.isLoggable(Level.FINE)) {
          LOGGER.fine("FullTextMessage receive: " + textMsg);
        }
        ev3ActionProcessor.processMessage(uuid, textMsg);
        // channel.getIoThread();
        // channel.getWorker();
      };

      @Override
      protected void onClose(WebSocketChannel webSocketChannel, StreamSourceFrameChannel ssfchannel) throws IOException {
        LOGGER.info("onClose: " + this);
        myChannel.getReceiveSetter().set(null);
        unregisterSession(WebSocketSession.this);
        super.onClose(webSocketChannel, ssfchannel);
      }

      @Override
      protected void onError(WebSocketChannel webSocketChannel, Throwable error) {
        // Log performed in doOnError
        doOnError(webSocketChannel, error);
      }
    };

    private final WebSocketCallback<Void> sendCallback = new WebSocketCallback<Void>() {
      @Override
      public void onError(WebSocketChannel channel, Void context, Throwable throwable) {
        // WebSocket should be down - log performed in doOnError
        doOnError(channel, throwable);
      }

      @Override
      public void complete(WebSocketChannel channel, Void context) {
        // Ignore (all work as expected)
      }
    };

    public WebSocketSession(WebSocketChannel wsChannel, final EV3ActionProcessor ev3ActionProcessor) {
      myChannel = wsChannel;
      myChannel.getReceiveSetter().set(channelListener);
    }

    void doOnError(WebSocketChannel webSocketChannel, Throwable error) {
      LOGGER.log(Level.WARNING, "Error on websocket", error);
      try {
        myChannel.close();
      } catch (IOException ioe) {
        // Silently ignore this one, we are already in error
        LOGGER.log(Level.WARNING, "Exception while closing channel on error", ioe);
      } finally {
        unregisterSession(this);
      }
    }

    void sendMessage(String message) {
      WebSockets.sendText(message, myChannel, sendCallback);
    }

    UUID getUUID() {
      return uuid;
    }
  }
}
