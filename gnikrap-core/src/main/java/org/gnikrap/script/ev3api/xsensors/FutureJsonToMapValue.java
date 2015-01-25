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
package org.gnikrap.script.ev3api.xsensors;

import java.util.Collection;
import java.util.Collections;
import java.util.Map;
import java.util.Set;

import org.gnikrap.utils.JsonUtils;

import com.eclipsesource.json.JsonObject;
import com.eclipsesource.json.JsonValue;

/**
 * Convert the json to a {@link Map}<{@link String}, {@link Object}> {@link XSensorValue}.
 */
public class FutureJsonToMapValue extends AbstractFutureJsonToXSensorValue {

  public FutureJsonToMapValue(JsonValue rawValue) {
    super(rawValue);
  }

  @Override
  protected XSensorValue buildValue(JsonObject rawValue) {
    return new MapXSensorValue(rawValue);
  }

  public static final class MapXSensorValue extends XSensorValue implements Map<String, Object> {

    private final Map<String, Object> delegate;

    MapXSensorValue(JsonObject raw) {
      super(raw.get(JSonXSensorMessageFields.IS_STARTED).asBoolean());
      delegate = Collections.unmodifiableMap((Map) JsonUtils.toObject(raw)); // JsonObject is converted to a Map
    }

    @Override
    public int size() {
      return delegate.size();
    }

    @Override
    public boolean isEmpty() {
      return delegate.isEmpty();
    }

    @Override
    public boolean containsKey(Object key) {
      return delegate.containsKey(key);
    }

    @Override
    public boolean containsValue(Object value) {
      return delegate.containsValue(value);
    }

    @Override
    public Object get(Object key) {
      return delegate.get(key);
    }

    @Override
    public Object put(String key, Object value) {
      // Read only => Does nothing
      return null;
    }

    @Override
    public Object remove(Object key) {
      // Read only => Does nothing
      return null;
    }

    @Override
    public void putAll(Map<? extends String, ? extends Object> m) {
      // Read only => Does nothing
    }

    @Override
    public void clear() {
      // Read only => Does nothing
    }

    @Override
    public Set<String> keySet() {
      return delegate.keySet();
    }

    @Override
    public Collection<Object> values() {
      return delegate.values();
    }

    @Override
    public Set<java.util.Map.Entry<String, Object>> entrySet() {
      return delegate.entrySet();
    }
  }
}
