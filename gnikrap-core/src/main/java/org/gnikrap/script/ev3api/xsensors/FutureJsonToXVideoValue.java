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

import org.gnikrap.utils.ScriptApi;

import com.eclipsesource.json.JsonObject;
import com.eclipsesource.json.JsonValue;

/**
 * Convert the json raw value to an XVideo sensor value.
 */
public class FutureJsonToXVideoValue extends AbstractFutureJsonToXSensorValue {

  public FutureJsonToXVideoValue(JsonValue rawValue) {
    super(rawValue);
  }

  @Override
  protected XSensorValue buildValue(JsonObject rawValue) {
    return new XVideoValue(rawValue);
  }

  public static final class XVideoValue extends XSensorValue {
    @ScriptApi
    public static final int VIDEO_WIDTH = 640;
    @ScriptApi
    public static final int VIDEO_HEIGHT = 480;

    private final Map<String, XVisibleObject> objects = new HashMap<String, XVisibleObject>();

    XVideoValue(JsonObject raw) {
      super(raw.get(JSonXSensorMessageFields.IS_STARTED).asBoolean());
      if (isStarted()) {
        JsonObject rawObjects = raw.get(JSonXSensorMessageFields.XVIDEO_OBJECTS).asObject();
        for (String o : rawObjects.names()) {
          objects.put(o, new XVisibleObject(o, rawObjects.get(o).asObject()));
        }
      }
    }

    /**
     * @return true if the object with the given name is currently tracked ?
     */
    @ScriptApi
    public boolean containsObject(String name) {
      return objects.containsKey(name);
    }

    /**
     * @return the object with the given name.
     */
    @ScriptApi
    public XVisibleObject getObject(String name) {
      return objects.get(name);
    }

    /**
     * @return the list of the currently tracked objects.
     */
    @ScriptApi
    public XVisibleObject[] getObjects() {
      return objects.values().toArray(new XVisibleObject[objects.size()]);
    }

    @Override
    public String toString() {
      StringBuilder sb = new StringBuilder(256);
      sb.append("{isStarted: ").append(isStarted()).append(", objects: [");
      for (Iterator<String> it = objects.keySet().iterator(); it.hasNext();) {
        sb.append(objects.get(it.next()));
        if (it.hasNext()) {
          sb.append(", ");
        }
      }
      return sb.append("]}").toString();
    }
  }

  public static final class XVisibleObject {
    private final String name;
    private final int x;
    private final int y;

    XVisibleObject(String name, JsonObject raw) {
      this.name = name;
      x = raw.get(JSonXSensorMessageFields.XVIDEO_OBJECT_X).asInt();
      y = raw.get(JSonXSensorMessageFields.XVIDEO_OBJECT_Y).asInt();
    }

    @ScriptApi
    public String getName() {
      return name;
    }

    @ScriptApi
    public int getX() {
      return x;
    }

    @ScriptApi
    public int getY() {
      return y;
    }

    // public float getDistance(XTrackedObject b) {
    // int dx = x - b.x;
    // int dy = y - b.y;
    // return (float) Math.sqrt((dx * dx) + (dy * dy));
    // }

    @Override
    public String toString() {
      return "{name: \"" + getName() + "\", x: " + getX() + ", y: " + getY() + "}";
    }
  }
}
