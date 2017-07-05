/*
 * Gnikrap is a simple scripting environment for the Lego Mindstrom EV3
 * Copyright (C) 2014-2017 Jean BENECH
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


// Stuff reworked from things found on the internet without explicit copyright

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

var Utils = (function() {
  // Round by keeping only 2 decimal
  var round2dec = function (n) {
    // return Number(n.toFixed(2));
    return Math.round(n * 100) / 100;
  };

  // Generate a UUID
  var generateUUID = function () {
    var d = new Date().getTime();
    var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = (d + Math.random()*16)%16 | 0;
        d = Math.floor(d/16);
        return (c=='x' ? r : (r&0x3|0x8)).toString(16);
    });
    return uuid;
  };
  
  // From: http://www.jquerybyexample.net/2012/06/get-url-parameters-using-jquery.html
  var getUrlParameter = function (sParam) {
    var sPageURL = window.location.search.substring(1);
    var sURLVariables = sPageURL.split('&');
    for (var i = 0; i < sURLVariables.length; i++) {
        var sParameterName = sURLVariables[i].split('=');
        if (sParameterName[0] == sParam) {
            return sParameterName[1];
        }
    }
  };
    
  /**
   * From a JS line, compute the last 2 significant identifier for the current context. 
   * Return an array of 2 element (elements can be undefined)
   *
   * Sample:
   *  getJSContext("abc(); xxx"): [undefined, xxx]
   *  getJSContext("abc('foo', bar.getA()).xxx"):  [abc, xxx]
   *  getJSContext("abc('foo', bar.getA(), xxx"): [undefined, xxx]
   *  getJSContext("abc.xxx"): [abc, xxx]
   *  getJSContext("abc(xxx"): [undefined, xxx]
   *  getJSContext("abc."): [abc, '']
   *  getJSContext(""): [undefined, '']
   *  getJSContext("abc = xxx"): [undefined, xxx] // Same with other sign: +-/*% &|!?:<>~
   *  getJSContext("abc[4].xxx"): [abc, xxx]
   *
   * Things that can be improved:
   *  getJSContext("(abc).xxx"): [undefined, xxx] // Will be more accurate with [abc, xxx]
   */
  var getJSContext = function(line) {
    var temp = line.split(/[=;\+\-\/\*\%\&\|\!\?\:\<\>\~]/).pop().trim(); // Last element of the array
    // eat matching parenthesis
    function eatMatchingChars(text, open, close) {
      var acc = text.split("").reduceRight(function(acc, b) {
        if(acc.level < 0) {
          return acc;
        }
        if(b == close) {
          acc.level = acc.level + 1;
        } else if(b == open) {
          acc.level = acc.level - 1;
        } else if(acc.level == 0) {
          acc.data.push(b);
        }
        return acc;
      }, {level: 0, data: []});
      return acc.data.reverse().join("");
    }
    temp = eatMatchingChars(temp, "(", ")");
    temp = eatMatchingChars(temp, "[", "]");
    temp = eatMatchingChars(temp, "{", "}");
    
    temp = temp.split(",").pop().trim();
    var significantToken = temp.split(".");
    var current = significantToken.pop().trim();
    var previous = significantToken.pop();
    if(previous) {
      previous = previous.trim();
    }
    if(previous && previous.indexOf("\"") >= 0) {
      previous = undefined;
    }
    
    return [previous, current];
  };
  
  return {
    round2dec: round2dec,
    generateUUID: generateUUID,
    getUrlParameter: getUrlParameter,
    getJSContext: getJSContext
  };
})();


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
};

// Binding used for setting data-i18n tag and i18n class
ko.bindingHandlers['i18n'] = {
  update: function (element, valueAccessor) {
    var valueUnwrapped = ko.unwrap(valueAccessor());
    if(valueUnwrapped) {
      $(element)
        .attr("data-i18n", valueUnwrapped)
        .removeClass("i18n") // Remove in order to avoid duplicate i18n (maybe useless ?)
        .addClass("i18n")
        .i18n(); // Finally translate the item
    } else {
      // Useless case
      $(element)
        .removeAttr("data-i18n")
        .removeClass("i18n");
    }
  }
};
