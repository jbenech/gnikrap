package org.gnikrap.script.actions;

import org.gnikrap.ActionMessageProcessor;
import org.gnikrap.script.EV3ActionProcessor;
import org.gnikrap.script.EV3Exception;
import org.gnikrap.script.EV3Message;
import org.gnikrap.script.JsonMessageFields;

import com.eclipsesource.json.JsonValue;

/**
 * Set the values of one sensor (values coming from one browser connected to Gnikrap).
 */
public class SetExternalSensorValue implements ActionMessageProcessor {

  @Override
  public void process(EV3Message msg, EV3ActionProcessor context) throws EV3Exception {
    String sensorName = msg.getFieldAsText(JsonMessageFields.EXTERNAL_SENSOR_NAME);
    JsonValue sensorValue = msg.getField(JsonMessageFields.EXTERNAL_SENSOR_VALUE);

    // TODO Are the values flat or not ?

    context.getContext().setExternalSensorValue(sensorName, sensorValue);
  }

  @Override
  public String getName() {
    return "setExtSnsValue";
  }

  @Override
  public boolean isAsyncNeeded() {
    return false;
  }
}
