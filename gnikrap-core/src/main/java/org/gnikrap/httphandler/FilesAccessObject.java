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
package org.gnikrap.httphandler;

import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.Reader;
import java.io.StringWriter;
import java.nio.charset.Charset;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.logging.Logger;

import org.gnikrap.utils.LoggerUtils;

/**
 * Provide access to files in a folder
 */
public class FilesAccessObject {
  private static final Logger LOGGER = LoggerUtils.getLogger(FilesAccessObject.class);

  private static final Charset CHARSET = StandardCharsets.UTF_8;

  private final File dataFolder;

  public FilesAccessObject(String dataFolder) {
    this.dataFolder = new File(dataFolder);
    if (this.dataFolder.exists() == false) {
      this.dataFolder.mkdirs();
    }
  }

  public List<String> getFilesnames() {
    List<String> result = new ArrayList<String>();
    for (File f : dataFolder.listFiles()) {
      if (f.isFile()) {
        result.add(f.getName());
      }
    }
    return result;
  }

  /**
   * Checks if the provided filename is valid or not. Throws an exception if not valid.
   * 
   * @param filename the filename to check
   * @param readOnly does the check for read-only files has to be done ?
   * 
   * @throws IOException thrown if the filename is not valid
   */
  public void checkFilename(String filename, boolean readOnly) throws IOException {
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
   * Returns true if the file has been deleted, false otherwise.
   */
  public boolean delete(String filename) {
    String storageFilename = getStorageFilename(filename);

    File f = new File(storageFilename);
    if (f.exists() && f.delete() == false) {
      LOGGER.warning("can't delete file: '" + storageFilename + "'");
      return false;
    }

    return true;
  }

  /**
   * Not really clean: Assume that there is no big files.
   */
  public String loadFile(String filename) throws IOException {
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

      return sw.toString();
    }
  }
}
