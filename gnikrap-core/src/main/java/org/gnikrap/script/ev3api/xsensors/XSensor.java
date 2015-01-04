package org.gnikrap.script.ev3api.xsensors;

import java.util.Collections;
import java.util.HashMap;
import java.util.Map;

/**
 * The data for one sensor.
 * 
 * The atomicity of the sensor value is managed at the value level (immutable): The script has to retrieve the value graph with {@link #getValue()} and then perform all the reading on this graph.
 * Subsequent call to {@link #getValue()} could return a different value graph.
 */
public class XSensor {
  private final String name;

  private FutureValue value;

  private static final Map<String, Object> DEFAULT_XSENSOR_VALUE;

  static {
    HashMap<String, Object> temp = new HashMap<String, Object>();
    temp.put("isStarted", Boolean.FALSE);
    DEFAULT_XSENSOR_VALUE = Collections.unmodifiableMap(temp);
  }

  XSensor(String name) {
    this.name = name;
  }

  public String getName() {
    return name;
  }

  public void setFutureValue(FutureValue futureSensorValue) {
    this.value = futureSensorValue;
  }

  public Object getValue() {
    return (value == null ? DEFAULT_XSENSOR_VALUE : value.getValue());
  }
}