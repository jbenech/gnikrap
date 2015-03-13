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
package org.gnikrap.script.ev3api.xsensors;

import org.gnikrap.utils.ScriptApi;

import com.eclipsesource.json.JsonObject;
import com.eclipsesource.json.JsonValue;

/**
 * Convert the json raw value to an XGeo sensor value.
 */
public class FutureJsonToXGeoValue extends AbstractFutureJsonToXSensorValue {

  public FutureJsonToXGeoValue(JsonValue rawValue) {
    super(rawValue);
  }

  @Override
  protected XSensorValue buildValue(JsonObject rawValue) {
    return new XGeoValue(rawValue);
  }

  public static final class XGeoValue extends XSensorValue {

    private final double latitude;
    private final double longitude;
    private final double accuracy;
    private final double altitude;
    private final double altitudeAccuracy;

    XGeoValue(JsonObject raw) {
      super(raw.get(JSonXSensorMessageFields.IS_STARTED).asBoolean());
      latitude = raw.getDouble(JSonXSensorMessageFields.XGEO_LATITUDE, 0);
      longitude = raw.getDouble(JSonXSensorMessageFields.XGEO_LONGITUDE, 0);
      accuracy = raw.getDouble(JSonXSensorMessageFields.XGEO_ACCURACY, 0);
      altitude = raw.getDouble(JSonXSensorMessageFields.XGEO_ALTITUDE, 0);
      altitudeAccuracy = raw.getDouble(JSonXSensorMessageFields.XGEO_ALTITUDE_ACCURACY, 0);
    }

    @ScriptApi(versionAdded = "0.4.0")
    public double getLatitude() {
      return latitude;
    }

    @ScriptApi(versionAdded = "0.4.0")
    public double getLongitude() {
      return longitude;
    }

    @ScriptApi(versionAdded = "0.4.0")
    public double getAccuracy() {
      return accuracy;
    }

    @ScriptApi(versionAdded = "0.4.0")
    public double getAltitude() {
      return altitude;
    }

    @ScriptApi(versionAdded = "0.4.0")
    public double getAltitudeAccuracy() {
      return altitudeAccuracy;
    }

    @Override
    public String toString() {
      return "{isStarted: " + isStarted() + //
          ", latitude: " + getLatitude() + ", longitude: " + getLongitude() + ", accuracy: " + getAccuracy() + //
          ", altitude: " + getAltitude() + ", altitudeAccuracy: " + getAltitudeAccuracy() + "}";
    }
  }
}
