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


// Model to manage the GPS/Geo x-Sensor
function GeoSensorTabViewModel(appContext) {
  'use strict';

  var self = this;
  { // Init
    self.context = appContext; // The application context
    self.sensorName = ko.observable("xGeo");
    self.isStarted = ko.observable(false);

    self.timestamp = ko.observable("");
    self.latitude = ko.observable("");
    self.longitude = ko.observable("");
    self.accuracy =  ko.observable("");
    self.altitude = ko.observable("");
    self.altitudeAccuracy = ko.observable("");

    // Is device orientation supported
    if(!navigator.geolocation) {
      // Should not be possible to be here if not allowed (should have already been checked while adding tabs)
      console.log("Geolocation not supported !");
    }
  }

  self.__resetXValue = function() {
    self.xValue = {
      isStarted: undefined, // will be defined just before sending
      timestamp: 0,
      latitude: 0,
      longitude: 0,
      accuracy: 0,
      
      // Optional field (depends on the hardware/device capabilities)
      altitude: 0,
      altitudeAccuracy: 0
    };
  };

  self.__sendXValue = function() {
    self.xValue.isStarted = self.isStarted();
    self.context.ev3BrickServer.streamXSensorValue(self.sensorName(), "Geo1", self.xValue);
    // Also display value to GUI
    self.timestamp(self.xValue.timestamp + (self.xValue.timestamp != 0 ? " - " + new Date(self.xValue.timestamp).toLocaleString() : ""));
    self.latitude(self.xValue.latitude);
    self.longitude(self.xValue.longitude);
    self.accuracy(self.xValue.accuracy);
    self.altitude(self.xValue.altitude);
    self.altitudeAccuracy(self.xValue.altitudeAccuracy);
  };
  
  self.watchPositionHandler = function(position) {
    if(self.isStarted()) { // Workaround: In some version of Firefox, the geolocation.clearWatch don't unregister the callback <=> avoid flooding the EV3 brick
      self.xValue.timestamp = position.timestamp;
      self.xValue.latitude = position.coords.latitude;
      self.xValue.longitude = position.coords.longitude;
      self.xValue.accuracy = position.coords.accuracy;
      self.xValue.altitude = position.coords.altitude;
      self.xValue.altitudeAccuracy = position.coords.altitudeAccuracy;
      //self.xValue.heading = position.coords.heading; // Heading can be computed (or use the gyro compass)
      //self.xValue.speed = position.coords.speed; // Speed can be computed
      
      self.__sendXValue();
    }
  };
  
  self.watchPositionErrorHandler = function(error) {
    var errorMsg;
    switch(error.code) {
      case error.TIMEOUT:
        errorMsg = i18n.t("geoSensorTab.errors.timeout", {"detail": error.message });
        break;
      case error.PERMISSION_DENIED:
        errorMsg = i18n.t("geoSensorTab.errors.permissionDenied", {"detail": error.message });
        break;
      case error.POSITION_UNAVAILABLE:
        errorMsg = i18n.t("geoSensorTab.errors.positionUnavailable", {"detail": error.message });
        break;
      // case error.UNKNOWN_ERROR: // Use default
      default:
        errorMsg = i18n.t("geoSensorTab.errors.unknownError", {"detail": error.message });
        break;
    }
    self.context.messageLogVM.addMessage(true, errorMsg);
  };

  self.onStart = function() {
    self.isStarted(!self.isStarted());
    if(self.isStarted()) {
      if (navigator.geolocation) {
        console.log("Register geolocation callback...");
        self.__resetXValue();
        var geo_options = { // TODO tune parameters ?
          enableHighAccuracy: true, 
          maximumAge: 30000, 
          timeout: 27000
        };
        self.watchID = navigator.geolocation.watchPosition(self.watchPositionHandler, self.watchPositionErrorHandler, geo_options);
        console.log("  ... id of callback is: " + self.watchID);
        self.__sendXValue();
      }
    } else {
      if (navigator.geolocation) {
        console.log("Unregister geolocation for callback: " + self.watchID);
        if(self.watchID) {
          navigator.geolocation.clearWatch(self.watchID);
          self.watchID = undefined;
        }
      }
      self.__resetXValue();
      self.__sendXValue();
    }
  };
}
