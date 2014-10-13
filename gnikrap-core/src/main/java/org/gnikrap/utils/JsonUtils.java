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

import java.io.IOException;
import java.io.StringWriter;
import java.util.ArrayList;
import java.util.Map;
import java.util.logging.Level;
import java.util.logging.Logger;

import org.gnikrap.script.EV3ActionProcessor;

import com.eclipsesource.json.JsonArray;
import com.eclipsesource.json.JsonObject;
import com.eclipsesource.json.JsonValue;

public final class JsonUtils {

  private static final Logger LOGGER = LoggerUtils.getLogger(EV3ActionProcessor.class);

  private JsonUtils() {
    // Avoid instantiation
  }

  public static JsonValue toJsonObject(Map<String, String> data) {
    if (data != null) {
      JsonObject result = new JsonObject();
      for (Map.Entry<String, String> me : data.entrySet()) {
        result.add(me.getKey(), me.getValue());
      }
      return result;
    } else {
      return JsonValue.NULL;
    }
  }

  public static JsonValue toJsonArray(String[] data) {
    if (data != null) {
      JsonArray result = new JsonArray();
      for (String s : data) {
        result.add(s);
      }
      return result;
    } else {
      return JsonValue.NULL;
    }
  }

  public static String safeAsString(JsonValue v) {
    if ((v != null) && v.isString()) {
      return v.asString();
    }
    return null;
  }

  public static String[] safeAsStringArray(JsonValue v) {
    if ((v != null) && v.isArray()) {
      ArrayList<String> temp = new ArrayList<>();
      for (JsonValue i : (JsonArray) v) {
        temp.add(safeAsString(i));
      }
      return temp.toArray(new String[temp.size()]);
    }
    return null;
  }

  public static String toString(JsonValue json, int expectedSize) {
    try (StringWriter sw = new StringWriter(expectedSize)) {
      json.writeTo(sw);
      return sw.toString();
    } catch (IOException ioe) {
      // StringWriter don't throw IOException
      LOGGER.log(Level.WARNING, "Error wroiting Json", ioe);
      throw new RuntimeException(ioe);
    }
  }
}
