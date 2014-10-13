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
package org.gnikrap;

import static io.undertow.Handlers.path;
import static io.undertow.Handlers.resource;
import static io.undertow.Handlers.websocket;
import io.undertow.Undertow;
import io.undertow.server.handlers.resource.FileResourceManager;

import java.io.File;
import java.io.IOException;

import org.gnikrap.script.EV3ActionProcessor;
import org.gnikrap.script.FakeEV3ExecutionManager;
import org.gnikrap.script.actions.RunScript;
import org.gnikrap.script.actions.StopScript;
import org.gnikrap.utils.Configuration;
import org.gnikrap.utils.LoggerUtils;

/**
 * The main entry point in order to launch the gnikrap server. <br/>
 * <i>Note: Security is not a concern within gnikrap: We are making a code injection tool :-)</i>
 * 
 * <h3>Hereafter is some design choice justifications</h3>
 * <hr>
 * <p>
 * Undertow has been chosen because this is the only HTTP server with WebSocket out of the box that I was able to run for several minutes on the EV3 hardware with good performances. I already run it
 * for several hours without any impact on performance - ok with only one client, and a human-user activity (and not a test program injecting requests) but it's the "standard" use-case and this is a
 * LEGO brick not a server ;-).
 * </p>
 * <p>
 * Other server has been tried:
 * <ul>
 * <li>the other "bigs" (Tomcat and jetty) with default configuration (I'm not a ninja of the fine tuning of theses producst) and after a few minutes, either there is an OutOfMemory exception either
 * the performances was too bad (several minutes to load a static page of less than 100Kb).</li>
 * <li>Several "small" server, but there is a lot to write in order to server static pages, etc.. and small (in code/jar) don't means "lightweight"</li>
 * <li>Another server give good results is: org.apache.httpcomponents:httpcore:4.3. The only drawback with this one is that websocket are not supported.</li>
 * </ul>
 * </p>
 * <hr>
 * <p>
 * REST vs WebSocket. Initially I plan to write a "regular" REST API ... but ... I have serious performance issues. For our business case (a lot of call with very few data), http protocol add too much
 * of "useless" data, mainly in the http header (between 500 an 700 bytes both in the request and the answer). As a consequence, on the EV3 hardware I don't achieve to process enough http call by
 * second. The solution to this problem is to move to a WebSocket API based on json messages. Here again, json has been prefered to XML because it is lighter and quicker to process.
 * </p>
 * <hr>
 * <p>
 * JSon comparison result on the EV3 hardware (JRE 1.7):
 * 
 * <pre>
 * mini: 8415, jackson: 18096, gson: 12368, smart:8357
 * mini: 2170, jackson: 3830, gson: 3804, smart:2581
 * mini: 2094, jackson: 3608, gson: 3577, smart:2261
 * mini: 2278, jackson: 4033, gson: 3774, smart:2378
 * mini: 2048, jackson: 3597, gson: 3529, smart:2257
 * </pre>
 * 
 * Note:
 * <ul>
 * <li>Results on my laptop (JDK 1.7, Core i5, Windows 7) are completely different (jackson is the fastest followed by smart, mini and gson. On a laptop, Jackson is 2 times faster than minimal-json).</li>
 * <li>The test has been done on reading/writing 5000 messages: One line => reading/writing 1000 messages with each parser. The results of the first line are higher due to initializations. The
 * messages are representative of the message used by the gnikrap software (i.e. not a high number of fields, no high number of "level").</li>
 * </ul>
 * </p>
 */
public class Main {

  public static void main(String[] args) throws IOException {
    // Tech init
    LoggerUtils.initializeLogging();

    // Load configuration
    final Configuration configuration = Configuration.load(Main.class);
    String webContentFolder = configuration.getValueAsString("WebContent");
    boolean fakeEV3 = configuration.getValueAsBoolean("FakeEV3", false);
    String scriptsFolder = configuration.getValueAsString("ScriptsFolder");
    int httpPort = configuration.getValueAsInt("HttpPort", 8080);

    // Init business stuff
    EV3ActionProcessor actionProcessor = buildActionProcessor(fakeEV3);
    EV3SriptCommandSocketConnectionCallback myWsCC = new EV3SriptCommandSocketConnectionCallback(actionProcessor);
    // TODO EV3REmoteSensorSocketConnectionCallback
    // TODO Import/Export web service
    actionProcessor.setRemoteControlService(myWsCC);

    // Launch server
    Undertow server = Undertow.builder().addHttpListener(httpPort, "0.0.0.0").setHandler( //
        path() //
            // ////////////////////////////////////
            .addPrefixPath("/ws/gnikrap/script", websocket(myWsCC)) //
            .addPrefixPath("/rest/scriptfiles", new FilesHttpHandler(scriptsFolder))
            // ////////////////////////////////////
            .addPrefixPath("/", resource(new FileResourceManager(new File(webContentFolder), 4096)). //
                setWelcomeFiles("index.html").setDirectoryListingEnabled(false))) //
        // ////////////////////////////////////
        .setWorkerThreads(2).setIoThreads(2) //
        // .setSocketOption(Options.BALANCING_TOKENS, 0) //
        .build();

    server.start();
  }

  private static EV3ActionProcessor buildActionProcessor(final boolean fakeEV3) {
    EV3ActionProcessor actionProcessor = new EV3ActionProcessor();
    if (fakeEV3) {
      actionProcessor.setContext(new FakeEV3ExecutionManager());
    }
    // Register actions
    actionProcessor.registerActionMessageProcessor("runScript", new RunScript());
    actionProcessor.registerActionMessageProcessor("stopScript", new StopScript());

    return actionProcessor;
  }
}
