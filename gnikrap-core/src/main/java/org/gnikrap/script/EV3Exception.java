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

import java.util.Collections;
import java.util.HashMap;
import java.util.Map;

/**
 * An exception that is forwarded to the client side
 */
public class EV3Exception extends Exception {

  private static final long serialVersionUID = -6256298683279149021L;

  /**
   * "Field: '{field}' isn't of type text"
   */
  public static final String INVALID_MESSAGE_FIELD_FORMAT = "INVALID_MESSAGE_FIELD_FORMAT";

  /**
   * "Can't found field: '{field}' in parameter message"
   */
  public static final String MESSAGE_FIELD_NOT_FOUND = "MESSAGE_FIELD_NOT_FOUND";

  /**
   * "Language: '{language}, isn't supported. Try JavaScript instead."
   */
  public static final String SCRITP_LANGUAGE_NOT_SUPPORTED = "SCRITP_LANGUAGE_NOT_SUPPORTED";

  /**
   * "No processor registered for action name: '{action}'"
   */
  public static final String UNKNOWN_ACTION = "UNKNOWN_ACTION";

  private final String code;
  private final Map<String, String> params;
  private final boolean notifyOnlyCaller;

  public EV3Exception(String code, Map<String, String> params) {
    this(code, params, false);
  }

  public EV3Exception(String code, Map<String, String> params, boolean notifyOnlyCaller) {
    super(code);
    this.code = code;
    this.params = Collections.unmodifiableMap(new HashMap<String, String>(params));
    this.notifyOnlyCaller = notifyOnlyCaller;
  }

  public String getCode() {
    return code;
  }

  public Map<String, String> getParams() {
    return params;
  }

  public boolean isNotifyOnlyCaller() {
    return notifyOnlyCaller;
  }

  @Override
  public String toString() {
    return this.getClass().toString() + "[code: " + code + ", params: " + params + ", notifyOnlyCaller: " + notifyOnlyCaller + "]";
  }
}
