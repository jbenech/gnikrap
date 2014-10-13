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
package org.gnikrap.utils;

import java.io.FileReader;
import java.io.IOException;
import java.io.Reader;

import com.eclipsesource.json.JsonObject;
import com.eclipsesource.json.JsonValue;

/**
 * Basic configuration object (need: have an abstraction on the configuration). <br/>
 * Note: Not a "generic/powerfull" object, only what has been needed has been put here.
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
    JsonValue node = data.get(path);

    return (node == null ? defaultValue : node.asString());
  }

  public boolean getValueAsBoolean(String path) {
    return getValueAsBoolean(path, false);
  }

  public boolean getValueAsBoolean(String path, boolean defaultValue) {
    JsonValue node = data.get(path);

    return (node == null ? defaultValue : node.asBoolean());
  }

  public int getValueAsInt(String path) {
    return getValueAsInt(path, 0);
  }

  public int getValueAsInt(String path, int defaultValue) {
    JsonValue node = data.get(path);

    return (node == null ? defaultValue : node.asInt());
  }

  public static Configuration load(Class<?> clazzToConfigure) throws IOException {
    String defaultConfigurationFile = System.getProperty("user.dir") + "/" + clazzToConfigure.getName() + ".config";
    String configurationFile = System.getProperty("configurationFile", defaultConfigurationFile);
    try (Reader r = new FileReader(configurationFile)) {
      return new Configuration(JsonObject.readFrom(r));
    }
  }
}
