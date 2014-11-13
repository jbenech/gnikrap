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

/**
 * Constants used within the json messages exchanged through the WebSocket.
 * <p/>
 * Possible messages (Browser -> EV3):
 * <ul>
 * <li>Action message:</li>
 * <ul>
 * <li>toto
 * <li>qsdfqsdf</li></li>
 * </ul>
 * </ul>
 * <p/>
 * Possible messages (EV3 -> Browser):
 * <ul>
 * <li>Exception message (EV3 exception):</li>
 * <ul>
 * <li>msgType: Fixed value: 'Exception'</li>
 * <li>msgID: The ID of the source message that generate the exception</li>
 * <li>text: The exception message</li>
 * </ul>
 * <li>Script exception message:</li>
 * <ul>
 * <li>msgType: Fixed value: 'ScriptException'</li>
 * <li>text: The exception message</li>
 * </ul>
 * </ul>
 */
public interface JsonMessageFields {

  // Both side
  // String MESSAGE_ID = "msgID";
  /** Message type field. */
  String MESSAGE_TYPE = "msgTyp";

  // Messages sent by the browser to the EV3
  // String MESSAGE_TYPE_ACTION = "action";
  /** Action name field */
  String ACTION = "act";

  // Messages sent by the EV3 to the browser
  /** Message type value: Exception */
  String MESSAGE_TYPE_EV3_EXCEPTION = "Exception";
  String MESSAGE_TYPE_SCRIPT_EXCEPTION = "ScriptException";
  String MESSAGE_TYPE_INFO_USER = "InfoUser";
  String MESSAGE_TYPE_INFO_CODED = "InfoCoded";

  /** Text field type */
  String TEXT = "txt";

  /** Code field */
  String CODE = "code";
  /** Parameters field */
  String PARAMS = "params";

  /** Script properties fields */
  String SCRIPT_LANGUAGE = "sLang";
  String SCRIPT_TEXT = "sText";
  String SCRIPT_FORCE_STOP = "sFStop"; // Force stop script while running a script and a script is already running

  /** External sensor fields */
  String EXTERNAL_SENSOR_NAME = "extSnsName";
  String EXTERNAL_SENSOR_VALUE = "extSnsVal";
}
