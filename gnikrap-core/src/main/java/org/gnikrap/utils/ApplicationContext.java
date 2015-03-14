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
package org.gnikrap.utils;

import java.util.ArrayList;
import java.util.List;

/**
 * A very basic application context in order to simplify application initialization (need: Share some global objects in a quite clean way).<br/>
 * 
 * Note: Not a "generic/powerful" object, only what has been needed has been put here.
 */
public class ApplicationContext {

  private final List<Object> objects = new ArrayList<Object>();

  public ApplicationContext() {
  }

  /**
   * Register an object.<br/>
   * Not check on registered objects (be careful to don't register twice the same object).
   */
  public void registerObject(Object obj) {
    if (obj != null) {
      objects.add(obj);
    }
  }

  /**
   * Returns an object that is assignable to the given class of interface.<br/>
   * If several objects are found, one will be returned (no guarantee that this is always the same that is returned).
   * 
   * @return an object of the required type, {@code null} if not found.
   */
  public <T> T getObject(Class<T> type) {
    List<T> values = getObjects(type);
    return (values.size() > 0 ? values.get(0) : null);
  }

  /**
   * Returns all the objects that are assignable to the given type.
   */
  @SuppressWarnings("unchecked")
  public <T> List<T> getObjects(Class<T> type) {
    List<T> result = new ArrayList<T>();

    for (Object o : objects) {
      if (type.isInstance(o)) {
        result.add((T) o);
      }
    }

    return result;
  }
}
