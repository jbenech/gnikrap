/*
 * Gnikrap is a simple scripting environment for the Lego Mindstrom EV3
 * Copyright (C) 2014-2015 Jean BENECH
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


// Model to manage the Gyroscope x-Sensor
function GyroscopeSensorTabViewModel(appContext) {
  'use strict';

  var self = this;
  { // Init
    self.context = appContext; // The application context
    self.sensorName = ko.observable("xGyro");
    self.isStarted = ko.observable(false);
    self.axisOrientation = 0;

    self.xAxisValue = ko.observable("");
    self.yAxisValue = ko.observable("");
    self.zAxisValue = ko.observable("");
    self.xAxisValue.extend({ rateLimit: 100 }); // Accept lower refresh rate
    self.yAxisValue.extend({ rateLimit: 100 }); // Accept lower refresh rate
    self.zAxisValue.extend({ rateLimit: 100 }); // Accept lower refresh rate

    // Is device orientation supported
    if(!window.DeviceOrientationEvent) {
      // Should not be possible to be here if not allowed (should have already been checked while adding tabs)
      console.log("Device orientation not supported !");
    }
  }

  self.__resetXValue = function() {
    // EV3 sensor values: angle degree and rate in degree/s
    self.xValue = {
      isStarted: undefined, // will be defined just before sending
      x: { angle: 0 }, //, rate: 0.0},
      y: { angle: 0 }, //, rate: 0.0},
      z: { angle: 0 } //, rate: 0.0}
    };
  };

  self.deviceOrientationHandler = function(eventData) {
    var xv = self.xValue;
    xv.x.angle = Math.round(eventData.beta);
    xv.y.angle = Math.round(eventData.gamma);
    xv.z.angle = Math.round(eventData.alpha);
    
    if ((self.axisOrientation == 90) || (self.axisOrientation == -90)) { // Invert X and Y
      var t = xv.y.angle;
      xv.y.angle = xv.x.angle;
      xv.x.angle = t;
    }
    
    if ((self.axisOrientation == 180) || (self.axisOrientation == -90)) {
      xv.y.angle *= -1;
    }
    if((self.axisOrientation == 180) || (self.axisOrientation == 90)) {
      xv.x.angle *= -1;
    }    

    self.__sendXValue();
  };

  /*
  function deviceMotionHandler(eventData) {
    var acceleration = eventData.acceleration || // can acceleration be undefined on some hardware
                        eventData.accelerationIncludingGravity;
    if(acceleration != undefined) {
      if (Math.abs(self.axisOrientation) == 90) {
        // Invert X and Y
        self.xValue.y.rate = round2dec(acceleration.x);
        self.xValue.x.rate = round2dec(acceleration.y);
      } else {
        // Use device default
        self.xValue.x.rate = round2dec(acceleration.x);
        self.xValue.y.rate = round2dec(acceleration.y);
      }
      // TODO: Does we need to change the sign for acceleration ?
      self.xValue.z.rate = round2dec(acceleration.z);
      self.__sendXValue();
    }
  }*/

  self.__sendXValue = function() {
    self.xValue.isStarted = self.isStarted();
    self.context.ev3BrickServer.streamXSensorValue(self.sensorName(), "Gyr1", self.xValue);
    // Also display value to GUI
    self.xAxisValue("x: " + JSON.stringify(self.xValue.x));
    self.yAxisValue("y: " + JSON.stringify(self.xValue.y));
    self.zAxisValue("z: " + JSON.stringify(self.xValue.z));
  };

  self.__setAxisOrientation = function(orientation) {
    self.axisOrientation = orientation;
  };
  
  self.__askAxisOrientationFull = function() {
    bootbox.dialog({
      title: i18n.t("gyroSensorTab.setAxisDialogFull.title"),
      message: i18n.t("gyroSensorTab.setAxisDialogFull.message"),
      buttons: {
        cancel: {
          label: i18n.t("gyroSensorTab.setAxisDialogFull.cancel"),
          className: "btn-default",
          callback: function() { /* Cancel */ }
        },
        landscapeLeft: {
          label: i18n.t("gyroSensorTab.setAxisDialogFull.landscapeLeft"),
          className: "btn-primary",
          callback: function() {
            self.__setAxisOrientation(90);
          }
        },
        landscapeRight: {
          label: i18n.t("gyroSensorTab.setAxisDialogFull.landscapeRight"),
          className: "btn-primary",
          callback: function() {
            self.__setAxisOrientation(-90);
          }
        },
        portrait: {
          label: i18n.t("gyroSensorTab.setAxisDialogFull.portrait"),
          className: "btn-primary",
          callback: function() {
            self.__setAxisOrientation(0);
          }
        },
        reversePortrait: {
          label: i18n.t("gyroSensorTab.setAxisDialogFull.reversePortrait"),
          className: "btn-primary",
          callback: function() {
            self.__setAxisOrientation(180);
          }
        }
      }
    });
  };
  
  self.onSetAxis = function() {
    var wo = window.orientation;
    
    if(wo == undefined) { // Browser don't support orientation
      self.__askAxisOrientationFull();
    } else {
      if(wo == -180) {
        wo = 180;
      }
      
      var woLabel = i18n.t("gyroSensorTab.axisOrientation.o" + wo);
      
      bootbox.dialog({
        title: i18n.t("gyroSensorTab.setAxisDialogLight.title"),
        message: i18n.t("gyroSensorTab.setAxisDialogLight.message", {"axisOrientation": woLabel }),
        buttons: {
          cancel: {
            label: i18n.t("gyroSensorTab.setAxisDialogLight.cancel"),
            className: "btn-default",
            callback: function() { /* Cancel */ }
          },
          ok: {
            label: i18n.t("gyroSensorTab.setAxisDialogLight.ok"),
            className: "btn-primary",
            callback: function() {
              self.__setAxisOrientation(wo);
            }
          },
          fullChoice: {
            label: i18n.t("gyroSensorTab.setAxisDialogLight.fullChoice"),
            className: "btn-primary",
            callback: function() {
              self.__askAxisOrientationFull();
            }
          }
        }
      });
    }
  };
  
  self.onStart = function() {
    self.isStarted(!self.isStarted());
    if(self.isStarted()) {
      if (window.DeviceOrientationEvent) {
        console.log("Register DeviceOrientationEvent...");
        self.__resetXValue();
        window.addEventListener('deviceorientation', self.deviceOrientationHandler, false);
        //window.addEventListener('devicemotion', self.deviceMotionHandler, false);
        self.__sendXValue();
      }
    } else {
      if (window.DeviceOrientationEvent) {
        console.log("Remove DeviceOrientationEvent...");
        window.removeEventListener('deviceorientation', self.deviceOrientationHandler, false);
        //window.removeEventListener('devicemotion', self.deviceMotionHandler, false);
      }
      self.__resetXValue();
      self.__sendXValue();
    }
  };
}
