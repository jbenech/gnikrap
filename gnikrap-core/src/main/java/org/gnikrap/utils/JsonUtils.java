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
import java.util.Arrays;
import java.util.Collection;
import java.util.HashMap;
import java.util.List;
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

  /**
   * @return a {@link String} value if the {@link JsonValue} is of type String, null otherwise.
   */
  public static String safeAsString(JsonValue v) {
    if ((v != null) && v.isString()) {
      return v.asString();
    }
    return null;
  }

  /**
   * @return a {@code String[]} value if the {@link JsonValue} is an array, null otherwise.
   */
  public static String[] safeAsStringArray(JsonValue v) {
    if ((v != null) && v.isArray()) {
      JsonArray array = v.asArray();
      String[] result = new String[array.size()];
      for (int i = array.size() - 1; i >= 0; i--) {
        result[i] = safeAsString(array.get(i));
      }
      return result;
    }
    return null;
  }

  /**
   * The aim of the method is to avoid multiple copy (while increasing the size of the buffer) of the data by preallocating a buffer large enough to store all the data.
   */
  public static String toString(JsonValue json, int maxExpectedSize) {
    try (StringWriter sw = new StringWriter(maxExpectedSize)) {
      json.writeTo(sw);
      return sw.toString();
    } catch (IOException ioe) {
      // StringWriter don't throw IOException
      LOGGER.log(Level.WARNING, "Error writing Json", ioe);
      throw new RuntimeException(ioe);
    }
  }

  /**
   * Deeply convert the JsonValue to something more "javaic". The returned object can be a simple type ({@link String}, {@link Boolean}, {@link Float} or {@link Integer}), or complex object (Object
   * arrays or {@link Map}).
   */
  public static Object toObject(JsonValue json) {
    // Try to process from more to less common
    if (json.isString()) {
      return json.asString();
    }
    if (json.isNumber()) {
      String number = json.toString();
      if (number.indexOf('.') == -1) { // indexOf has an optimized version for char (while contains process only String)
        return new Integer(json.asInt()); // Use Integer as EV3 is 32bit
      } else {
        return new Float(json.asFloat()); // Use Float as EV3 is 32bit
      }
    }
    if (json.isObject()) {
      JsonObject object = json.asObject();
      Map<String, Object> map = new HashMap<String, Object>(object.size());
      for (String f : object.names()) {
        map.put(f, toObject(object.get(f)));
      }
    }
    if (json.isArray()) {
      List<JsonValue> values = json.asArray().values();
      Object[] array = new Object[values.size()];
      for (int i = array.length - 1; i >= 0; i--) {
        array[i] = toObject(values.get(i));
      }
    }

    if (json.isTrue()) {
      return Boolean.TRUE;
    }
    if (json.isFalse()) {
      return Boolean.FALSE;
    }
    // if (json.isNull()) {
    return null;
    // }
  }

  /**
   * Build JsonValue from simple types ({@link String}, {@link Boolean}, {@link Float}, {@link Double}, {@link Long} or {@link Integer}) or complex types ({@link Map}, {@link Collection} or arrays).
   */
  public static JsonValue toJson(Object obj) {
    if (obj == null) {
      return JsonValue.NULL;
    }
    if (obj instanceof Collection<?>) {
      Collection<?> col = (Collection<?>) obj;
      JsonArray result = new JsonArray();
      for (Object o : col) {
        result.add(toJson(o));
      }
      return result;
    }
    if (obj instanceof Map) {
      Map<?, ?> map = (Map<?, ?>) obj;
      JsonObject object = new JsonObject();
      for (Object key : map.keySet()) {
        object.add(String.valueOf(key), toJson(map.get(key)));
      }
      return object;
    }
    if (obj.getClass().isArray()) { // TODO check if primitive type are wrapped ?
      return toJson(Arrays.asList((Object[]) obj));
    }
    if (obj instanceof String) {
      return JsonValue.valueOf((String) obj);
    }
    if (obj instanceof Integer) {
      return JsonValue.valueOf((Integer) obj);
    }
    if (obj instanceof Float) {
      return JsonValue.valueOf((Float) obj);
    }
    if (obj instanceof Long) {
      return JsonValue.valueOf((Long) obj);
    }
    if (obj instanceof Double) {
      return JsonValue.valueOf((Double) obj);
    }
    if (obj instanceof Boolean) {
      return JsonValue.valueOf((Boolean) obj);
    }

    // TODO Process other objects as beans if needed
    throw new IllegalStateException("Can convert only raw types, Arrays, Maps and List to Json");
  }
}
