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

import java.util.HashMap;
import java.util.Iterator;
import java.util.Map;

import com.eclipsesource.json.JsonObject;
import com.eclipsesource.json.JsonValue;

/**
 * Convert the json raw value to an XTouch sensor value.
 */
public class FutureJsonToXTouchValue extends AbstractFutureJsonToXSensorValue {

  public FutureJsonToXTouchValue(JsonValue rawValue) {
    super(rawValue);
  }

  @Override
  protected XSensorValue buildValue(JsonObject rawValue) {
    return new XTouchValue(rawValue);
  }

  public static final class XTouchValue extends XSensorValue {
    private final Map<String, XTouch> touches = new HashMap<String, XTouch>();

    XTouchValue(JsonObject raw) {
      super(raw.get(JSonXSensorMessageFields.IS_STARTED).asBoolean());
      if (isStarted()) {
        JsonObject rawTouchs = raw.get(JSonXSensorMessageFields.XTOUCH_TOUCHS).asObject();
        for (String t : rawTouchs.names()) {
          touches.put(t, new XTouch(t, rawTouchs.get(t).asInt()));
        }
      }
    }

    /**
     * @return true if the touch with the given name is currently active ?
     */
    public boolean containsTouch(String name) {
      return touches.containsKey(name);
    }

    /**
     * @return the touch with the given name.
     */
    public XTouch getTouch(String name) {
      return touches.get(name);
    }

    /**
     * @return the list of the currently active touch.
     */
    public XTouch[] getTouches() {
      return touches.values().toArray(new XTouch[touches.size()]);
    }

    @Override
    public String toString() {
      StringBuilder sb = new StringBuilder(256);
      sb.append("{isStarted: ").append(isStarted()).append(", touches: [");
      for (Iterator<String> it = touches.keySet().iterator(); it.hasNext();) {
        sb.append(touches.get(it.next()));
        if (it.hasNext()) {
          sb.append(", ");
        }
      }
      return sb.append("]}").toString();
    }
  }

  public static final class XTouch {
    private final String name;
    private final int hits;

    XTouch(String name, int hits) {
      this.name = name;
      this.hits = hits;
    }

    public String getName() {
      return name;
    }

    // public boolean isActive() {
    // return (hits > 0);
    // }

    public int getHits() {
      return hits;
    }

    @Override
    public String toString() {
      return "{name: \"" + getName() + "\", hits: " + getHits() + "}";
    }
  }
}
