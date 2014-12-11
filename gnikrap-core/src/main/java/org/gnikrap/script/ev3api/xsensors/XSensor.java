package org.gnikrap.script.ev3api.xsensors;

/**
 * The data for one sensor.
 * 
 * The atomicity of the sensor value is managed at the value level (immutable): The script has to retrieve the value graph with {@link #getValue()} and then perform all the reading on this graph.
 * Subsequent call to {@link #getValue()} could return a different value graph.
 */
public class XSensor {
  private final String name;

  private FutureValue value;

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
    return (value == null ? null : value.getValue());
  }
}