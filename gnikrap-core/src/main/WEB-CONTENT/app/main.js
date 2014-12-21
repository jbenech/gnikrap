/*
 * Gnikrap is a simple scripting environment for the Lego Mindstrom EV3
 * Copyright (C) 2014 Jean BENECH
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
  self.context = appContext; // The application context
  self.workAreaItems = ko.observableArray();
  
  // Init
  {
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
    } // else: Don't show Gyro, not supported by the browser
    if(self.context.video4html5.isSupported()) {
      self.workAreaItems.push({
        name: i18n.t("workArea.videoSensorTab"),
        tabId: "videoSensorTab",
        active: ko.observable(false)
      });
    } // else: Video/WebCam not supported by the browser
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
  }

  self.onShowWorkAreaItem = function(workAreaItem) {
    // Set the active item in the model and on screen
    var items = self.workAreaItems(); // return a regular array
    for(var i = 0; i < items.length; i++) {
      items[i].active(items[i].tabId == workAreaItem.tabId);
      $("#" + items[i].tabId).toggleClass("active", items[i].active());
    }
  }
}

// Model to manage the script editor tab
function ScriptEditorTabViewModel(appContext) {
  var self = this;
  self.context = appContext; // The application context
  self.editor = undefined;
  self.scriptFilename = undefined;
  
  // Init
  {
    self.editor = ace.edit("editor")
    self.editor.setTheme("ace/theme/chrome");
    self.editor.getSession().setMode("ace/mode/javascript");
  }

  self.onClearScript = function() {
    bootbox.confirm(i18n.t("clearScriptModal.title"), function(result) {
      if(result) {
        self.__doClearScript();
      }
    });
  }

  self.onLoadScript = function() {
    self.context.manageScriptFilesVM.display();
  }

  self.loadScriptFile = function(filename) {
    self.__setValue(i18n.t("miscellaneous.loadingScripWait", { "filename": filename }));
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
        self.context.messageLogVM.addMessage(true, i18n.t("errors.cantLoadScriptFile",
          { "filename": filename, causedBy: ("" + XMLHttpRequest.status + " - " +  errorThrown)}));
      }
    });
  }

  self.onSaveScript = function() {
    bootbox.prompt({
      title: i18n.t('saveScriptModal.title'),
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
              self.context.messageLogVM.addMessage(false, i18n.t("miscellaneous.scriptSuccessfullySaved", {"filename": filename }));
            },
            error: function(XMLHttpRequest, textStatus, errorThrown) {
              self.context.messageLogVM.addMessage(true, i18n.t("errors.cantSaveScriptFile",
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

  this.doResize = function() {
    var h = window.innerHeight;
    $('#editor').css('height', Math.max(350, h - (100 + 10)).toString() + 'px'); // 100 should be synchronized with body.padding-top and buttonbar
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
  self.context = appContext; // The application context
  // Data for the View
  {
    self.buttons = [];
    self.isStarted = ko.observable(false);
    self.sensorName = ko.observable("xTouch");
  }
  
  // Init
  {
    for(var i = 0; i < 4; i++) {
      self.buttons[i] = [];
      for(var j = 0; j < 6; j++) {
        self.buttons[i].push({
          name: ko.observable(""),
          actions: [],
          isDisabled: ko.observable(false),
          isPressed: false,
          onKeyboardTouch: function(btn) {
            self.__doOnKeyboardTouch(btn);
          },
          onPressed: function(btn) {
            btn.isPressed = true;
            self.__doNotifyStateChanged(false);
          },
          onRelease: function(btn) {
            if(btn.isPressed) {
              btn.isPressed = false;
              self.__doNotifyStateChanged(false);
            } // else, useless event
          }
        });
      }
    }
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
  
  self.__doOnKeyboardTouch = function(btn) {
    if(!self.isStarted()) {
      bootbox.prompt({
        title: i18n.t('configureKeyboardButtonModal.title'),
        value: btn.name(),
        callback: function(result) {
          if (result != null) {
            btn.actions = self.__splitNameToActions(result);
            btn.name(self.__buildNameFromActions(btn.actions));
          } // Cancel clicked
        }
      });
    }
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
        buttons: {}
      };
      if(self.isStarted()) {
        self.buttons.forEach(function(e0) {
          e0.forEach(function(e1) {
            if(e1.isPressed) {
              e1.actions.forEach(function (a) {
                var btn = xValue.buttons[a];
                xValue.buttons[a] = (btn == undefined ? 1 : btn + 1);
              });
              // Array.prototype.push.apply(xValue.buttons, e1.actions);
            }
          })
        });
      }
      self.context.ev3BrickServer.sendXSensorValue(self.sensorName(), xValue);
    }
  }
          
  self.onResetKeyboard = function() {
    bootbox.confirm(i18n.t("resetKeyboardModal.title"), function(result) {
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
  
  self.doResize = function() {
    var h = window.innerHeight;
    $('.xkeyboard-touch').css('height', Math.round(Math.max(30, h - 100) / 4).toString() + 'px');
  }
}

// Model to manage the Gyroscope x-Sensor
function GyroscopeSensorTabViewModel(appContext) {
  var self = this;
  self.context = appContext; // The application context
  self.sensorName = ko.observable("xGyro");
  self.calibrationMode = ko.observable(true);
  self.isStarted = ko.observable(false);
  
  // Init
  {
    // Is device orientation supported
    if(window.DeviceOrientationEvent) {
      // TODO
      document.getElementById("doEvent").innerHTML = "DeviceOrientation";
    } else {
      // Should not be possible to be here if not allowed (should have already been checked while adding tabs)
      console.log("Device orientation not supported !");
    }
  }

  self.__resetXValue = function() {
    // EV3 sensor values: angle ° and rate in °/s
    self.xValue = {
      isStarted: undefined, // will be defined just before sending
      x: { angle: 0, rate: 0},
      y: { angle: 0, rate: 0},
      z: { angle: 0, rate: 0}
    }
  }
  
  self.onReset = function() {
    // TODO: Set position for the "zero" ?
    console.log("onReset");
  }
  
  self.deviceOrientationHandler = function(eventData) {
    self.xValue.x.angle = eventData.beta;
    self.xValue.y.angle = eventData.gamma;
    self.xValue.z.angle = eventData.alpha;

    {
      console.log("deviceOrientationHandler...");
      // gamma is the left-to-right tilt in degrees, where right is positive
      var tiltLR = eventData.gamma;
      // beta is the front-to-back tilt in degrees, where front is positive
      var tiltFB = eventData.beta;
      // alpha is the compass direction the device is facing in degrees
      var dir = eventData.alpha
      
      // call our orientation event handler
      document.getElementById("doTiltLR").innerHTML = Math.round(tiltLR);
      document.getElementById("doTiltFB").innerHTML = Math.round(tiltFB);
      document.getElementById("doDirection").innerHTML = Math.round(dir);

      // Apply the transform to the image
      var logo = document.getElementById("imgLogo");
      logo.style.webkitTransform = "rotate("+ tiltLR +"deg) rotate3d(1,0,0, "+ (tiltFB*-1)+"deg)";
      logo.style.MozTransform = "rotate("+ tiltLR +"deg)";
      logo.style.transform = "rotate("+ tiltLR +"deg) rotate3d(1,0,0, "+ (tiltFB*-1)+"deg)";
    }
  }

  function deviceMotionHandler(eventData) {
    var acceleration = eventData.acceleration; // can be undefined with some hardware
    if(acceleration == undefined) {
      acceleration = eventData.accelerationIncludingGravity;
    }
    self.xValue.x.rate = acceleration.x;
    self.xValue.y.rate = acceleration.y;
    self.xValue.z.rate = acceleration.z;

    {
      var info, xyz = "[X, Y, Z]";

      // Grab the acceleration from the results
      info = xyz.replace("X", acceleration.x);
      info = info.replace("Y", acceleration.y);
      info = info.replace("Z", acceleration.z);
      document.getElementById("moAccel").innerHTML = info;

      // Grab the acceleration including gravity from the results
      acceleration = eventData.accelerationIncludingGravity;
      info = xyz.replace("X", acceleration.x);
      info = info.replace("Y", acceleration.y);
      info = info.replace("Z", acceleration.z);
      document.getElementById("moAccelGrav").innerHTML = info;

      // Grab the rotation rate from the results
      var rotation = eventData.rotationRate;
      info = xyz.replace("X", rotation.alpha);
      info = info.replace("Y", rotation.beta);
      info = info.replace("Z", rotation.gamma);
      document.getElementById("moRotation").innerHTML = info;

      // // Grab the refresh interval from the results
      info = eventData.interval;
      document.getElementById("moInterval").innerHTML = info;       
    }
  }

  self.__sendXValue = function() {
    self.xValue.isStarted = self.isStarted();
    self.context.ev3BrickServer.sendXSensorValue(self.sensorName(), self.xValue);
    if(self.isStarted()) {
      // TODO: Don't send if value not changed
      setTimeout(self.__sendXValue, 40); // Maximum of 25 times by second
    }
  }
  
  self.onStart = function() {
    self.isStarted(!self.isStarted());
    if(self.isStarted()) {
      if (window.DeviceOrientationEvent) {
        console.log("Register events...");
        self.__resetXValue();
        window.addEventListener('deviceorientation', self.deviceOrientationHandler, false);
        window.addEventListener('devicemotion', self.deviceMotionHandler, false);
        self.__sendXValue();
      }
    } else {
      console.log("Remove event listeners...");
      window.removeEventListener('deviceorientation', self.deviceOrientationHandler, false);
      window.removeEventListener('devicemotion', self.deviceMotionHandler, false);
      self.__resetXValue();
      self.__sendXValue();
    }
  }
}

// Model to manage the Video x-Sensor.
// Current implements is largly inspired from the jsfeast "Lukas Kanade optical flow" sample
function VideoSensorTabViewModel(appContext) {
  var self = this;
  self.context = appContext; // The application context
  self.sensorName = ko.observable("xVideo");
  self.isStarted = ko.observable(false);
  self.perfSummary = ko.observable("");
  self.perfSummary.extend({ rateLimit: 200 }); // Accept lower refresh rate
  
  self.webcam = document.getElementById("xVideoSensorWebcam"); // Video webcam HTML widget
  self.canvas = document.getElementById("xVideoSensorCanvas"); // Video canvas HTML widget
  self.width = 640;
  self.height = 480;

  // The computation data
  self.currentImagePyramid = undefined;
  self.previousImagePyramid = undefined;
  self.perf = undefined;
  
  // Init
  {
  /*
    console.log("Register canvas click event");
    console.log("Canvas: " + JSON.stringify(self.canvas));
    self.canvas.addEventListener("click", self.onCanvasClick, false);
*/
    self.canvasCtx = self.canvas.getContext('2d');
    self.canvasCtx.fillStyle = "rgb(0,255,127)";
    self.canvasCtx.strokeStyle = "rgb(0,255,127)";
    self.canvasCtx.textBaseline = "bottom";
    self.canvasCtx.fillRect(0, 0, self.width, self.height);
    
    self.points = {
      number: 0,
      idx: 0, // idx is used to generate a unique point name
      status: new Uint8Array(100),
      name: [],
      currentXY: new Float32Array(100*2),
      previousXY:  new Float32Array(100*2)
    };
    self.points.name[99] = undefined;
    
  }
  
  self.onStart = function() {
    self.isStarted(!self.isStarted());
    
    if(self.isStarted()) {
      if (self.context.video4html5.isSupported) {
        // Request to access to the Webcam
        self.context.video4html5.getUserMedia({video: true}, self.handleVideo, self.videoAccessRefused);
      }
    } else {
      // Stop acquiring video
      self.webcam.pause();
      self.webcam.src = null;
      self.perfSummary("");
      self.__doClearCanvas();
    }
  }
  
  self.handleVideo = function(mediaStream) {
    //console.log("handleVideo... (" + localMediaStream + ")");    
    self.webcam.src = self.context.video4html5.URL.createObjectURL(mediaStream);
    setTimeout(function() { self.webcam.play(); }, 500); // Not sure if it's useful to delay this call ?!
    self.__initComputationStructures();
    self.context.video4html5.requestAnimationFrame(self.onAnimationFrame);
    //console.log("... success");
  }
  
  self.videoAccessRefused = function(err) {
    console.log("Error: " + JSON.stringify(err));
    alert(i18n.t("errors.videoSensorOffBecauseVideAccessRefused"));
  }
  
  self.__initComputationStructures = function() {
    // Initialize 2 pyramid with depth 3 => 640x480 -> 320x240 -> 160x120
    self.currentImagePyramid = new jsfeat.pyramid_t(3);
    self.currentImagePyramid.allocate(self.width, self.height, jsfeat.U8_t|jsfeat.C1_t); // DataType: single channel unsigned char
    self.previousImagePyramid = new jsfeat.pyramid_t(3);
    self.previousImagePyramid.allocate(self.width, self.height, jsfeat.U8_t|jsfeat.C1_t);

    self.prof = new profiler();
    //prof.add("processing");
  }
  
  self.onAnimationFrame = function() {
    //console.log("onAnimmationFrame");
    if(self.isStarted()) {
      var width = self.width;
      var height = self.height;
      self.context.video4html5.requestAnimationFrame(self.onAnimationFrame); // Call for each frame - See note on: https://developer.mozilla.org/en-US/docs/Web/API/window.requestAnimationFrame
      self.prof.new_frame();
      if (self.webcam.readyState === self.webcam.HAVE_ENOUGH_DATA) { // See https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement
        self.canvasCtx.drawImage(self.webcam, 0, 0, width, height);
        var imageData = self.canvasCtx.getImageData(0, 0, width, height);

        // Swap data (recycle old objects to avoid costly instantiation)
        var recyclingPoints = self.points.previousXY;
        self.points.previousXY = self.points.currentXY;
        self.points.currentXY = recyclingPoints;
        var recyclingPyramid = self.previousImagePyramid;
        self.previousImagePyramid = self.currentImagePyramid;
        self.currentImagePyramid = recyclingPyramid;

        // Perform image processing
        //self.prof.start("processing");
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

        //self.prof.stop("processing");

        // Remove no more found points and draw points
        self.__doKeepAndDrawPoints();

        self.perfSummary("FPS: " + Math.round(self.prof.fps));
        // console.log(self.prof.log());
      }
    } else {
      self.__doClearCanvas();
    }
  }
  
  self.__doClearCanvas = function() {
    self.canvasCtx.clearRect(0, 0, self.width, self.height);
  }
  
  self.__doKeepAndDrawPoints = function() {
    var n = self.points.number;
    var curXY = self.points.currentXY;
    var name = self.points.name;
    var status = self.points.status;
    var j = 0; // New number of points

    for (var i = 0; i < n; i++) {
      if (status[i] == 1) { // Keep the point
        if (j < i) {
          curXY[j << 1] = curXY[i << 1];
          curXY[(j << 1) + 1] = curXY[(i << 1) + 1];
          name[j] = name[i];
        }
        self.__doDrawPoint(curXY[j << 1], curXY[(j << 1)+1], name[j]); // JBEN Why << 1 here ?
        j++;
      } else {
        self.context.messageLogVM.addMessage(false, i18n.t("miscellaneous.pointsNoMoreTracked", {"name": name[i] }));
      }
    }
    self.points.number = j;
  }
  
  self.__doDrawPoint = function(x, y, name) {
    var ctx = self.canvasCtx;
    var txtMeasure = ctx.measureText(name);
    var txtWidthOn2 = txtMeasure.width / 2;
    
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + 5, y - 14);
    ctx.moveTo(x + 5 - txtWidthOn2, y - 15);
    ctx.lineTo(x + 5 + txtWidthOn2, y - 15);
    ctx.stroke();

    ctx.fillText(name, x + 5 - txtWidthOn2, y - 17);    
  }
  
  self.onCanvasClick = function(data, event) {
    if(!self.isStarted()) {
      return;
    }
    var rect = self.canvas.getBoundingClientRect();
    var x = event.clientX - rect.left;
    var y = event.clientY - rect.top;

    if ((x > 0) && (y > 0) && (x < self.width) && (y < self.height)) { // Add a new point
      var n = self.points.number;
      if(n < 99) {
        self.points.currentXY[n<<1] = x;
        self.points.currentXY[(n<<1)+1] = y;
        self.points.name[n] = "Point-" + (++self.points.idx);
        self.points.number++;
        
        // Get the point name
        bootbox.prompt({
          title: i18n.t('configureTrackedPointNameModal.title'),
          value: self.points.name[n],
          callback: function(result) {
            if (result != null) {
              self.points.name[n] = result;
            } // Cancel clicked
          }
        });
      } else {
        bootbox.alert(i18n.t("errors.maximumTrackedPointsReached", { number: 100 }));
      }
    }
  }
}

// Model that manage the message log view
function MessageLogViewModel(appContext) { // appContext not used for MessageLog
  var self = this;
  self.messages = ko.observableArray();
  self.messages.extend({ rateLimit: 200 }); // Accept lower refresh rate
  self.keepOnlyLastMessage = ko.observable(true);
  
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

      if(self.keepOnlyLastMessage()) {
        self.messages.splice(15); // Keep the first n messages
      }
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

  self.onKeepOnlyLastMessage = function() {
    self.keepOnlyLastMessage(!self.keepOnlyLastMessage());
  }
}

// Model that manage the "load/manage scripts" dialog
function ManageScriptFilesViewModel(appContext) {
  var self = this;
  self.context = appContext; // The application context
  self.files = ko.observableArray();

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
        self.context.messageLogVM.addMessage(true, i18n.t("errors.cantRetrieveListOfScriptFiles",
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
    bootbox.confirm(i18n.t("miscellaneous.confirmScriptFileDeletion", { filename: file.name }), function(result) {
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
            alert(i18n.t("errors.cantDeleteScriptFile",
                { filename: result, causedBy: ("" + XMLHttpRequest.status + " - " +  errorThrown)}));
            self.doRefreshList();
          }
        });
      } // else cancel
    });
  }
}

// Manage the interaction with the server on the EV3 brick
function EV3BrickServer(appContext) {
  var self = this;
  self.context = appContext; // The application context
  self.ws = undefined; // undefined <=> no connection with the EV3 brick

  // Init
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
        console.log("Fail to create websocket for: '" + wsURI + "'");
        self.context.messageLogVM.addMessage(true, i18n.t("errors.ev3ConnectionFailed", {cansedBy: ex}));
        self.__doWSReconnection();
      }
    }
    else {
      self.context.messageLogVM.addMessage(true, i18n.t("errors.websocketNotSupported"));
    }
  }

  self.__onWSOpen = function(evt) {
    self.context.messageLogVM.addMessage(false, i18n.t("miscellaneous.ev3ConnectionOk"));
  }

  self.__onWSMessage = function(evt) {
    var received_msg = evt.data;
    var received_data = JSON.parse(received_msg);
    var msgType = received_data.msgTyp;
    console.log("Message received: " + received_msg);

    if(msgType == "ScriptException" || msgType == "Exception") {
      if(received_data.code == "SCRIPT_ALREADY_RUNNING") {
        // Ask confirmation in order to stop the script
        bootbox.confirm(i18n.t("miscellaneous.confirmStopScriptAlreadyRunning"), function(result) {
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
    self.context.messageLogVM.addMessage(true, i18n.t("errors.ev3ConnectionNok"));
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
          console.log("Fail to close the websocket - " + JSON.stringify(ex));
        }
      } // else: CLOSED or CLOSING => No need to close again
      self.ws = undefined;
    }
  }

  // Send a message to the websocket (if opened)
  self.__doWSSend = function(message) {
    if((self.ws != undefined) && (self.ws.readyState == 1)) { // OPEN
      try {
        self.ws.send(message);
      } catch(ex) {
        console.log("Fail to send a message - " + JSON.stringify(ex));
        self.__doWSReconnection();
      }
    } else {
      console.log("Can't send a message because the ws isn't initialized or isn't opened - " + JSON.stringify(message));
    }
  }

  self.runScript = function(scriptCode, stopRunningScript) {
    if(self.ws != undefined) {
      var jsonMsg = JSON.stringify({
          act: "runScript",
          sLang: "javascript",
          sText: scriptCode,
          sFStop: stopRunningScript
      });
      // console.log("run - " + jsonMsg);
      self.__doWSSend(jsonMsg);
    } else {
      self.context.messageLogVM.addMessage(true, i18n.t("errors.cantRunScriptEV3ConnectionNok"));
    }
  }

  self.stopScript = function() {
    if(self.ws != undefined) {
      var jsonMsg = JSON.stringify({
          act: "stopScript"
      });
      // console.log("stop - " + jsonMsg);
      self.__doWSSend(jsonMsg);
    } else {
      self.context.messageLogVM.addMessage(true, i18n.t("errors.cantStopScriptEV3ConnectionNok"));
    }
  }
  
  self.sendXSensorValue = function(sensorName, sensorValue) {
    if(self.ws != undefined) {
      var jsonMsg = JSON.stringify({
          act: "setXSnsValue",
          xSnsName: sensorName,
          xSnsVal: sensorValue
      });
      console.log("xSensorValue - " + jsonMsg);
      self.__doWSSend(jsonMsg);
    } else {
      // TODO error management
    }
  }
}


///////////////////////////////////////////////////////////////////////////////////////////////
// Other stuff found over the internet without copyright and slightly reworked to feet the need

// Manage compatibility for accessing to the webcam (getUserMedia) and video rendering (requestAnimationFrame)
var video4html5 = (function() {
  var lastTime = 0,
  URL = window.URL || window.webkitURL;
  
  requestAnimationFrame = function(callback, element) {
    var requestAnimationFrame =
//      window.requestAnimationFrame        || 
//      window.webkitRequestAnimationFrame  || 
//      window.mozRequestAnimationFrame     || 
//      window.oRequestAnimationFrame       ||
//      window.msRequestAnimationFrame      ||
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
    var cancelAnimationFrame = 
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

  isSupported = function() {
    return (window.navigator.getUserMedia ||
      window.navigator.mozGetUserMedia ||
      window.navigator.webkitGetUserMedia ||
      window.navigator.msGetUserMedia) != undefined;
  };

  return {
    requestAnimationFrame: requestAnimationFrame,
    cancelAnimationFrame: cancelAnimationFrame,
    getUserMedia: getUserMedia,
    isSupported: isSupported,
    URL: URL
  };
})();


/////////////////////////////
// Knockout specific bindings

// Binding used for enabling/disabling the bootstrap buttons
ko.bindingHandlers.disabled = {
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
// HTML elements specific functions

// Function to have the right coordinates within the canvas, see: 
/*
function relMouseCoords(event) {
  var totalOffsetX = 0, totalOffsetY = 0, canvasX = 0, canvasY = 0;
  var currentElement = this;

  do {
    totalOffsetX += currentElement.offsetLeft - currentElement.scrollLeft;
    totalOffsetY += currentElement.offsetTop - currentElement.scrollTop;
  } while(currentElement = currentElement.offsetParent)

  canvasX = event.pageX - totalOffsetX;
  canvasY = event.pageY - totalOffsetY;

  return {x: canvasX, y: canvasY}
}
HTMLCanvasElement.prototype.relMouseCoords = relMouseCoords;
*/

/////////////////////////
// Check browser version
// TODO: Add some sort of feature detection in order to have "correct"/right app
//console.log($.browser); // Removed - A plugin exists: https://github.com/gabceb/jquery-browser-plugin
//alert(JSON.stringify($.support, null, "  "));

/////////////////////////////////////////
// Initialization while document is ready
var context = {}; // The application context - used for sort of basic dependency-injection

$(document).ready(function() {
  // Translation
  var language_complete = navigator.language.split("-");
  var language = (language_complete[0]);

  i18n.init({ fallbackLng: 'en', lng: language }, function() {
    $(".i18n").i18n(); // Translate all the DOM item that have the class "i18n"
    //console.log("Current language used: " + i18n.lng());

    // Technical objects
    context.video4html5 = video4html5;
    
    // Objects and 'ViewModel/VM' instantiation
    context.ev3BrickServer = new EV3BrickServer(context);
    context.navigationBarVM = new NavigationBarViewModel(context);
    context.messageLogVM = new MessageLogViewModel(context);
    // Tabs
    context.scriptEditorTabVM = new ScriptEditorTabViewModel(context);
    context.keyboardSensorTabVM = new KeyboardSensorTabViewModel(context);
    context.gyroscopeSensorTabVM = new GyroscopeSensorTabViewModel(context);
    context.videoSensorTabVM = new VideoSensorTabViewModel(context);
    // Dialogs
    context.manageScriptFilesVM = new ManageScriptFilesViewModel(context);

    // Knockout bindings
    ko.applyBindings(context.navigationBarVM, $("#navigationBar")[0]);
    ko.applyBindings(context.messageLogVM, $("#messageLog")[0]);
    // Tabs
    ko.applyBindings(context.scriptEditorTabVM, $("#scriptEditorTab")[0]);
    ko.applyBindings(context.keyboardSensorTabVM, $("#keyboardSensorTab")[0]);
    ko.applyBindings(context.gyroscopeSensorTabVM, $("#gyroSensorTab")[0]);
    ko.applyBindings(context.videoSensorTabVM, $("#videoSensorTab")[0]);
    // Dialogs
    ko.applyBindings(context.manageScriptFilesVM, $("#manageScriptFilesModal")[0]);
    
    // Other initialization
    context.ev3BrickServer.initialize(); // WS connexion with the server
    context.scriptEditorTabVM.loadScriptFile("__default__.js"); // Load default script
    
    // Register windows events for editor auto-resize
    $(window).on('resize', function () {
        context.scriptEditorTabVM.doResize();
        context.keyboardSensorTabVM.doResize();
    });
    $(window).resize();
  });
  // i18n.setLng('en-US', function(t) { /* loading done */ });
});
