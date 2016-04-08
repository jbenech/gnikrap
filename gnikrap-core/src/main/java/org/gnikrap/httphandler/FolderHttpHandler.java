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
package org.gnikrap.httphandler;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.OutputStreamWriter;
import java.io.Reader;
import java.io.StringWriter;
import java.io.Writer;
import java.nio.charset.Charset;
import java.nio.charset.StandardCharsets;
import java.util.logging.Level;
import java.util.logging.Logger;

import org.gnikrap.utils.JsonUtils;
import org.gnikrap.utils.LoggerUtils;

import com.eclipsesource.json.JsonArray;
import com.eclipsesource.json.JsonObject;
import com.eclipsesource.json.JsonValue;

import io.undertow.server.HttpHandler;
import io.undertow.server.HttpServerExchange;
import io.undertow.util.Headers;
import io.undertow.util.HttpString;
import io.undertow.util.Methods;
import io.undertow.util.StatusCodes;

/**
 * Enable to manage a folder and containing files as a REST resource.
 * 
 * <pre>
 * TODO Make NIO compliant (see exchange.dispatch(runnable); ?)
 * </pre>
 */
public class FolderHttpHandler implements HttpHandler {
  private static final Logger LOGGER = LoggerUtils.getLogger(FolderHttpHandler.class);

  private static final Charset CHARSET = StandardCharsets.UTF_8;

  private final FilesAccessObject fao;
  private final File dataFolder;

  public FolderHttpHandler(String dataFolder) {
    fao = new FilesAccessObject(dataFolder);
    this.dataFolder = new File(dataFolder);
    if (this.dataFolder.exists() == false) {
      this.dataFolder.mkdirs();
    }
  }

  @Override
  public void handleRequest(HttpServerExchange exchange) throws Exception {
    String relativePath = exchange.getRelativePath();
    HttpString method = exchange.getRequestMethod();
    try {
      if (relativePath.length() == 0 || relativePath.equals("/")) {
        // Operations on the collection
        if (method == Methods.GET) {
          doReturnListOfFiles(exchange);
        } else if (method == Methods.POST) {
          doCreateOrReplaceAFile(exchange, true);
        } else {
          doNotSupported(exchange);
        }
      } else {
        // Operation on the item
        if (method == Methods.GET) {
          doReturnAFile(exchange);
        } else if (method == Methods.PUT) {
          doCreateOrReplaceAFile(exchange, false);
        } else if (method == Methods.DELETE) {
          doDeleteAFile(exchange);
        } else {
          doNotSupported(exchange);
        }
      }
    } catch (IOException ioe) {
      LOGGER.log(Level.WARNING, "Can't read file: '" + relativePath + "'", ioe);
      exchange.setResponseCode(StatusCodes.NOT_FOUND);
      exchange.endExchange();
    }
  }

  /**
   * For not supported methods.
   */
  private void doNotSupported(HttpServerExchange exchange) {
    exchange.setResponseCode(404); // Not found
    exchange.getResponseHeaders().put(Headers.CONTENT_TYPE, "text/plain");
    exchange.getResponseSender().send("Method: " + exchange.getRequestMethod() + " not supported on resource: '" + exchange.getRequestURI() + "'");
    exchange.endExchange();
  }

  /**
   * Delete a file<br/>
   * Note: Don't expect data on this item
   */
  private void doDeleteAFile(HttpServerExchange exchange) throws IOException {
    // TODO IO => should be done in worker thread
    fao.delete(exchange.getRelativePath());
    exchange.setResponseCode(200);
  }

  /**
   * Load a file
   */
  private void doReturnAFile(HttpServerExchange exchange) throws IOException {
    String filename = getAndCheckFilename(exchange, true);
    String storageFilename = getStorageFilename(filename);
    LOGGER.info("Reading file: '" + storageFilename + "'");

    // Load file in memory
    try (Reader isr = new InputStreamReader(new FileInputStream(storageFilename), CHARSET); //
        StringWriter sw = new StringWriter(8196)) {
      char[] buf = new char[1024];
      int read;
      while ((read = isr.read(buf)) != -1) {
        sw.write(buf, 0, read);
      }

      DataFile sf = new DataFile(exchange.getRelativePath(), sw.toString(), null);

      String data = sf.toJson().toString(); // Must be done before setResponseCode
      exchange.setResponseCode(200);
      exchange.getResponseSender().send(data);
      exchange.getResponseHeaders().put(Headers.CONTENT_TYPE, "text/plain");
    }

    // final String filename = exchange.getRelativePath();
    // final FileChannel fileChannel = exchange.getConnection().getWorker().getXnio() //
    // .openFile(new File(dataFolder, filename), FileAccess.READ_ONLY);
    //
    // exchange.getResponseSender().transferFrom(fileChannel, new IoCallback() {
    // @Override
    // public void onException(HttpServerExchange exchange, Sender sender, IOException exception) {
    // LOGGER.warning("Exception while reading the file: '" + filename + "'");
    // IoUtils.safeClose(fileChannel);
    // if (!exchange.isResponseStarted()) {
    // exchange.setResponseCode(StatusCodes.INTERNAL_SERVER_ERROR);
    // }
    // exchange.endExchange();
    // }
    //
    // @Override
    // public void onComplete(HttpServerExchange exchange, Sender sender) {
    // IoUtils.safeClose(fileChannel);
    // if (!exchange.isResponseStarted()) {
    // exchange.setResponseCode(200);
    // }
    // exchange.getResponseHeaders().put(Headers.CONTENT_TYPE, "text/plain");
    // exchange.endExchange();
    // }
    // });
  }

  private void doCreateOrReplaceAFile(HttpServerExchange exchange, boolean create) throws IOException {
    // Read data from the input stream
    exchange.startBlocking();

    InputStreamReader r = new InputStreamReader(exchange.getInputStream(), StandardCharsets.UTF_8); // TODO use HTTP header
    DataFile sf = DataFile.fromJson(JsonObject.readFrom(r));

    // Compute filename
    String filename;
    if (create) {
      filename = getAndCheckFilename(exchange, false);
    } else {
      filename = sf.name;
      checkFilename(filename, false);
    }

    String storageFilename = getStorageFilename(filename);
    LOGGER.info("Writing file: '" + storageFilename + "'");

    try (Writer osw = new OutputStreamWriter(new FileOutputStream(storageFilename), CHARSET)) {
      osw.write(sf.content);
      exchange.setResponseCode(200);
    }
  }

  private String getAndCheckFilename(HttpServerExchange exchange, boolean readOnly) throws IOException {
    String result = exchange.getRelativePath(); // Like: "/myFile.js"
    while (result.length() > 0 && result.charAt(0) == '/') {
      result = result.substring(1);
    }
    checkFilename(result, readOnly);
    return result;
  }

  private void checkFilename(String filename, boolean readOnly) throws IOException {
    String fn = filename.trim();
    if (fn.isEmpty() || fn.contains("..") || fn.contains("/") || fn.contains("\\")) {
      throw new IOException("Filename '" + filename + "' is not valid");
    }
    if (readOnly == false && fn.startsWith("__")) {
      throw new IOException("Filename starting with '__' are read only");
    }
  }

  private String getStorageFilename(String filename) {
    return dataFolder + File.separator + filename.trim();
  }

  /**
   * Returns the list of files
   */
  private void doReturnListOfFiles(final HttpServerExchange exchange) throws Exception {
    // HttpHandler dispatchTask = new HttpHandler() {
    // @Override
    // public void handleRequest(HttpServerExchange exchange) throws Exception {
    JsonArray fileList = new JsonArray();
    for (File f : fao.listFiles()) {
      fileList.add(new DataFile(f.getName(), null, null).toJson());
    }

    String data = JsonUtils.writeToString(fileList, 1024); // Must be done before setResponseCode
    exchange.setResponseCode(200);
    exchange.getResponseSender().send(data);
    exchange.getResponseHeaders().put(Headers.CONTENT_TYPE, "application/json");
    // }
    // };
    // dispatchToIOThread(exchange, dispatchTask);
  }

  // private void dispatchToIOThread(HttpServerExchange exchange, HttpHandler task) throws Exception {
  // if (exchange.isInIoThread()) {
  // task.handleRequest(exchange);
  // } else {
  // exchange.dispatch(task);
  // }
  // }

  /**
   * A file that contains data
   */
  static class DataFile {
    final String name;
    final String content;
    final String[] tags; // TODO: Currently not implemented

    public DataFile(String name, String content, String[] tags) {
      this.name = name;
      this.content = content;
      this.tags = tags;
    }

    public JsonValue toJson() {
      return new JsonObject() //
          .add("name", name).add("content", content) //
          .add("tags", JsonUtils.toJson(tags));
    }

    public static DataFile fromJson(JsonObject json) {
      return new DataFile(JsonUtils.toPrimitive(json.get("name"), String.class), //
          JsonUtils.toPrimitive(json.get("content"), String.class), //
          JsonUtils.safeAsStringArray(json.get("tag")));
    }

    @Override
    public String toString() {
      return "ScriptFile" + toJson();
    }
  }
}
