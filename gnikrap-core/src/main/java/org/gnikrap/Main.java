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

import java.io.IOException;
import java.util.logging.Level;
import java.util.logging.Logger;

import org.gnikrap.utils.ApplicationContext;
import org.gnikrap.utils.Configuration;
import org.gnikrap.utils.LoggerUtils;

/**
 * The main entry point in order to launch the Gnikrap server. <br/>
 * 
 * <h3>Hereafter is some design choice/justifications made on Gnikrap</h3>
 * <p>
 * <h4>Security</h4>
 * This is not a concern within Gnikrap, we are making a code injection tool :-)
 * </p>
 * <p>
 * <h4>HTTP server</h4>
 * Undertow has been chosen because this is the only HTTP server with WebSocket support out of the box that I was able to run for more than a few minutes on the EV3 hardware with good performances. I
 * already run it for several hours without any impact on performance - ok with only one client, and a human-user activity (and not a test program injecting requests) but it's the "standard" use-case.
 * We have a LEGO brick not a server ;-).
 * </p>
 * <p>
 * Other server that has been tried:
 * <ul>
 * <li>The "bigs" (Tomcat and jetty) with default configuration (I'm not a ninja of the fine tuning of theses products) and after a few minutes, either there is an OutOfMemory exception either the
 * performances was really catastrophic (several minutes to load a static page of 10Kb).</li>
 * <li>Several "small" server, but there is a lot to write in order to server static pages, etc.. and small (in code/jar) don't means memory-lightweight nor fast</li>
 * <li>Another server give good results: org.apache.httpcomponents:httpcore:4.3. The only drawback with this one is that websocket isn't supported out of the box.</li>
 * </ul>
 * </p>
 * <p>
 * <h4>REST vs WebSocket</h4>
 * Initially I plan to write a "regular" REST API ... but ... I have serious performance issues. For our business case (a lot of call with very few data), http protocol add too much of "useless" data,
 * mainly in the http header (between 500 an 700 bytes both in the request and the answer). As a consequence, on the EV3 hardware I don't achieve to process http quick enough (about 10 json-REST-http
 * call by seconds can be processed). The solution to this problem is to move to a WebSocket API based on json messages. Here again, json has been preferred to XML because it is lighter and quicker to
 * process.
 * </p>
 * <p>
 * <h4>json parser</h4>
 * JSon comparison result on the EV3 hardware (JRE 1.7):
 * 
 * <pre>
 * minimal-json: 8415, jackson: 18096, gson: 12368, json-smart:8357
 * minimal-json: 2170, jackson: 3830, gson: 3804, json-smart:2581
 * minimal-json: 2094, jackson: 3608, gson: 3577, json-smart:2261
 * minimal-json: 2278, jackson: 4033, gson: 3774, json-smart:2378
 * minimal-json: 2048, jackson: 3597, gson: 3529, json-smart:2257
 * </pre>
 * 
 * Note:
 * <ul>
 * <li>Results on my laptop (JDK 1.7, Core i5, Windows 7) are completely different (jackson is the fastest followed by json-smart, minimal-json and gson. On a laptop, Jackson is 2 times faster than
 * minimal-json).</li>
 * <li>The test has been done on reading/writing 5000 messages: One line => reading/writing 1000 messages with each parser. The results of the first line are higher due to initializations. The
 * messages are representative of the message used by the gnikrap software (i.e. no high number of fields, no high number of "level", no several megabytes messages).</li>
 * </ul>
 * </p>
 * <p>
 * <h4>Threading</h4>
 * Gnikrap is made of 7 threads (and the JVM threads, GC, etc.):
 * <ul>
 * <li>Undertow (N)IO: 2 threads. This thread receive IO and also perform some non blocking processing</li>
 * <li>Undertow Worker Thread: 2 threads. These two threads are used while serving static pages. The rest of the time there are mainly idle.</li>
 * <li>Gnikrap Script Thread: This thread is used in order to run the script.</li>
 * <li>Gnikrap Processor: Process the action which can take time, also process all the outgoing messages.</li>
 * <li>leJOS screen manager: Process to refresh of the EV3 screen in an asynchronous way.</li>
 * </ul>
 * </p>
 * <p>
 * <h4>External library dependencies</h4>
 * A lot of libraries (spring, slf4j, etc.) exists and does useful things... but theses libraries are clearly not designed for an environment where the memory and CPU are <i>very</i> limited. So we
 * limit the dependencies to the minimum. While possible (eg. Logging, Javascript engine) the JDK classes are used, while not possible (like ApplicationContext/Configuration/etc.) a basic
 * implementation with the bare minimum needed by Gnikrap is implemented.
 * </p>
 */
public class Main {
  private static final Logger LOGGER = LoggerUtils.getLogger(Main.class);

  public static void main(String[] args) throws IOException {
    // Tech initialization
    ApplicationContext appContext = new ApplicationContext();
    LoggerUtils.initializeLogging();

    // Load configuration and init logs
    final Configuration configuration = Configuration.load(Main.class);
    appContext.registerObject(configuration);
    String defaultLogLevel = configuration.getValueAsString("DefaultLogLevel");
    LoggerUtils.setDefaultLogLevel(defaultLogLevel);
    LOGGER.config("Configuration loaded: " + configuration);

    // Init business stuff
    GnikrapApp gnikrap = new GnikrapApp(appContext);
    appContext.registerObject(gnikrap);

    // Start
    try {
      gnikrap.start();
      LOGGER.info("Gnikrap launched on port: " + gnikrap.getHttpPort() + ", wait a few seconds before connection");
    } catch (Exception ex) {
      LOGGER.log(Level.SEVERE, "Can't launch server", ex);
      try {
        gnikrap.stop();
      } catch (Exception ex2) {
        LOGGER.log(Level.SEVERE, "Can't stop server", ex);
        // Don't want to stop after a start error => Force JVM exit
        System.exit(0);
      }
    }
  }
}
