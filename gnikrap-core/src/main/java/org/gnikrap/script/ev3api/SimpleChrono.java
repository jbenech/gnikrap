/*
 * Gnikrap is a simple scripting environment for the Lego Mindstrom EV3
 * Copyright (C) 2014-2017 Jean BENECH
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
package org.gnikrap.script.ev3api;

import java.util.HashMap;
import java.util.Map;

import org.gnikrap.utils.ScriptApi;

public class SimpleChrono {

  private final Map<String, Long> chronos = new HashMap<>();

  public SimpleChrono() {
    // Nothing to initialize as there is no HW
  }

  @ScriptApi(versionAdded = "0.6.0")
  public void start(String name) {
    if (name != null) {
      chronos.put(name, System.currentTimeMillis());
    }
  }

  @ScriptApi(versionAdded = "0.6.0")
  public long getTime(String name) {
    Long l = (name != null ? chronos.get(name) : null);
    return (l != null ? System.currentTimeMillis() - l : 0);
  }

  @ScriptApi(versionAdded = "0.6.0")
  public void stop(String name) {
    if (name != null) {
      chronos.remove(name);
    }
  }
}
