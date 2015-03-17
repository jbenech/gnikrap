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


// Model to manage the navigation bar actions
function NavigationBarViewModel(appContext) {
  var self = this;
  { // Init
    self.context = appContext; // The application context
    self.workAreaItems = ko.observableArray();
    
    self.workAreaItems.push({
      name: i18n.t("workArea.scriptEditorTab"),
      tabId: "scriptEditorTab",
      active: ko.observable(true)
    });
    self.workAreaItems.push({
      name: i18n.t("workArea.keyboardSensorTab"),
      tabId: "keyboardSensorTab",
      active: ko.observable(false)
    });
    if(window.DeviceOrientationEvent) {
      self.workAreaItems.push({
        name: i18n.t("workArea.gyroSensorTab"),
        tabId: "gyroSensorTab",
        active: ko.observable(false)
      });
    } // else: Don't show xGyro, not supported by the browser
    if(self.context.compatibility.isUserMediaSupported()) {
      self.workAreaItems.push({
        name: i18n.t("workArea.videoSensorTab"),
        tabId: "videoSensorTab",
        active: ko.observable(false)
      });
    } // else: Don't show xVideo, video/WebCam not supported by the browser
    if(navigator.geolocation) {
      self.workAreaItems.push({
          name: i18n.t("workArea.geoSensorTab"),
          tabId: "geoSensorTab",
          active: ko.observable(false)
      });
    } // else: Don't show xGeo, GPS not supported by the browser
  }

  // Auto collapse navbar while collapse feature is enabled (screen width is < 768)
  self.__collapseNavbar = function() {
    if($("#bs-navbar-collapse-1-button").css("display") != "none") {
      $("#bs-navbar-collapse-1-button").click()
    }
  }
  
  self.onRunScript = function() {
    self.doRunScript(false);
  }

  self.doRunScript = function(stopRunningScript) {
    var value = (self.context.scriptEditorTabVM != undefined ? self.context.scriptEditorTabVM.getValue() : null);

    // Execute the script
    self.context.ev3BrickServer.runScript(value, stopRunningScript);
  }

  self.onStopScript = function() {
    self.context.ev3BrickServer.stopScript();
  }

  self.onDisplayAbout = function() {
    $('#aboutModal').modal("show");
    self.__collapseNavbar();
  }
  
  self.onFullScreen = function() {
    self.context.compatibility.toggleFullScreen();
    self.__collapseNavbar();
  }
  
  self.onShutdownBrick = function() {
    bootbox.dialog({
      title: i18n.t("navigationBar.confirmShutdownBrickModal.title"),
      message: i18n.t("navigationBar.confirmShutdownBrickModal.message"),
      buttons: {
        cancel: {
          label: i18n.t("navigationBar.confirmShutdownBrickModal.cancel"),
          className: "btn-primary",
          callback: function() { /* Cancel */ },
        },
        shutdownBrick: {
          label: i18n.t("navigationBar.confirmShutdownBrickModal.shutdownBrick"),
          className: "btn-default",
          callback: function() {
            self.context.ev3BrickServer.shutdownBrick();
          }
        }
      }
    });
  }
  
  self.onStopGnikrap = function() {
    bootbox.dialog({
      title: i18n.t("navigationBar.confirmStopGnikrap.title"),
      message: i18n.t("navigationBar.confirmStopGnikrap.message"),
      buttons: {
        cancel: {
          label: i18n.t("navigationBar.confirmStopGnikrap.cancel"),
          className: "btn-primary",
          callback: function() { /* Cancel */ },
        },
        shutdownBrick: {
          label: i18n.t("navigationBar.confirmStopGnikrap.stopGnikrap"),
          className: "btn-default",
          callback: function() {
            self.context.ev3BrickServer.stopGnikrap();
          }
        }
      }
    });
  }
  
  self.onDisplaySettings = function() {
    self.context.settingsVM.display();
    self.__collapseNavbar();
  }

  self.onShowWorkAreaItem = function(workAreaItem) {
    // Set the active item in the model and on screen
    var items = self.workAreaItems(); // return a regular array
    for(var i = 0; i < items.length; i++) {
      items[i].active(items[i].tabId == workAreaItem.tabId);
      $("#" + items[i].tabId).toggleClass("active", items[i].active());
    }
    self.__collapseNavbar();
  }
}


// Model to manage the script editor tab
function ScriptEditorTabViewModel(appContext) {
  var self = this;
  { // Init
    self.context = appContext; // The application context
    self.editor = undefined;
    self.scriptFilename = undefined;
  
    self.editor = ace.edit("editor")
    self.editor.setTheme("ace/theme/chrome");
    self.editor.getSession().setMode("ace/mode/javascript");
    self.editor.getSession().setTabSize(2);
    self.editor.getSession().setUseSoftTabs(true); // Use spaces instead of tabs
  }

  self.onClearScript = function() {
    bootbox.confirm(i18n.t("scriptEditorTab.clearScriptModal.title"), function(result) {
      if(result) {
        self.__doClearScript();
      }
    });
  }

  self.onLoadScript = function() {
    self.context.manageScriptFilesVM.display();
  }

  self.loadScriptFile = function(filename) {
    self.__setValue(i18n.t("scriptEditorTab.loadingScripWait", { "filename": filename }));
    self.scriptFilename = undefined;
    $.ajax({
      url: "/rest/scriptfiles/" + filename,
      success: function(data, status) {
        var scriptFile = JSON.parse(data);
        self.__setValue(scriptFile.content);
        if(filename.indexOf("__") != 0) { // Not read-only => memorize the filename
          self.scriptFilename = filename;
        }
      },
      error: function(XMLHttpRequest, textStatus, errorThrown) {
        // XMLHttpRequest.status: HTTP response code
        self.context.messageLogVM.addMessage(true, i18n.t("scriptEditorTab.errors.cantLoadScriptFile",
          { "filename": filename, causedBy: ("" + XMLHttpRequest.status + " - " +  errorThrown)}));
      }
    });
  }

  self.onSaveScript = function() {
    bootbox.prompt({
      title: i18n.t('scriptEditorTab.saveScriptModal.title'),
      value: (self.scriptFilename == undefined ? "" : self.scriptFilename),
      callback: function(result) {
        if ((result != null) && (result.trim().lenght != 0)) {
          var filename = result.trim();
          console.log("Save script: '" + filename + "'");
          $.ajax({
            url: "/rest/scriptfiles/" + filename,
            content: "application/json",
            data:  JSON.stringify({
              name: filename,
              content: self.editor.getValue()
            }),
            type: "PUT",
            success: function(data, status) {
              self.scriptFilename = filename;
              self.context.messageLogVM.addMessage(false, i18n.t("scriptEditorTab.scriptSuccessfullySaved", {"filename": filename }));
            },
            error: function(XMLHttpRequest, textStatus, errorThrown) {
              self.context.messageLogVM.addMessage(true, i18n.t("scriptEditorTab.errors.cantSaveScriptFile",
                { "filename": filename, causedBy: ("" + XMLHttpRequest.status + " - " +  errorThrown)}));
            }
          });
        } // else: cancel clicked
      }
    });
  }

  this.getValue = function() {
    return self.editor.getValue();
  }

  this.doResize = function(workAreaHeight, usefullWorkAreaHeight) {
    $('#editor').css('height', Math.max(350, usefullWorkAreaHeight - 10).toString() + 'px');
    self.editor.resize();
  };

  this.__doClearScript = function() {
    self.__setValue("");
  }

  this.__setValue = function(value) {
    self.editor.setValue(value);
    self.editor.moveCursorTo(0, 0);
  }
}


// Model to manage the keyboard x-Sensor
function KeyboardSensorTabViewModel(appContext) {
  var self = this;
  { // Init
    self.context = appContext; // The application context
    // Data for the View
    self.buttons = [];
    self.isStarted = ko.observable(false);
    self.sensorName = ko.observable("xTouch");

    for(var i = 0; i < 4; i++) {
      self.buttons[i] = [];
      for(var j = 0; j < 6; j++) {
        self.buttons[i].push({
          //row: i, col: j,
          name: ko.observable(""),
          actions: [],
          isDisabled: ko.observable(false),
          isPressed: false
        });
      }
    }

    // In order to be able to manage multi-touch, bind events on the top level keyboard element, with jQuery delegate
    // (Don't find a better way to do it with 'standard' button )
    $("#xTouchButtons").on("mousedown touchstart", "button", function(event) {
      var btn = ko.dataFor(this);
      self.__doOnButtonPressed(btn);
      $(this).addClass("active");
      this.style.color="red";
      return false;
    });
    $("#xTouchButtons").on("mouseup mouseout touchend", "button", function(event) {
      var btn = ko.dataFor(this);
      self.__doOnButtonRelease(btn);
      $(this).removeClass("active");
      this.style.removeProperty("color");
      return false;
    });
  }
  
  self.onStart = function() {
    self.isStarted(!self.isStarted());

    // Switch the button status according to the mode & button content
    self.buttons.forEach(function(e0) {
      e0.forEach(function(e1) {
        e1.isDisabled(self.isStarted() && (e1.name().length == 0));
        e1.isPressed = false;
      })
    });

    self.__doNotifyStateChanged(true);
  }

  self.__doOnButtonPressed = function(btn) {
    if(self.isStarted()) {
      btn.isPressed = true;
      self.__doNotifyStateChanged(false);
    } else {
      bootbox.prompt({
        title: i18n.t('keyboardSensorTab.configureKeyboardButtonModal.title'),
        value: btn.name(),
        callback: function(result) {
          if (result != null) {
            btn.actions = self.__splitNameToActions(result);
            btn.name(self.__buildNameFromActions(btn.actions));
          } // else, cancel clicked
        }
      });
    }
  }
  
  self.__doOnButtonRelease = function(btn) {
    if(btn.isPressed) {
      btn.isPressed = false;
      self.__doNotifyStateChanged(false);
    } // else, useless event
  }

  self.__splitNameToActions = function(name) {
    return name.trim().split(",")
      .map(function(e) { return e.trim(); })
      .filter(function(e) { return e.length > 0 });
  }

  self.__buildNameFromActions = function(actions) {
    return actions.reduce(function(val, elt) {
              return (val.length == 0 ? val : val + ", ") + elt;
            }, "");
  }

  self.__doNotifyStateChanged = function(sendIfNotStarted) {
    if(self.isStarted() || sendIfNotStarted) {
      // Notify the list of actions triggered
      var xValue = {
        isStarted: self.isStarted(),
        touchs: {}
      };
      if(self.isStarted()) {
        self.buttons.forEach(function(e0) {
          e0.forEach(function(e1) {
            if(e1.isPressed) {
              e1.actions.forEach(function (a) {
                var btn = xValue.touchs[a];
                xValue.touchs[a] = (btn == undefined ? 1 : btn + 1);
              });
              // Array.prototype.push.apply(xValue.touchs, e1.actions);
            }
          })
        });
      }
      self.context.ev3BrickServer.sendXSensorValue(self.sensorName(), "Tch1", xValue);
    }
  }

  self.onResetKeyboard = function() {
    bootbox.confirm(i18n.t("keyboardSensorTab.resetKeyboardModal.title"), function(result) {
      if(result) {
        self.__doResetKeyboard();
      }
    });
  }

  self.__doResetKeyboard = function() {
    self.buttons.forEach(function(e0) {
      e0.forEach(function(e1) {
        e1.name("");
        e1.actions = [];
        e1.isDisabled(false);
        e1.isPressed = false;
      });
    });
  }

  self.onLoadKeyboard = function() {
    // TODO: Reuse the dialog for the script ?
    console.log("TODO: onLoadKeyboard");
  }

  self.onSaveKeyboard = function() {
    // TODO: Save subset of buttons as a json
    console.log("TODO: onSaveKeyboard");
  }

  self.doResize = function(workAreaHeight, usefullWorkAreaHeight) {
    $('.xkeyboard-touch').css('height', Math.round(
      Math.max(45, Math.min(window.innerWidth / 6, // Max height for better display for devices in portrait mode 
          (usefullWorkAreaHeight - 10) / 4))).toString() + 'px');          
  }
}



// Model to manage the Gyroscope x-Sensor
function GyroscopeSensorTabViewModel(appContext) {
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
    // EV3 sensor values: angle ° and rate in °/s
    self.xValue = {
      isStarted: undefined, // will be defined just before sending
      x: { angle: 0 }, //, rate: 0.0},
      y: { angle: 0 }, //, rate: 0.0},
      z: { angle: 0 } //, rate: 0.0}
    }
  }

  self.deviceOrientationHandler = function(eventData) {
    var xv = self.xValue
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
  }

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
  }

  self.__setAxisOrientation = function(orientation) {
    self.axisOrientation = orientation;
  }
  
  self.__askAxisOrientationFull = function() {
    bootbox.dialog({
      title: i18n.t("gyroSensorTab.setAxisDialogFull.title"),
      message: i18n.t("gyroSensorTab.setAxisDialogFull.message"),
      buttons: {
        cancel: {
          label: i18n.t("gyroSensorTab.setAxisDialogFull.cancel"),
          className: "btn-default",
          callback: function() { /* Cancel */ },
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
  }
  
  self.onSetAxis = function() {
    var wo = window.orientation;
    
    if(wo == undefined) { // Browser don't support orientation
      self.__askAxisOrientationFull();
    } else {
      if(wo == -180) {
        wo = 180;
      };
      
      var woLabel = i18n.t("gyroSensorTab.axisOrientation.o" + wo);
      
      bootbox.dialog({
        title: i18n.t("gyroSensorTab.setAxisDialogLight.title"),
        message: i18n.t("gyroSensorTab.setAxisDialogLight.message", {"axisOrientation": woLabel }),
        buttons: {
          cancel: {
            label: i18n.t("gyroSensorTab.setAxisDialogLight.cancel"),
            className: "btn-default",
            callback: function() { /* Cancel */ },
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
  }
  
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
  }
}


// Model to manage the GPS/Geo x-Sensor
function GeoSensorTabViewModel(appContext) {
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
    // EV3 sensor values: angle ° and rate in °/s
    self.xValue = {
      isStarted: undefined, // will be defined just before sending
      timestamp: 0,
      latitude: 0,
      longitude: 0,
      accuracy: 0,
      
      // Optional field (depends on the hardware/device capabilities)
      altitude: 0,
      altitudeAccuracy: 0
    }
  }

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
  }
  
  self.watchPositionHandler = function(position) {
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
      case error.UNKNOWN_ERROR:
      default:
        errorMsg = i18n.t("geoSensorTab.errors.unknownError", {"detail": error.message });
        break;
    }
    self.context.messageLogVM.addMessage(true, errorMsg);
  }

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
        self.__sendXValue();
      }
    } else {
      if (navigator.geolocation) {
        console.log("Remove geolocation callback...");
        if(self.watchID) {
          navigator.geolocation.clearWatch(self.watchID);
          self.watchID = undefined;
        }
      }
      self.__resetXValue();
      self.__sendXValue();
    }
  }
}

// A computation engine that is able to track points.
// Current implements is largely inspired from the jsfeast "Lukas Kanade optical flow" sample
function PointTrackingComputationEngine(appContext) {
  var self = this;
  { // init
    self.context = appContext; // The application context
    self.MAX_POINTS = 20;

    self.currentImagePyramid = undefined;
    self.previousImagePyramid = undefined;
    
    self.points = {
      number: 0,
      idx: 0, // idx is used to generate a unique point name
      status: new Uint8Array(self.MAX_POINTS),
      name: [],
      currentXY: new Float32Array(self.MAX_POINTS*2),
      previousXY:  new Float32Array(self.MAX_POINTS*2)
    };
    self.points.name[self.MAX_POINTS - 1] = undefined;
  }

  self.reset = function()  {
    // Initialize 2 pyramid with depth 3 => 640x480 -> 320x240 -> 160x120
    self.currentImagePyramid = new jsfeat.pyramid_t(3);
    self.currentImagePyramid.allocate(self.width, self.height, jsfeat.U8_t|jsfeat.C1_t); // DataType: single channel unsigned char
    self.previousImagePyramid = new jsfeat.pyramid_t(3);
    self.previousImagePyramid.allocate(self.width, self.height, jsfeat.U8_t|jsfeat.C1_t);
    // Clear the points already defined
    self.points.number = 0;
  }

  self.compute = function(imageData, width, height) {
    // Swap data (recycle old objects to avoid costly instantiation)
    var recyclingPoints = self.points.previousXY;
    self.points.previousXY = self.points.currentXY;
    self.points.currentXY = recyclingPoints;
    var recyclingPyramid = self.previousImagePyramid;
    self.previousImagePyramid = self.currentImagePyramid;
    self.currentImagePyramid = recyclingPyramid;

    // Perform image processing
    jsfeat.imgproc.grayscale(imageData.data, width, height, self.currentImagePyramid.data[0]);
    self.currentImagePyramid.build(self.currentImagePyramid.data[0], true); // Populate the pyramid

    // See full documentation: http://inspirit.github.io/jsfeat/#opticalflowlk
    jsfeat.optical_flow_lk.track(self.previousImagePyramid, self.currentImagePyramid, // previous/current frame 8-bit pyramid_t
      self.points.previousXY, // Array of 2D coordinates for which the flow needs to be found
      self.points.currentXY,  // Array of 2D coordinates containing the calculated new positions
      self.points.number,     // Number of input coordinates
      20,                     // Size of the search window at each pyramid level
      30,                     // Stop searching after the specified maximum number of iterations (default: 30)
      self.points.status,     // Each element is set to 1 if the flow for the corresponding features has been found otherwise 0 (default: null)
      0.01,                   // Stop searching when the search window moves by less than eps (default: 0.01)
      0.001);                 // The algorithm calculates the minimum eigen value of a 2x2 normal matrix of optical flow equations, divided by number of
                              // pixels in a window; if this value is less than min_eigen_threshold, then a corresponding feature is filtered out and its flow is not
                              // processed, it allows to remove bad points and get a performance boost (default: 0.0001)

    self.__removeLostPoints();
  }
  
  self.__removeLostPoints = function() {
    var n = self.points.number;
    var name = self.points.name;
    var status = self.points.status;
    var curXY = self.points.currentXY;
    var name = self.points.name;
    var j = 0; // New number of points
    for (var i = 0; i < n; i++) {
      if (status[i] == 1) { // Keep the point
        if (j < i) {
          curXY[j<<1] = curXY[i<<1];
          curXY[(j<<1) + 1] = curXY[(i<<1) + 1];
          name[j] = name[i];
        }
        j++;
      } else {
        self.context.messageLogVM.addMessage(true, i18n.t("videoSensorTab.pointsNoMoreTracked", {"name": name[i] }));
      }
    }
    self.points.number = j;
  }

  // Draw also returns the points structure as JSON
  self.drawComputationResult = function(ctx) {
    var result = {};
    var curXY = self.points.currentXY;
    var name = self.points.name;

    for (var i = self.points.number - 1; i >= 0; i--) {
      var x = Math.round(curXY[i << 1]), y = Math.round(curXY[(i << 1) + 1]);
      var txt = name[i] + ": {x: " + x + ", y: " + y + "}";
      var txtWidthOn2 = ctx.measureText(txt).width / 2;

      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + 5, y - 14);
      ctx.moveTo(x + 5 - txtWidthOn2, y - 15);
      ctx.lineTo(x + 5 + txtWidthOn2, y - 15);
      ctx.stroke();
      ctx.fillText(txt, x + 5 - txtWidthOn2, y - 17);
      
      result[name[i]] = {x: x, y: y};
    }

    return result;
  }

  self.onClick = function(x, y) {
    var n = self.points.number;
    // Check if need to rename a point ?
    var xMin = x - 20, xMax = x + 20;
    var yMin = y - 20, yMax = y + 20;

    for(var i = 0; i < n; i++) {
      var px = self.points.currentXY[i<<1],
          py = self.points.currentXY[(i<<1) + 1];
      if((xMin < px) && (px < xMax) && (yMin < py) && (py < yMax)) {
        self.__renamePoint(i);
        return;
      }
    }

    // Create a new point if possible
    if(n < (self.MAX_POINTS - 1)) {
      self.points.currentXY[n<<1] = x;
      self.points.currentXY[(n<<1) + 1] = y;
      self.points.name[n] = i18n.t("videoSensorTab.newPoint") + (++self.points.idx);
      self.points.number++;
      self.__renamePoint(n);
    } else {
      bootbox.alert(i18n.t("videoSensorTab.errors.maximumTrackedPointsReached", { number: self.MAX_POINT }));
    }
  }

  self.__renamePoint = function(pointIdx) {
    // Get the point name
    bootbox.prompt({
      title: i18n.t('videoSensorTab.configureTrackedPointNameModal.title'),
      value: self.points.name[pointIdx],
      callback: function(result) {
        if (result != null) {
          self.points.name[pointIdx] = result;
        } // Cancel clicked
      }
    });
  }
}


// Model to manage the Video x-Sensor.
function VideoSensorTabViewModel(appContext) {
  var self = this;
  { // Init
    self.context = appContext; // The application context
    self.sensorName = ko.observable("xVideo");
    self.isStarted = ko.observable(false);

    self.webcam = document.getElementById("xVideoSensorWebcam"); // Video webcam HTML widget
    self.canvas = document.getElementById("xVideoSensorCanvas"); // Video canvas HTML widget
    self.webcamMediaStream = undefined; // The camera
    self.WIDTH = 640;
    self.HEIGHT = 480;

    // The computation data
    self.perf = undefined;
    self.ptce = new PointTrackingComputationEngine(appContext);

    self.perfSummary = ko.observable("");
    self.perfSummary.extend({ rateLimit: 200 }); // Accept lower refresh rate

    self.canvasCtx = self.canvas.getContext('2d');
    self.canvasCtx.fillStyle = "rgb(0,255,127)";
    self.canvasCtx.strokeStyle = "rgb(0,255,127)";
    self.canvasCtx.textBaseline = "bottom";
    self.canvasCtx.font = "bold 14px sans-serif";
    self.canvasCtx.lineWidth = 2;
  }

  self.onStart = function() {
    self.isStarted(!self.isStarted());

    if(self.isStarted()) {
      if (self.context.compatibility.isUserMediaSupported()) {
        // Request to access to the Webcam
        self.context.compatibility.getUserMedia({video: true}, self.handleVideo, self.videoAccessRefused);
      }
    } else {
      // Stop acquiring video
      self.webcam.pause();
      self.webcam.src = null;
      self.perfSummary("");
      self.__clearCanvas();
      
      if(self.webcamMediaStream) { // Defined
        self.webcamMediaStream.stop();
        self.webcamMediaStream = undefined;
      }

      // Send an not started value
      self.__doSendSensorValue({ isStarted: self.isStarted() });
    }
  }
  
  self.__doSendSensorValue = function(value) {
    self.context.ev3BrickServer.streamXSensorValue(self.sensorName(), "Vid1", value);
  }

  // Start acquisition: Ensure that all the stuff is correctly initialized
  self.handleVideo = function(webcamMediaStream) {
    // Init webcam
    self.webcam.src = self.context.compatibility.URL.createObjectURL(webcamMediaStream);
    self.webcamMediaStream = webcamMediaStream;
    // Init computation stuff
    self.ptce.reset();
    self.prof = new profiler();
    // Launch the show
    setTimeout(function() { // Not sure if it's useful to delay this call ?!
        self.webcam.play();
        self.context.compatibility.requestAnimationFrame(self.onAnimationFrame);
      }, 500);
  }

  self.videoAccessRefused = function(err) {
    console.log("Error: " + JSON.stringify(err));
    alert(i18n.t("videoSensorTab.errors.videoAccessRefused"));
  }

  self.onAnimationFrame = function() {
    //console.log("onAnimmationFrame");
    if(self.isStarted()) {
      self.prof.new_frame();
      if (self.webcam.readyState === self.webcam.HAVE_ENOUGH_DATA) { // See https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement
        // Get image and compute
        self.canvasCtx.drawImage(self.webcam, 0, 0, self.WIDTH, self.HEIGHT);
        var imageData = self.canvasCtx.getImageData(0, 0, self.WIDTH, self.HEIGHT);
        self.ptce.compute(imageData, self.WIDTH, self.HEIGHT);

        // Update display
        var ceJson = self.ptce.drawComputationResult(self.canvasCtx);
        self.perfSummary("FPS: " + Math.round(self.prof.fps));

        // Send JSON event
        self.__doSendSensorValue({isStarted: self.isStarted(), objects: ceJson});
      }

      self.context.compatibility.requestAnimationFrame(self.onAnimationFrame); // Call for each frame - See note on: https://developer.mozilla.org/en-US/docs/Web/API/window.requestAnimationFrame
    } else {
      self.__clearCanvas();
    }
  }

  self.__clearCanvas = function() {
    self.canvasCtx.clearRect(0, 0, self.WIDTH, self.HEIGHT);
  }

  self.onCanvasClick = function(data, event) {
    if(self.isStarted()) {
      var rect = self.canvas.getBoundingClientRect();
      var x = event.clientX - rect.left;
      var y = event.clientY - rect.top;

      if ((x > 0) && (y > 0) && (x < self.WIDTH) && (y < self.HEIGHT)) { // Add a new point
        self.ptce.onClick(x, y);
      }
    }
  }
}


// Model that manage the message log view
function MessageLogViewModel(appContext) { // appContext not used for MessageLog
  var self = this;
  { // Init
    self.messages = ko.observableArray();
    self.messages.extend({ rateLimit: 200 }); // Accept lower refresh rate
    self.keepOnlyLastMessages = ko.observable(true);
    self.MESSAGES_TO_KEEP = 15;
  }

  self.addMessage = function(isError, message) {
    //console.log("new message: " + isError + " / " + message);
    function doAddMessage(isError, message, count) {
      self.messages.unshift({
        "time": new Date().toLocaleTimeString(),
        "isError": isError,
        "cssClazz":  (isError ? "list-group-item-danger" : "list-group-item-info"),
        "text": message,
        "count": count
      });
      self.__doKeepOnlyLastMessages();
    }

    // Manage the message count
    var m0 = (self.messages().length > 0 ? self.messages()[0] : undefined);
    if((m0 != undefined) && (m0.isError == isError) && (m0.text == message)) {
      self.messages.shift();
      doAddMessage(isError, message, m0.count + 1);
    } else {
      doAddMessage(isError, message, 1);
    }
  }

  self.onResetMessages = function() {
    self.messages.removeAll();
  }

  self.onKeepOnlyLastMessages = function() {
    self.keepOnlyLastMessages(!self.keepOnlyLastMessages());
    self.__doKeepOnlyLastMessages();
  }
  
  self.__doKeepOnlyLastMessages = function() {
    if(self.keepOnlyLastMessages()) {
      self.messages.splice(self.MESSAGES_TO_KEEP); // Keep the first n messages
    }
  }
  
  self.doResize = function(workAreaHeight, usefullWorkAreaHeight) {
    self.MESSAGES_TO_KEEP = Math.max(15, Math.round(usefullWorkAreaHeight/40)); // 40 is a bit more than the height of a single line message
    self.__doKeepOnlyLastMessages();
  }
}


// Model that manage the "load/manage scripts" dialog
function ManageScriptFilesViewModel(appContext) {
  var self = this;
  { // Init
    self.context = appContext; // The application context
    self.files = ko.observableArray();
  }

  self.display = function() {
    self.doRefreshFileList();
    $('#manageScriptFilesModal').modal('show');
  }

  self.hide = function() {
    $('#manageScriptFilesModal').modal('hide');
  }

  self.doRefreshFileList = function() {
    // Retrieve the list from the server
    self.files.removeAll();
    $.ajax({
      url: "/rest/scriptfiles/",
      success: function(data, status) {
        var scriptFiles = JSON.parse(data);
        for(var i = 0; i < scriptFiles.length; i++) {
          //console.log("Adding: " + scriptFiles[i]);
          scriptFiles[i].isReadWrite = (scriptFiles[i].name.indexOf("__") != 0);
          self.files.push(scriptFiles[i]);
        }
        $("#manageScriptFilesModal .i18n").i18n(); // DOM generated by Knockout isn't i18n => Need to re-translate the modal
      },
      error: function(XMLHttpRequest, textStatus, errorThrown) {
        // XMLHttpRequest.status: HTTP response code
        self.context.messageLogVM.addMessage(true, i18n.t("manageScriptFilesModal.errors.cantRetrieveListOfScriptFiles",
          { causedBy: ("" + XMLHttpRequest.status + " - " +  errorThrown)}));
        self.hide();
      }
    });
  }

  self.onLoadScript = function(file) {
    self.hide();
    self.context.scriptEditorTabVM.loadScriptFile(file.name);
  }

  self.onDeleteScript = function(file) {
    bootbox.confirm(i18n.t("manageScriptFilesModal.confirmScriptFileDeletion", { filename: file.name }), function(result) {
      if(result) {
        self.files.remove(file);
        $.ajax({
          url: "/rest/scriptfiles/" + file.name,
          type: "DELETE",
          success: function(data, status) {
            console.log("Script file: '" + file.name + "' successfully deleted");
          },
          error: function(XMLHttpRequest, textStatus, errorThrown) {
            // XMLHttpRequest.status: HTTP response code
            alert(i18n.t("manageScriptFilesModal.errors.cantDeleteScriptFile",
                { filename: result, causedBy: ("" + XMLHttpRequest.status + " - " +  errorThrown)}));
            self.doRefreshList();
          }
        });
      } // else cancel
    });
  }
}


// Model that manage the "Settings" dialog
function SettingsViewModel(appContext) {
  var self = this;
  { // Init
    self.context = appContext; // The application context
    self.language = ko.observable("");
  }
  
  self.display = function() {
    // Initialize the values
    self.language(self.context.settings.language);

    $('#settingsModal').modal('show');
  }
  
  self.hide = function() {
    $('#settingsModal').modal('hide');
  }

  self.onSave = function() {
    self.hide();
    
    // TODO use events/signal to change settings
    self.context.settings.language = self.language();
    i18n.setLng(self.context.settings.language, function(t) { $(".i18n").i18n() });
  }  
}


// Manage the interaction with the server on the EV3 brick
function EV3BrickServer(appContext) {
  var self = this;
  { // Init
    self.context = appContext; // The application context
    self.ws = undefined; // undefined <=> no connection with the EV3 brick
    self.xSensorStream = { // Manage the xSensor stream
        sensors: {},
        timeoutID: undefined
      }; 
    self.XSENSOR_STREAM_FREQUENCY = 50; // in ms => Maximum of 20 message by second by xSensor
  }

  self.initialize = function() {
    if ("WebSocket" in window) {
      var wsURI = "ws://" + location.host + "/ws/gnikrap/script";
      try {
        self.ws = new WebSocket(wsURI);
        self.ws.onopen = function(evt) { self.__onWSOpen(evt) };
        self.ws.onclose = function(evt) { self.__onWSClose(evt) };
        self.ws.onmessage = function(evt) { self.__onWSMessage(evt); }
        self.ws.onerror = function(evt) { self.__onWSError(evt); };
      } catch(ex) {
        console.warn("Fail to create websocket for: '" + wsURI + "'");
        self.context.messageLogVM.addMessage(true, i18n.t("ev3brick.errors.ev3ConnectionFailed", {cansedBy: ex}));
        self.__doWSReconnection();
      }
    }
    else {
      self.context.messageLogVM.addMessage(true, i18n.t("ev3brick.errors.websocketNotSupported"));
    }
  }

  self.__onWSOpen = function(evt) {
    self.context.messageLogVM.addMessage(false, i18n.t("ev3brick.ev3ConnectionOk"));
  }

  self.__onWSMessage = function(evt) {
    var received_msg = evt.data;
    var received_data = JSON.parse(received_msg);
    var msgType = received_data.msgTyp;
    console.log("Message received: " + received_msg);

    if(msgType == "ScriptException" || msgType == "Exception") {
      if(received_data.code == "SCRIPT_ALREADY_RUNNING") {
        // Ask confirmation in order to stop the script
        bootbox.confirm(i18n.t("ev3brick.confirmStopScriptAlreadyRunning"), function(result) {
          if(result) {
            self.context.navigationBarVM.doRunScript(true);
          } // else cancel
        });
      }
      else {
        self.context.messageLogVM.addMessage(true, i18n.t("server.errors." + received_data.code, received_data.params));
      }
    } else if(msgType == "InfoCoded") {
      self.context.messageLogVM.addMessage(false, i18n.t("server.messages." + received_data.code, received_data.params));
    } else {
      // Default: Assume this is a text message
      self.context.messageLogVM.addMessage(false, received_data.txt);
    }
  }

  self.__onWSClose = function(evt) {
    self.context.messageLogVM.addMessage(true, i18n.t("ev3brick.errors.ev3ConnectionNok"));
    self.__doWSReconnection();
  }

  self.__onWSError = function(evt) {
    // Does nothing, onError seems redundant with onClose, see http://www.w3.org/TR/websockets/#feedback-from-the-protocol
  }

  self.__doWSReconnection = function() {
    self.__doWSClose();
    setTimeout(self.initialize, 15000); // Run once in 15s
  }

  // Close the websocket (if initialized)
  self.__doWSClose = function() {
    if(self.ws != undefined) {
      if(self.ws.readyState == 0 || self.ws.readyState == 1) { // CONNECTING or OPEN - See https://developer.mozilla.org/en-US/docs/Web/API/WebSocket#Ready_state_constants
        try {
          self.ws.close();
        } catch(ex) {
          console.warn("Fail to close the websocket - " + JSON.stringify(ex));
        }
      } // else: CLOSED or CLOSING => No need to close again
      self.ws = undefined;
    }
  }

  // Send a message to the websocket (if opened)
  // Returns true if sent, false otherwise
  self.__doWSSend = function(message) {
    if((self.ws != undefined) && (self.ws.readyState == 1)) { // OPEN
      try {
        self.ws.send(message);
        return true;
      } catch(ex) {
        console.log("Fail to send a message - " + JSON.stringify(ex));
        self.__doWSReconnection();
      }
    } else {
      console.log("Can't send a message because the ws isn't initialized or isn't opened - " + JSON.stringify(message));
    }
    return false;
  }

  self.runScript = function(scriptCode, stopRunningScript) {
    var jsonMsg = JSON.stringify({
        act: "runScript",
        sLang: "javascript",
        sText: scriptCode,
        sFStop: stopRunningScript
    });
    // console.log("runScript - " + jsonMsg);
    if(self.__doWSSend(jsonMsg) == false) {
      self.context.messageLogVM.addMessage(true, i18n.t("ev3brick.errors.cantRunScriptEV3ConnectionNok"));
    }
  }

  self.stopScript = function() {
    var jsonMsg = JSON.stringify({
        act: "stopScript"
    });
    if(self.__doWSSend(jsonMsg) == false) {
      self.context.messageLogVM.addMessage(true, i18n.t("ev3brick.errors.cantStopScriptEV3ConnectionNok"));
    }
  }
  
  self.shutdownBrick = function() {
    var jsonMsg = JSON.stringify({
        act: "shutdownBrick"
    });
    if(self.__doWSSend(jsonMsg) == false) {
      self.context.messageLogVM.addMessage(true, i18n.t("ev3brick.errors.cantDoSomethingEV3ConnectionNok", { "action": "shutdownBrick" }));
    }
  }
  
  self.stopGnikrap = function() {
    var jsonMsg = JSON.stringify({
        act: "stopGnikrap"
    });
    if(self.__doWSSend(jsonMsg) == false) {
      self.context.messageLogVM.addMessage(true, i18n.t("ev3brick.errors.cantDoSomethingEV3ConnectionNok", { "action": "stopGnikrap" }));
    }
  }

  self.__buildXSensorMessage = function(sensorName, sensorType, sensorValue) {
    return JSON.stringify({
        act: "setXSnsValue",
        xSnsNam: sensorName,
        xSnsTyp: sensorType,
        xSnsVal: sensorValue
      });
  }
  
  // Instantaneously send the sensor value
  self.sendXSensorValue = function(sensorName, sensorType, sensorValue) {
    var jsonMsg = self.__buildXSensorMessage(sensorName, sensorType, sensorValue);
    console.log("send xSensorValue - " + jsonMsg);
    if(self.__doWSSend(jsonMsg) == false) {
      // In case of connection lost: switch to stream behaviour (only the last event will be keep)
      self.streamXSensorValue(sensorName, sensorType, sensorValue);
    }
  }
  
  // Stream the xSensor values in order to avoid flood the EV3 brick
  self.streamXSensorValue = function(sensorName, sensorType, sensorValue) {
    var sensor = self.xSensorStream.sensors[sensorName];
    var jsonMsg = self.__buildXSensorMessage(sensorName, sensorType, sensorValue);
    if(sensor == undefined) {
      self.xSensorStream.sensors[sensorName] = {
        streamLifetime: 1, // Will be initialized at the right value in __doStreamXSensorValue
        lastJsonSent: undefined,
        currentJson: jsonMsg
      };
    } else {
      if(jsonMsg == sensor.lastJsonSent) {
        jsonMsg = undefined
      } else {
        sensor.currentJson = jsonMsg;
      }
    }
    
    if((jsonMsg != undefined) && (self.xSensorStream.timeoutID == undefined)) {
      self.xSensorStream.timeoutID = setTimeout(self.__doStreamXSensorValue, self.XSENSOR_STREAM_FREQUENCY / 2); // No send planned => send rather quickly. Real "message rate" is done in __doStreamXSensorValue.
    }
  }
  
  // Send all waiting values
  self.__doStreamXSensorValue = function() {
    self.xSensorStream.timeoutID = undefined;
    if(self.ws != undefined) { // TODO not correct error checking, see __doWSSend() - to be reworked
      var messageSent = false;
      Object.keys(self.xSensorStream.sensors).forEach(function(sensorName) {
        var sensor = self.xSensorStream.sensors[sensorName];
        if(sensor.currentJson != undefined) {
          console.log("send xSensorValue - " + sensor.currentJson);
          messageSent = true;
          self.__doWSSend(sensor.currentJson);
          sensor.lastJsonSent = sensor.currentJson;
          sensor.currentJson = undefined;
          sensor.streamLifetime = 6000; // At least 4 minutes of lifetime (6000/60/25)
        } else {
          if(sensor.streamLifetime-- < 0) { // Stream no more used: remove it
            console.log("Remove useless stream for sensor '" + sensorName + "'");
            delete self.xSensorStream.sensors[sensorName];
          }
        }
      });
      
      if(messageSent) {
        self.xSensorStream.timeoutID = setTimeout(self.__doStreamXSensorValue, self.XSENSOR_STREAM_FREQUENCY);
      }
    } else {
      // TODO error management - Reset the sensors ?
      //self.xSensorStream.timeoutID = setTimeout(self.__doStreamXSensorValue, 1000); // Retry later
    }
  }
}


////////////////////////////////////////////////////////////////////////////////////
// Other stuff reworked from things found on the internet without explicit copyright

// Manage compatibility for accessing to the webcam (getUserMedia) and video rendering (requestAnimationFrame)
var compatibility = (function() {
  var lastTime = 0,
  URL = window.URL || window.webkitURL,

  requestAnimationFrame = function(callback, element) {
    var requestAnimationFrame =
      window.requestAnimationFrame        ||
      window.webkitRequestAnimationFrame  ||
      window.mozRequestAnimationFrame     ||
      window.oRequestAnimationFrame       ||
      window.msRequestAnimationFrame      ||
      function(callback, element) {
        var currTime = new Date().getTime();
        var timeToCall = Math.max(0, 16 - (currTime - lastTime));
        var id = window.setTimeout(function() {
            callback(currTime + timeToCall);
          }, timeToCall);
        lastTime = currTime + timeToCall;
        return id;
      };

    return requestAnimationFrame.call(window, callback, element);
  },

  cancelAnimationFrame = function(id) {
    var cancelAnimationFrame = window.cancelAnimationFrame ||
      function(id) {
        clearTimeout(id);
      };
    return cancelAnimationFrame.call(window, id);
  },

  getUserMedia = function(options, success, error) {
    var getUserMedia =
      window.navigator.getUserMedia ||
      window.navigator.mozGetUserMedia ||
      window.navigator.webkitGetUserMedia ||
      window.navigator.msGetUserMedia ||
      function(options, success, error) {
        error();
      };

    return getUserMedia.call(window.navigator, options, success, error);
  },

  isUserMediaSupported = function() {
    return (window.navigator.getUserMedia ||
      window.navigator.mozGetUserMedia ||
      window.navigator.webkitGetUserMedia ||
      window.navigator.msGetUserMedia) != undefined;
  },

  // Adapted from: https://developer.mozilla.org/en-US/docs/Web/Guide/API/DOM/Using_full_screen_mode
  // Note: Currently MUST be triggered by the user and can't be done automatically (eg. based on screen size)
  toggleFullScreen = function() {
    var elem = document.body;
    var isFullScreen = (document.fullscreenElement || 
                        document.mozFullScreenElement || 
                        document.webkitFullscreenElement || 
                        document.msFullscreenElement);

    if(isFullScreen) {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
      } else if (document.mozCancelFullScreen) {
        document.mozCancelFullScreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen(); // Element.ALLOW_KEYBOARD_INPUT
      }
    } else {
      if (elem.requestFullscreen) {
        elem.requestFullscreen();
      } else if (elem.msRequestFullscreen) {
        elem.msRequestFullscreen();
      } else if (elem.mozRequestFullScreen) {
        elem.mozRequestFullScreen();
      } else if (elem.webkitRequestFullscreen) {
        elem.webkitRequestFullscreen();
      }
    }
  };
  
  return {
    requestAnimationFrame: requestAnimationFrame,
    cancelAnimationFrame: cancelAnimationFrame,
    getUserMedia: getUserMedia,
    isUserMediaSupported: isUserMediaSupported,
    toggleFullScreen: toggleFullScreen,
    URL: URL
  };
})();

var CanvasUtils = (function() {
  var roundedRect = function (ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x, y + radius);
    ctx.lineTo(x, y + height - radius);
    ctx.quadraticCurveTo(x, y + height, x + radius, y + height);
    ctx.lineTo(x + width - radius, y + height);
    ctx.quadraticCurveTo(x + width, y + height, x + width, y + height - radius);
    ctx.lineTo(x + width, y + radius);
    ctx.quadraticCurveTo(x + width, y, x + width - radius, y);
    ctx.lineTo(x + radius, y);
    ctx.quadraticCurveTo(x, y, x, y + radius);
    ctx.closePath();
    return ctx;
    // ctx.stroke();
  };

  return {
    roundedRect: roundedRect
  };
})();

// Round by keeping only 2 decimal
function round2dec(n) {
  // return Number(n.toFixed(2));
  return Math.round(n * 100) / 100;
}

// Generate a UUID
function generateUUID(){
  var d = new Date().getTime();
  var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = (d + Math.random()*16)%16 | 0;
      d = Math.floor(d/16);
      return (c=='x' ? r : (r&0x3|0x8)).toString(16);
  });
  return uuid;
}


/////////////////////////////
// Knockout specific bindings

// Binding used for enabling/disabling the bootstrap buttons
ko.bindingHandlers['disabled'] = {
  update: function (element, valueAccessor) {
    var valueUnwrapped = ko.unwrap(valueAccessor());
    if(valueUnwrapped) {
      $(element).attr("disabled", "true");
    } else {
      $(element).removeAttr("disabled");
    }
  }
}


////////////////////////////////////
// Initialization of the application
var context = { // The application context - used as a basic dependency-injection mechanism
  settings: {
    language: undefined
  }
};


// Basic checks for "browser compatibility"
//
// Note: Don't perform this check in jQuery .ready() callback as version 2.x of jQuery don't have compatibility with some 'old' browser.
//       Don't use i18n as it doesn't work on some old browser (eg. IE8)
if(!('WebSocket' in window
     && 'matchMedia' in window)) { // A minimal level of css for bootstrap
  alert("Gnikrap can't run in this browser, consider using a more recent browser.\nThe page will be automatically closed.");
  window.close();
}


$(document).ready(function() {
  // Translation
  var language_complete = navigator.language.split("-");
  var language = (language_complete[0]);

  i18n.init({ fallbackLng: 'en', lng: language }, function() {
    $(".i18n").i18n(); // Translate all the DOM item that have the class "i18n"
    context.settings.language = i18n.lng(); // Language really used
    
    // Technical objects
    context.compatibility = compatibility;

    // Objects and 'ViewModel/VM' instantiation
    context.ev3BrickServer = new EV3BrickServer(context);
    context.navigationBarVM = new NavigationBarViewModel(context);
    context.messageLogVM = new MessageLogViewModel(context);
    // Tabs
    context.scriptEditorTabVM = new ScriptEditorTabViewModel(context);
    context.keyboardSensorTabVM = new KeyboardSensorTabViewModel(context);
    context.gyroscopeSensorTabVM = new GyroscopeSensorTabViewModel(context);
    context.videoSensorTabVM = new VideoSensorTabViewModel(context);
    context.geoSensorTabVM = new GeoSensorTabViewModel(context);
    // Dialogs
    context.manageScriptFilesVM = new ManageScriptFilesViewModel(context);
    context.settingsVM = new SettingsViewModel(context);

    // Knockout bindings
    ko.applyBindings(context.navigationBarVM, $("#navigationBar")[0]);
    ko.applyBindings(context.messageLogVM, $("#messageLog")[0]);
    // Tabs
    ko.applyBindings(context.scriptEditorTabVM, $("#scriptEditorTab")[0]);
    ko.applyBindings(context.keyboardSensorTabVM, $("#keyboardSensorTab")[0]);
    ko.applyBindings(context.gyroscopeSensorTabVM, $("#gyroSensorTab")[0]);
    ko.applyBindings(context.videoSensorTabVM, $("#videoSensorTab")[0]);
    ko.applyBindings(context.geoSensorTabVM, $("#geoSensorTab")[0]);
    // Dialogs
    ko.applyBindings(context.manageScriptFilesVM, $("#manageScriptFilesModal")[0]);
    ko.applyBindings(context.settingsVM, $("#settingsModal")[0]);

    // Other initialization
    context.ev3BrickServer.initialize(); // WS connexion with the server
    context.scriptEditorTabVM.loadScriptFile("__default__.js"); // Load default script
    
    // Register windows events for editor auto-resize
    // TODO consider using events
    window.onresize = function() {
      var workAreaHeight = window.innerHeight - 60; // Should be synchronized with body.padding-top
      var usefullWorkAreaHeight = workAreaHeight - 35; // Also remove the button bar
      context.scriptEditorTabVM.doResize(workAreaHeight, usefullWorkAreaHeight);
      context.keyboardSensorTabVM.doResize(workAreaHeight, usefullWorkAreaHeight);
      context.messageLogVM.doResize(workAreaHeight, usefullWorkAreaHeight);
    };
    $(window).resize();

    // Register windows events for keyboard shortcuts
    document.onkeydown = function(e) {
      if(e.ctrlKey) {
        if(e.keyCode == 83) { // Ctrl+S
          e.preventDefault();
          e.stopPropagation();
          context.scriptEditorTabVM.onSaveScript();
          return false;
        }
      }
    };
    
    // Register windows event to ask confirmation while the user leave the page (avoid loosing scripts)
    window.onbeforeunload = function () {
      //return "";
    };
  });
});
