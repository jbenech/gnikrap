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
package org.gnikrap.httphandler;

import io.undertow.server.HttpHandler;
import io.undertow.server.HttpServerExchange;
import io.undertow.util.Headers;
import io.undertow.util.HttpString;
import io.undertow.util.Methods;

import java.io.BufferedOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.util.HashMap;
import java.util.Map;
import java.util.logging.Level;
import java.util.logging.Logger;
import java.util.zip.Deflater;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;

import org.gnikrap.utils.LoggerUtils;

/**
 * Enable to import/export some sets of files.
 * 
 * <pre>
 * TODO Make NIO compliant (see exchange.dispatch(runnable); ?)
 * </pre>
 */
public class ImportExportHttpHandler implements HttpHandler {
  private static final Logger LOGGER = LoggerUtils.getLogger(ImportExportHttpHandler.class);

  // Key and File
  private final Map<String, File> dataFolder = new HashMap<String, File>();

  public ImportExportHttpHandler(Map<String, String> dataFolder) {
    for (String key : dataFolder.keySet()) {
      this.dataFolder.put(key, new File(dataFolder.get(key)));
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
          doReturnZipFile(exchange);
        } else if (method == Methods.POST) {
          doReceiveZipFile(exchange);
        } else {
          doNotSupported(exchange);
        }
      }
    } catch (IOException ioe) {
      LOGGER.log(Level.WARNING, "Can't read file: '" + relativePath + "'", ioe);
      exchange.setResponseCode(404); // Not found
    }
    // exchange.endExchange();
  }

  /**
   * For not supported methods.
   */
  private void doNotSupported(HttpServerExchange exchange) {
    exchange.setResponseCode(404); // Not found
    exchange.getResponseHeaders().put(Headers.CONTENT_TYPE, "text/plain");
    exchange.getResponseSender().send("Method: " + exchange.getRequestMethod() + " not supported on resource: '" + exchange.getRequestURI() + "'");
  }

  private void doReturnZipFile(HttpServerExchange exchange) throws IOException {
    exchange.startBlocking();
    exchange.setResponseCode(200);
    exchange.getResponseHeaders().put(Headers.CONTENT_TYPE, "application/zip");

    // Zip the files within a zip stream
    try (ZipOutputStream zos = new ZipOutputStream(new BufferedOutputStream(exchange.getOutputStream(), 1024))) {
      zos.setMethod(ZipOutputStream.DEFLATED);
      zos.setLevel(Deflater.NO_COMPRESSION); // Deflater.BEST_SPEED

      for (String key : dataFolder.keySet()) {
        File folder = dataFolder.get(key);
        for (File ff : folder.listFiles()) {
          addFile(ff, key + "/" + ff.getName(), zos);
        }
      }

      zos.finish();
    }
    // TODO Check that the stream is ok on the client ?
    // exchange.endExchange();
  }

  private void addFile(File fileToAdd, String zipFileName, ZipOutputStream zos) throws IOException {
    try (FileInputStream fis = new FileInputStream(fileToAdd)) {
      // Add an entry to the zip archive
      ZipEntry zipEntry = new ZipEntry(zipFileName);
      zos.putNextEntry(zipEntry);
      // Copy data
      int size = 0;
      byte[] buffer = new byte[4096];
      while ((size = fis.read(buffer)) > 0) {
        zos.write(buffer, 0, size);
      }
      zos.closeEntry();
    }
  }

  private void doReceiveZipFile(HttpServerExchange exchange) throws IOException {
    // See DownloadRequestExecutorASImpl
  }
}
