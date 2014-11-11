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

import java.io.IOException;
import java.util.Map;

import org.gnikrap.script.ev3api.EV3ScriptException;
import org.gnikrap.utils.JsonUtils;

import com.eclipsesource.json.JsonObject;

/**
 * Helper to generate EV3 messages sent back to the client.
 */
public final class EV3MessageBuilder {

  /**
   * Build a user information message (message sent by the user with the script).
   */
  public static String buildInfoUserMessage(String text) throws IOException {
    JsonObject json = new JsonObject()//
        .add(JsonMessageFields.MESSAGE_TYPE, JsonMessageFields.MESSAGE_TYPE_INFO_USER) //
        .add(JsonMessageFields.TEXT, text);

    return JsonUtils.toString(json, 512);
  }

  /**
   * Build a message that is coded (in order to be translated on the client side)
   */
  public static String buildInfoCodedMessage(String code, Map<String, String> params) throws IOException {
    JsonObject json = new JsonObject() //
        .add(JsonMessageFields.MESSAGE_TYPE, JsonMessageFields.MESSAGE_TYPE_INFO_CODED) //
        .add(JsonMessageFields.CODE, code) //
        .add(JsonMessageFields.PARAMS, JsonUtils.toJsonObject(params));

    return JsonUtils.toString(json, 512);
  }

  /**
   * Build a message for an EV3Exception
   */
  public static String buildEV3ExceptionMessage(EV3Exception ev3ex) throws IOException {
    JsonObject json = new JsonObject();
    if (ev3ex instanceof EV3ScriptException) {
      json.add(JsonMessageFields.MESSAGE_TYPE, JsonMessageFields.MESSAGE_TYPE_SCRIPT_EXCEPTION);
    } else {
      json.add(JsonMessageFields.MESSAGE_TYPE, JsonMessageFields.MESSAGE_TYPE_EV3_EXCEPTION);
    }

    json.add(JsonMessageFields.CODE, ev3ex.getCode()) //
        .add(JsonMessageFields.PARAMS, JsonUtils.toJsonObject(ev3ex.getParams()));

    return JsonUtils.toString(json, 512);
  }
}
