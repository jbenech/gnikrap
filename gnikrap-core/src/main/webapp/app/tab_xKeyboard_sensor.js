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


// Model to manage the keyboard x-Sensor
function KeyboardSensorTabViewModel(appContext) {
  'use strict';

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
    
    // Register events
    $.subscribe(self.context.events.resize, function(evt, workAreaHeight, usefullWorkAreaHeight) {
      self.doResize(workAreaHeight, usefullWorkAreaHeight);
    });
  }
  
  self.onStart = function() {
    self.isStarted(!self.isStarted());

    // Switch the button status according to the mode & button content
    self.buttons.forEach(function(e0) {
      e0.forEach(function(e1) {
        e1.isDisabled(self.isStarted() && (e1.name().length == 0));
        e1.isPressed = false;
      });
    });

    self.__doNotifyStateChanged(true);
  };

  self.__doOnButtonPressed = function(btn) {
    if(self.isStarted()) {
      btn.isPressed = true;
      self.__doNotifyStateChanged(false);
    } else {
      bootbox.prompt({
        title: i18n.t('keyboardSensorTab.configureKeyboardButtonModal.title'),
        value: btn.name(),
        callback: function(result) {
          if (result) {
            btn.actions = self.__splitNameToActions(result);
            btn.name(self.__buildNameFromActions(btn.actions));
          } // else, cancel clicked
        }
      });
    }
  };
  
  self.__doOnButtonRelease = function(btn) {
    if(btn.isPressed) {
      btn.isPressed = false;
      self.__doNotifyStateChanged(false);
    } // else, useless event
  };

  self.__splitNameToActions = function(name) {
    return name.trim().split(",")
      .map(function(e) { return e.trim(); })
      .filter(function(e) { return e.length > 0; });
  };

  self.__buildNameFromActions = function(actions) {
    return actions.reduce(function(val, elt) {
              return (val.length == 0 ? val : val + ", ") + elt;
            }, "");
  };

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
          });
        });
      }
      self.context.ev3BrickServer.sendXSensorValue(self.sensorName(), "Tch1", xValue);
    }
  };

  self.onResetKeyboard = function() {
    bootbox.confirm(i18n.t("keyboardSensorTab.resetKeyboardModal.title"), function(result) {
      if(result) {
        self.__doResetKeyboard();
      }
    });
  };

  self.__doResetKeyboard = function() {
    self.buttons.forEach(function(e0) {
      e0.forEach(function(e1) {
        e1.name("");
        e1.actions = [];
        e1.isDisabled(false);
        e1.isPressed = false;
      });
    });
  };

  self.onLoadKeyboard = function() {
    // TODO: Reuse the dialog for the script ?
    console.log("TODO: onLoadKeyboard");
  };

  self.onSaveKeyboard = function() {
    // TODO: Save subset of buttons as a json
    console.log("TODO: onSaveKeyboard");
  };

  self.doResize = function(workAreaHeight, usefullWorkAreaHeight) {
    $('.xkeyboard-touch').css('height', Math.round(
      Math.max(45, Math.min(window.innerWidth / 6, // Max height for better display for devices in portrait mode 
          (usefullWorkAreaHeight - 10) / 4))).toString() + 'px');          
  };
}
