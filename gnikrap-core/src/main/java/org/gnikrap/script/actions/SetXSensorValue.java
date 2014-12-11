package org.gnikrap.script.actions;

import org.gnikrap.ActionMessageProcessor;
import org.gnikrap.script.EV3ActionProcessor;
import org.gnikrap.script.EV3Exception;
import org.gnikrap.script.EV3Message;
import org.gnikrap.script.JsonMessageFields;
import org.gnikrap.script.ev3api.xsensors.FutureValue;
import org.gnikrap.utils.JsonUtils;

import com.eclipsesource.json.JsonValue;

/**
 * Set the values of one sensor (values coming from one browser connected to Gnikrap).
 */
public class SetXSensorValue implements ActionMessageProcessor {

  @Override
  public void process(EV3Message msg, EV3ActionProcessor context) throws EV3Exception {
    String sensorName = msg.getFieldAsText(JsonMessageFields.EXTERNAL_SENSOR_NAME);
    JsonValue rawSensorValue = msg.getField(JsonMessageFields.EXTERNAL_SENSOR_VALUE);

    context.getContext().setXSensorFutureValue(sensorName, new JsonFutureSensorValue(rawSensorValue));
  }

  @Override
  public String getName() {
    return "setXSnsValue";
  }

  @Override
  public boolean isAsyncNeeded() {
    return false;
  }

  static class JsonFutureSensorValue implements FutureValue {
    private JsonValue rawValue;
    private Object value;

    public JsonFutureSensorValue(JsonValue rawValue) {
      this.rawValue = rawValue;
    }

    /**
     * Construct the value only when needed
     */
    @Override
    public Object getValue() {
      if (value == null) { // Avoid synchronization cost if possible
        synchronized (this) {
          if (value == null) {
            value = JsonUtils.toObject(rawValue);
            rawValue = null;
          }
        }
      }
      return value;
    }
  }
}
