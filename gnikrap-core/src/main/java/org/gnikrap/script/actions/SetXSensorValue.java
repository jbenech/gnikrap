package org.gnikrap.script.actions;

import java.util.concurrent.Future;

import org.gnikrap.ActionMessageProcessor;
import org.gnikrap.script.EV3ActionProcessor;
import org.gnikrap.script.EV3Exception;
import org.gnikrap.script.EV3Message;
import org.gnikrap.script.JsonMessageFields;
import org.gnikrap.script.ev3api.xsensors.JSonXSensorMessageFields;
import org.gnikrap.script.ev3api.xsensors.FutureJsonToMapValue;
import org.gnikrap.script.ev3api.xsensors.FutureJsonToXGyroValue;
import org.gnikrap.script.ev3api.xsensors.FutureJsonToXTouchValue;
import org.gnikrap.script.ev3api.xsensors.FutureJsonToXVideoValue;
import org.gnikrap.script.ev3api.xsensors.XSensorValue;

import com.eclipsesource.json.JsonValue;

/**
 * Set the values of one sensor (values coming from one browser connected to Gnikrap).
 */
public class SetXSensorValue implements ActionMessageProcessor {

  @Override
  public void process(EV3Message msg, EV3ActionProcessor context) throws EV3Exception {
    String sensorName = msg.getFieldAsText(JsonMessageFields.EXTERNAL_SENSOR_NAME);
    String sensorType = msg.getFieldAsText(JsonMessageFields.EXTERNAL_SENSOR_TYPE);
    JsonValue rawSensorValue = msg.getField(JsonMessageFields.EXTERNAL_SENSOR_VALUE);

    Future<XSensorValue> futureValue;
    if (JSonXSensorMessageFields.XSENSOR_TYPE_XGYRO.equals(sensorType)) {
      futureValue = new FutureJsonToXGyroValue(rawSensorValue);
    } else if (JSonXSensorMessageFields.XSENSOR_TYPE_XVIDEO.equals(sensorType)) {
      futureValue = new FutureJsonToXVideoValue(rawSensorValue);
    } else if (JSonXSensorMessageFields.XSENSOR_TYPE_XTOUCH.equals(sensorType)) {
      futureValue = new FutureJsonToXTouchValue(rawSensorValue);
    } else {
      futureValue = new FutureJsonToMapValue(rawSensorValue);
    }

    context.getContext().setXSensorFutureValue(sensorName, futureValue);
  }

  @Override
  public String getName() {
    return JsonMessageFields.ACTION_SET_XSENSOR_VALUE;
  }

  @Override
  public boolean isAsyncNeeded() {
    return false;
  }
}
