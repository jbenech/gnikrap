package org.gnikrap.script.ev3api.xsensors;

/**
 * Immutable sensor value, so there is no threading issue. </br>
 * 
 * Basically store raw value and compute the "real" value on-demand (late processing) => This reduce the CPU need if not all the values are used by the script.
 */
public interface FutureValue {
  public Object getValue();
}
