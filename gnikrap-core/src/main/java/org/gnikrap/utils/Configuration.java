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
package org.gnikrap.utils;

import java.io.File;
import java.io.FileReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.Reader;

import com.eclipsesource.json.JsonObject;

/**
 * Basic configuration object (need: have an abstraction on the configuration). <br/>
 * 
 * Note: Not a "generic/powerful" object, only what has been needed has been put here.
 */
public final class Configuration {
  private final JsonObject data;

  private Configuration(JsonObject data) {
    this.data = data;
  }

  public String getValueAsString(String path) {
    return getValueAsString(path, null);
  }

  public String getValueAsString(String path, String defaultValue) {

    return data.getString(path, defaultValue);
  }

  public boolean getValueAsBoolean(String path) {
    return getValueAsBoolean(path, false);
  }

  public boolean getValueAsBoolean(String path, boolean defaultValue) {
    return data.getBoolean(path, defaultValue);
  }

  public int getValueAsInt(String path) {
    return getValueAsInt(path, 0);
  }

  public int getValueAsInt(String path, int defaultValue) {
    return data.getInt(path, defaultValue);
  }

  @Override
  public String toString() {
    return "Configuration: " + data.toString();
  }

  /**
   * Load the configuration file which have the name of the package.class in the following order:
   * <ul>
   * <li>File in the current folder: <user.dir></li>
   * <li>If not found: look at <user.home>/.gnikrap/</li>
   * <li>If not found: look in root classpath</li>
   * <ul>
   */
  public static Configuration load(Class<?> clazzToConfigure) throws IOException {
    String shortFileName = clazzToConfigure.getName() + ".config";
    String configurationFile = System.getProperty("user.dir") + "/" + shortFileName;

    if (new File(configurationFile).exists() == false) {
      configurationFile = System.getProperty("user.home") + "/.gnikrap/" + shortFileName;
    }

    if (new File(configurationFile).exists()) {
      try (Reader r = new FileReader(configurationFile)) {
        return new Configuration(JsonObject.readFrom(r));
      }
    } else {
      InputStream is = Configuration.class.getResourceAsStream("/" + shortFileName);
      if (is != null) {
        return new Configuration(JsonObject.readFrom(new InputStreamReader(is)));
      } else {
        throw new IOException("No configuration file found for: '" + shortFileName + "'");
      }
    }
  }
}
