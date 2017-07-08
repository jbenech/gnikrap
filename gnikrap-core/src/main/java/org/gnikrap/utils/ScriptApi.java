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

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * A flag annotation in order to identify the methods that are part of the script API.
 * <p>
 * Note: All the items flagged should be stable from one version to the other
 */
@Retention(RetentionPolicy.SOURCE)
@Target({ ElementType.METHOD, ElementType.FIELD })
public @interface ScriptApi {

  /**
   * The Gnikrap version where the API was added
   */
  String versionAdded() default "NA";

  /**
   * Is the API in incubating state (could be changed)
   */
  boolean isIncubating() default false;

  /**
   * Is the API deprecated ?
   */
  boolean isDeprecated() default false;

  /**
   * The Gnikrap version where the API has been deprecated
   */
  String deprecatedVersion() default "NA";
}
