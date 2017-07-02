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


// Model to manage the navigation bar actions
function NavigationBarViewModel(appContext) {
  'use strict';

  var self = this;
  { // Init
    self.context = appContext; // The application context
    self.workAreaItems = ko.observableArray();
    
    self.btnScript = {
        name: "SCRIPT_EDITOR",
        data_i18n: "workArea.scriptEditorTab",
        tabId: "scriptEditorTab",
        active: ko.observable(true)
      };
    
    self.btnKeyboard = {
        name: "xKEYBOARD",
        data_i18n: "workArea.keyboardSensorTab",
        tabId: "keyboardSensorTab",
        active: ko.observable(false)
      };
    
    self.btnGyro = {
        name: "xGYRO",
        data_i18n: "workArea.gyroSensorTab",
        tabId: "gyroSensorTab",
        active: ko.observable(false)
      };
      
    self.btnVideo = {
        name: "xVIDEO",
        data_i18n: "workArea.videoSensorTab",
        tabId: "videoSensorTab",
        active: ko.observable(false)
      };
      
    self.btnGeo = {
        name: "xGEO",
        data_i18n: "workArea.geoSensorTab",
        tabId: "geoSensorTab",
        active: ko.observable(false)
      };
    
    self.context.events.changeSettings.add(function(keyChanged, newValue) {
      if("programmingStyle" == keyChanged) {
        self.__doChangeProgrammingStyle();
      }
    });
  }

  // Auto collapse navbar while collapse feature is enabled (screen width is < 768)
  self.__collapseNavbar = function() {
    if($("#bs-navbar-collapse-1-button").css("display") != "none") {
      $("#bs-navbar-collapse-1-button").click();
    }
  };
  
  self.__doChangeProgrammingStyle = function() {
    self.workAreaItems.removeAll();
    self.workAreaItems.push(self.btnScript);
    if("TEXT" == self.context.settings.programmingStyle) {
      self.workAreaItems.push(self.btnKeyboard);
      if(window.DeviceOrientationEvent) {
        self.workAreaItems.push(self.btnGyro);
      } // else: Don't show xGyro, not supported by the browser
      if(self.context.compatibility.isUserMediaSupported()) {
        self.workAreaItems.push(self.btnVideo);
      } // else: Don't show xVideo, video/WebCam not supported by the browser
      if(navigator.geolocation) {
        self.workAreaItems.push(self.btnGeo);
      } // else: Don't show xGeo, GPS not supported by the browser
    }
    self.onShowWorkAreaItem(self.btnScript);
  }
  
  self.onRunScript = function() {
    self.doRunScript(false);
  };

  self.doRunScript = function(stopRunningScript) {
    var value = (self.context.scriptEditorTabVM ? self.context.scriptEditorTabVM.getValue() : null);

    // Execute the script
    if(value) {
      self.context.ev3BrickServer.runScript(value, stopRunningScript);
    }
  };

  self.onStopScript = function() {
    self.context.ev3BrickServer.stopScript();
  };

  self.onDisplayAbout = function() {
    $('#aboutModal').modal("show");
    self.__collapseNavbar();
  };
  
  self.onFullScreen = function() {
    self.context.compatibility.toggleFullScreen();
    self.__collapseNavbar();
  };

  self.onStopGnikrap = function() {
    bootbox.dialog({
      title: i18n.t("navigationBar.confirmStopGnikrap.title"),
      message: i18n.t("navigationBar.confirmStopGnikrap.message"),
      buttons: {
        cancel: {
          label: i18n.t("navigationBar.confirmStopGnikrap.cancel"),
          className: "btn-primary",
          callback: function() { /* Cancel */ }
        },
        stopGnikrap: {
          label: i18n.t("navigationBar.confirmStopGnikrap.stopGnikrap"),
          className: "btn-default",
          callback: function() {
            self.context.ev3BrickServer.stopGnikrap();
          }
        },
        shutdownBrick: {
          label: i18n.t("navigationBar.confirmStopGnikrap.shutdownBrick"),
          className: "btn-default",
          callback: function() {
            self.context.ev3BrickServer.shutdownBrick();
          }
        }
      }
    });
  };
  
  self.onDisplaySettings = function() {
    self.context.settingsVM.display();
    self.__collapseNavbar();
  };
  
  self.onDisplayImportImages = function() {
    self.context.importImagesVM.display();
    self.__collapseNavbar();
  };

  self.onShowWorkAreaItem = function(workAreaItem) {
    // Set the active item in the model and on screen
    var items = self.workAreaItems(); // return a regular array
    for(var i = 0; i < items.length; i++) {
      items[i].active(items[i].tabId == workAreaItem.tabId);
      $("#" + items[i].tabId).toggleClass("active", items[i].active());
      self.context.events.tabDisplayedChanged.fire(items[i].tabId, items[i].active());
    }
    self.__collapseNavbar();
  };
}
