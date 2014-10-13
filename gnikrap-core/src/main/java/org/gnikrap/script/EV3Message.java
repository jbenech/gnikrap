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
package org.gnikrap.script;

import org.gnikrap.utils.MapBuilder;

import com.eclipsesource.json.JsonObject;
import com.eclipsesource.json.JsonValue;

/**
 * A helper class to use the json message received from the browser.
 */
public final class EV3Message {

  private final JsonObject jsonMessage;
  private String action;

  public EV3Message(String rawData) {
    this(JsonObject.readFrom(rawData));
  }

  public EV3Message(JsonObject data) {
    this.jsonMessage = data;
  }

  /**
   * Returns the String value of the node with name nodeName, throws an <code>EV3Exception</code> if not found.
   */
  public String getFieldAsText(String fieldName) throws EV3Exception {
    // TODO: Confirm if we need all these checks...
    JsonValue keyNode = jsonMessage.get(fieldName);
    if (keyNode != null) {
      if (keyNode.isString()) {
        return keyNode.asString();
      } else {
        throw new EV3Exception(EV3Exception.INVALID_MESSAGE_FIELD_FORMAT, MapBuilder.buildHashMap("field", fieldName).build());
      }
    } else {
      throw new EV3Exception(EV3Exception.MESSAGE_FIELD_NOT_FOUND, MapBuilder.buildHashMap("field", fieldName).build());
    }
  }

  public String getActionName() throws EV3Exception {
    if (action == null) {
      action = getFieldAsText(JsonMessageFields.ACTION);
    }
    return action;
  }
}
