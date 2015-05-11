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


// A computation engine that is able to track points.
// Current implements is largely inspired from the jsfeast "Lukas Kanade optical flow" sample
function PointTrackingComputationEngine(appContext) {
  'use strict';

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
  };

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
  };
  
  self.__removeLostPoints = function() {
    var n = self.points.number;
    var name = self.points.name;
    var status = self.points.status;
    var curXY = self.points.currentXY;
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
  };

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
  };

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
  };

  self.__renamePoint = function(pointIdx) {
    // Get the point name
    bootbox.prompt({
      title: i18n.t('videoSensorTab.configureTrackedPointNameModal.title'),
      value: self.points.name[pointIdx],
      callback: function(result) {
        if (result) {
          self.points.name[pointIdx] = result;
        } // Cancel clicked
      }
    });
  };
}


// Model to manage the Video x-Sensor.
function VideoSensorTabViewModel(appContext) {
  'use strict';

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
  };
  
  self.__doSendSensorValue = function(value) {
    self.context.ev3BrickServer.streamXSensorValue(self.sensorName(), "Vid1", value);
  };

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
  };

  self.videoAccessRefused = function(err) {
    console.log("Error: " + JSON.stringify(err));
    alert(i18n.t("videoSensorTab.errors.videoAccessRefused"));
  };

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
  };

  self.__clearCanvas = function() {
    self.canvasCtx.clearRect(0, 0, self.WIDTH, self.HEIGHT);
  };

  self.onCanvasClick = function(data, event) {
    if(self.isStarted()) {
      var rect = self.canvas.getBoundingClientRect();
      var x = event.clientX - rect.left;
      var y = event.clientY - rect.top;

      if ((x > 0) && (y > 0) && (x < self.WIDTH) && (y < self.HEIGHT)) { // Add a new point
        self.ptce.onClick(x, y);
      }
    }
  };
}
