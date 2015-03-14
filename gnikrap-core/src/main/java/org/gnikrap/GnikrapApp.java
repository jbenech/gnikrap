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
package org.gnikrap;

import static io.undertow.Handlers.path;
import static io.undertow.Handlers.resource;
import static io.undertow.Handlers.websocket;
import io.undertow.Undertow;
import io.undertow.server.handlers.resource.FileResourceManager;

import java.io.File;

import org.gnikrap.httphandler.FilesHttpHandler;
import org.gnikrap.script.EV3ActionProcessor;
import org.gnikrap.script.FakeEV3ExecutionManager;
import org.gnikrap.script.ScriptExecutionManager;
import org.gnikrap.script.actions.RunScript;
import org.gnikrap.script.actions.SetXSensorValue;
import org.gnikrap.script.actions.ShutdownBrick;
import org.gnikrap.script.actions.StopGnikrap;
import org.gnikrap.script.actions.StopScript;
import org.gnikrap.utils.ApplicationContext;
import org.gnikrap.utils.Configuration;

/**
 * A class that is able to build/start/stop Gnikrap application.
 */
public class GnikrapApp {
  private final ApplicationContext appContext;
  private Undertow server;
  private EV3ActionProcessor actionProcessor;
  private ScriptExecutionManager scriptExecutionManager;
  private int httpPort;
  private boolean alreadyStopped = false;

  /**
   * Build a new Gnikrap application.
   */
  public GnikrapApp(ApplicationContext context) {
    this.appContext = context;
    buildActionProcessor();
    buildHttpServer();
  }

  private void buildActionProcessor() {
    Configuration config = appContext.getObject(Configuration.class);
    boolean fakeEV3 = config.getValueAsBoolean("FakeEV3", false);

    if (fakeEV3) {
      scriptExecutionManager = new FakeEV3ExecutionManager(appContext);
    } else {
      scriptExecutionManager = new ScriptExecutionManager(appContext);
    }
    appContext.registerObject(scriptExecutionManager);

    actionProcessor = new EV3ActionProcessor(appContext);
    appContext.registerObject(actionProcessor);

    // Register actions
    actionProcessor.registerActionMessageProcessor(new RunScript());
    actionProcessor.registerActionMessageProcessor(new StopScript());
    actionProcessor.registerActionMessageProcessor(new SetXSensorValue());
    actionProcessor.registerActionMessageProcessor(new ShutdownBrick());
    actionProcessor.registerActionMessageProcessor(new StopGnikrap(appContext));
  }

  private void buildHttpServer() {
    // Load config
    Configuration config = appContext.getObject(Configuration.class);
    String webContentFolder = config.getValueAsString("WebContent");
    String scriptsFolder = config.getValueAsString("ScriptsFolder");
    String keyboardFolder = config.getValueAsString("xKeyboardFolder");
    httpPort = config.getValueAsInt("HttpPort", 8080);

    // Init web-socket callback
    EV3SriptCommandSocketConnectionCallback myWsCC = new EV3SriptCommandSocketConnectionCallback(appContext);
    appContext.registerObject(myWsCC);
    // TODO Import/Export web service

    // Launch server
    server = Undertow.builder().addHttpListener(httpPort, "0.0.0.0").setHandler( //
        path() //
            // ////////////////////////////////////
            .addPrefixPath("/ws/gnikrap/script", websocket(myWsCC)) //
            .addPrefixPath("/rest/scriptfiles", new FilesHttpHandler(scriptsFolder)) //
            .addPrefixPath("/rest/xkeyboardfiles", new FilesHttpHandler(keyboardFolder))
            // ////////////////////////////////////
            .addPrefixPath("/", resource(new FileResourceManager(new File(webContentFolder), 4096)). //
                setWelcomeFiles("index.html").setDirectoryListingEnabled(false))) //
        // ////////////////////////////////////
        .setWorkerThreads(2).setIoThreads(2) //
        // .setSocketOption(Options.BALANCING_TOKENS, 0) //
        .build();
  }

  public int getHttpPort() {
    return httpPort;
  }

  /**
   * Start Gnikrap
   */
  public void start() {
    if (alreadyStopped) {
      throw new IllegalStateException("Can't start a GnikrapApp that has already been stopped");
    }
    scriptExecutionManager.start();
    actionProcessor.start();
    server.start();
  }

  /**
   * Stop Gnikrap
   */
  public void stop() {
    alreadyStopped = true;
    actionProcessor.stop();
    server.stop();
    scriptExecutionManager.stopScript();
  }
}
