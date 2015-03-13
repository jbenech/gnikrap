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
package org.gnikrap.script;

/**
 * Constants used within the json messages exchanged with the browser.
 * <p/>
 * Possible messages (Browser -> EV3):
 * <ul>
 * <li>Run script message:</li>
 * <ul>
 * <li>msgTyp: Fixed value: 'runScript'</li>
 * <li>sLang: The script language (only javascript is supported by default)</li>
 * <li>sText: The script itself</li>
 * <li>sFStop: Stop the script currently running if any</li>
 * </ul>
 * <li>Stop script message:</li>
 * <ul>
 * <li>msgTyp: Fixed value: 'stopScript'</li>
 * </ul>
 * <li>Set XSensor value message:</li>
 * <ul>
 * <li>msgTyp: Fixed value: 'setXSnsValue'</li>
 * <li>xSnsNam: The name of the XSensor</li>
 * <li>xSnsTyp: The type of the XSensor</li>
 * <li>xSnsVal: The value of the XSensor</li>
 * </ul>
 * <li>Shutdown brick message:</li>
 * <ul>
 * <li>msgTyp: Fixed value: 'shutdownBrick'</li>
 * </ul>
 * <li>Shutdown Gnikrap message:</li>
 * <ul>
 * <li>msgTyp: Fixed value: 'shutdownGnikrap'</li>
 * </ul>
 * </ul>
 * <p/>
 * Possible messages (EV3 -> Browser):
 * <ul>
 * <li>Exception message (EV3 exception):</li>
 * <ul>
 * <li>msgTyp: Fixed value: 'Exception'</li>
 * <li>msgID: The ID of the source message that generate the exception</li>
 * <li>txt: The exception message</li>
 * </ul>
 * <li>Script exception message:</li>
 * <ul>
 * <li>msgTyp: Fixed value: 'ScriptException'</li>
 * <li>txt: The exception message</li>
 * </ul>
 * <li>Messages sent by Gnikrap (coded messages translated on the GUI):</li>
 * <ul>
 * <li>msgTyp: Fixed value: 'InfoCoded'</li>
 * <li>code: The code to translate</li>
 * <li>params: The parameters to use for the translation</li>
 * </ul>
 * <li>Message notified by the script (call to <code>ev3.notify()</code>):</li>
 * <ul>
 * <li>msgTyp: Fixed value: 'InfoUser'</li>
 * <li>txt: The message</li>
 * </ul>
 * </ul>
 */
public final class JsonMessageFields {

  // Both side
  // String MESSAGE_ID = "msgID";
  /** Message type field. */
  public static final String MESSAGE_TYPE = "msgTyp";

  // Messages sent by the browser to the EV3
  // String MESSAGE_TYPE_ACTION = "action";
  /** Action name field */
  public static final String ACTION = "act";

  // Possible actions
  public static final String ACTION_RUN_SCRIPT = "runScript";
  public static final String ACTION_STOP_SCRIPT = "stopScript";
  public static final String ACTION_SET_XSENSOR_VALUE = "setXSnsValue";
  public static final String ACTION_SHUTDOWN_BRICK = "shutdownBrick";
  public static final String ACTION_SHUTDOWN_GNIKRAP = "shutdownGnikrap";

  // Messages sent by the EV3 to the browser
  /** Message type value: Exception */
  public static final String MESSAGE_TYPE_EV3_EXCEPTION = "Exception";
  public static final String MESSAGE_TYPE_SCRIPT_EXCEPTION = "ScriptException";
  public static final String MESSAGE_TYPE_INFO_USER = "InfoUser";
  public static final String MESSAGE_TYPE_INFO_CODED = "InfoCoded";

  /** Text field type */
  public static final String TEXT = "txt";
  /** Code field */
  public static final String CODE = "code";
  /** Parameters field */
  public static final String PARAMS = "params";

  /** Script properties fields */
  public static final String SCRIPT_LANGUAGE = "sLang";
  public static final String SCRIPT_TEXT = "sText";
  public static final String SCRIPT_FORCE_STOP = "sFStop"; // Force stop script while running a script and a script is already running

  /** External sensor fields */
  public static final String EXTERNAL_SENSOR_NAME = "xSnsNam";
  public static final String EXTERNAL_SENSOR_VALUE = "xSnsVal";
  public static final String EXTERNAL_SENSOR_TYPE = "xSnsTyp";

  private JsonMessageFields() {
    // Avoid instantiation
  }
}
