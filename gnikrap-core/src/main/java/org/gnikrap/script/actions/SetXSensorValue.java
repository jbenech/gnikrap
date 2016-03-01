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
package org.gnikrap.script.actions;

import java.util.concurrent.Future;

import org.gnikrap.script.ActionMessageProcessor;
import org.gnikrap.script.EV3ActionProcessor;
import org.gnikrap.script.EV3Exception;
import org.gnikrap.script.EV3Message;
import org.gnikrap.script.JsonMessageFields;
import org.gnikrap.script.ev3api.xsensors.FutureJsonToMapValue;
import org.gnikrap.script.ev3api.xsensors.FutureJsonToXGeoValue;
import org.gnikrap.script.ev3api.xsensors.FutureJsonToXGyroValue;
import org.gnikrap.script.ev3api.xsensors.FutureJsonToXTouchValue;
import org.gnikrap.script.ev3api.xsensors.FutureJsonToXVideoValue;
import org.gnikrap.script.ev3api.xsensors.JSonXSensorMessageFields;
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
    } else if (JSonXSensorMessageFields.XSENSOR_TYPE_XGEO.equals(sensorType)) {
      futureValue = new FutureJsonToXGeoValue(rawSensorValue);
    } else {
      futureValue = new FutureJsonToMapValue(rawSensorValue);
    }

    context.getScriptExecutionManager().setXSensorFutureValue(sensorName, futureValue);
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
