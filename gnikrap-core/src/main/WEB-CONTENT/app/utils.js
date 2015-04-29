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
