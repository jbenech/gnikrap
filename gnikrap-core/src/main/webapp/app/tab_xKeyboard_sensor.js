/*
 * Gnikrap is a simple scripting environment for the Lego Mindstrom EV3
 * Copyright (C) 2014-2016 Jean BENECH
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
    self.keyboardFilename = undefined;

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
    self.context.manageFilesVM.display(
      self.loadKeyboardFile,
      function() { return "/rest/xkeyboardfiles/"; },
      function(filename) { return "/rest/xkeyboardfiles/" + filename; }
    );
  };
  
  self.loadKeyboardFile = function(filename) {
    self.keyboardFilename = undefined;
    console.log("Try loading keyboard: '" + filename + "'");
    $.ajax({
      url: "/rest/xkeyboardfiles/" + filename,
      success: function(data, status) {
        console.log("Keyboard downloaded from server: '" + filename + "'");
        var keyboardFile = JSON.parse(data);
        self.loadFromJSON(keyboardFile.content);
        if(filename.indexOf("__") != 0) { // Not read-only => memorize the filename
          self.keyboardFilename = filename;
        }
      },
      error: function(XMLHttpRequest, textStatus, errorThrown) {
        // XMLHttpRequest.status: HTTP response code
        self.context.messageLogVM.addMessage(true, i18n.t("keyboardSensorTab.errors.cantLoadKeyboardFile",
          { "filename": filename, causedBy: ("" + XMLHttpRequest.status + " - " +  errorThrown)}));
      }
    });
  };  
  
  self.loadFromJSON = function(json) {
    var keyboard = JSON.parse(json);
    if(keyboard && keyboard.version && keyboard.version == 1) {
      self.__doResetKeyboard();
      self.sensorName(keyboard.sensorName);
      keyboard.buttons.forEach(function(line, idxLine) {
        line.forEach(function(btn, idxBtn) {
          self.buttons[idxLine][idxBtn].name(self.__buildNameFromActions(btn.actions));
          self.buttons[idxLine][idxBtn].actions = btn.actions;
        });
      });
    } else {
      // XMLHttpRequest.status: HTTP response code
      self.context.messageLogVM.addMessage(true, i18n.t("keyboardSensorTab.errors.invalidKeyboadFile",
        { "version: ": (keyboard ? keyboard.version : "undefined")}));
    }
  }

  self.saveToJSON = function() {
    var keyboard = {};
    keyboard.version = 1;
    keyboard.sensorName = self.sensorName();
    keyboard.buttons = [];
    self.buttons.forEach(function(line) {
      var lineToSave = [];
      line.forEach(function(btn) {
        lineToSave.push({ name: btn.name,
                    actions: btn.actions });
      });
      keyboard.buttons.push(lineToSave);
    });

    return JSON.stringify(keyboard);
  }
  
  self.onSaveKeyboard = function() {    
    bootbox.prompt({
      title: i18n.t('keyboardSensorTab.saveKeyboardModal.title'),
      value: (self.keyboardFilename ? self.keyboardFilename : ""),
      callback: function(result) {
        if (result && (result.trim().lenght != 0)) {
          var filename = result.trim();
          console.log("Save keyboard: '" + filename + "'");
          $.ajax({
            url: "/rest/xkeyboardfiles/" + filename,
            content: "application/json",
            data:  JSON.stringify({
              name: filename,
              content: self.saveToJSON()
            }),
            type: "PUT",
            success: function(data, status) {
              self.keyboardFilename = filename;
              self.context.messageLogVM.addMessage(false, i18n.t("keyboardSensorTab.keyboardSuccessfullySaved", {"filename": filename }));
            },
            error: function(XMLHttpRequest, textStatus, errorThrown) {
              self.context.messageLogVM.addMessage(true, i18n.t("keyboardSensorTab.errors.cantSaveKeyboardFile",
                { "filename": filename, causedBy: ("" + XMLHttpRequest.status + " - " +  errorThrown)}));
            }
          });
        } // else: cancel clicked
      }
    });
  };

  self.doResize = function(workAreaHeight, usefullWorkAreaHeight) {
    $('.xkeyboard-touch').css('height', Math.round(
      Math.max(45, Math.min(window.innerWidth / 6, // Max height for better display for devices in portrait mode 
          (usefullWorkAreaHeight - 10) / 4))).toString() + 'px');          
  };
}
