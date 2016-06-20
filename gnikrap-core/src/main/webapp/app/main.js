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


// Basic checks for "browser compatibility"
//
// Note: Don't perform this check in jQuery .ready() callback as version 2.x of jQuery don't have compatibility with some 'old' browser.
//       Don't use i18n as it doesn't work on some 'old' browser (eg. IE8)
if(!('WebSocket' in window && 
      'matchMedia' in window)) { // A minimal level of css for bootstrap
  alert("Gnikrap can't run in this browser, consider using a more recent browser.\nThe page will be automatically closed.");
  window.close();
}


var context = { // The application context - used as a basic dependency-injection mechanism
  // Define events that are used internally in the application (See https://api.jquery.com/category/callbacks-object/).
  events: {
    // Gnikrap resized event.
    // Params: workAreaHeight, usefullWorkAreaHeight
    resize: $.Callbacks('unique'),
    // Settings (configuration change event. 
    // Params: keyChanged, newValue
    // Be carefull, on 'language' translations may not have been reloaded, use 'languageReloaded' instead
    changeSettings: $.Callbacks('unique'),
    // Language reloaded event (the i18n has been updated with the new language).
    // Params: none
    languageReloaded: $.Callbacks('unique'),
    // The displayed tab has changed
    // Params: tabName, isVisible
    tabDisplayedChanged: $.Callbacks('unique')
  }  
};

// Define a settings object
function GnikrapSettings() {
  'use strict';

  var self = this;
  (function() { // Init
    self.STORAGE_SETTINGS = "gnikrap_settings";
    self.JSON_FIELDS = ['language', 'programmingStyle'];
    
    // Load 
    var loaded = localStorage[self.STORAGE_SETTINGS];
    console.log("Settings loaded on local storage: " + loaded);
    if(loaded) {
      try {
        var newSettings = JSON.parse(loaded);
        for(var key in newSettings) {
          if(self.JSON_FIELDS.indexOf(key) != -1) {
            self[key] = newSettings[key];
          }
        }
      } catch(ex) {
        console.log("Error: " + ex + " on settings loaded: " + loaded);
      }
    }
    
    // Language
    if(!self.language) {
      var language_complete = navigator.language.split("-");
      self.language = (language_complete[0]);
    }
    
    // ProgrammingStyle
    if(!self.programmingStyle) {
      self.programmingStyle = "TEXT";
    }
    // Override with url param if exist
    var param = Utils.getUrlParameter("programmingStyle");
    if(param && (param == "TEXT" || param == "VISUAL")) {
      self.programmingStyle = param;
    }
    
    // Demo mode (not http and no demo_mode parameter)
    self.demoMode = !((window.location.protocol.indexOf('http') == 0) && (Utils.getUrlParameter("demoMode") != "true"));
  })();
  
  self.update = function(newSettings) {
    var needSave = false;
    for(var key in newSettings) {
      if(self[key] && self[key] != newSettings[key]) {
        self[key] = newSettings[key];
        context.events.changeSettings.fire(key, self[key]);
        needSave = true;
      }
    }
    if(needSave) {
      localStorage[self.STORAGE_SETTINGS] = JSON.stringify(self, self.JSON_FIELDS);
    }
  };  
}
context.settings = new GnikrapSettings(context);

// Initialization of the application
$(document).ready(function() {
  'use strict';
  
  // Translation
  i18n.init({ fallbackLng: 'en', lng: context.settings.language }, function() {
    context.settings.language = i18n.lng(); // Set language really used    
    
    // Technical objects
    context.compatibility = compatibility;

    // Objects and 'ViewModel/VM' instantiation
    if(context.settings.demoMode) {
      context.ev3BrickServer = new DemoEV3BrickServer(context);
    } else {
      context.ev3BrickServer = new EV3BrickServer(context);
    }
    context.navigationBarVM = new NavigationBarViewModel(context);
    context.messageLogVM = new MessageLogViewModel(context);
    // Tabs
    context.scriptEditorTabVM = new ScriptEditorTabViewModel(context);
    context.keyboardSensorTabVM = new KeyboardSensorTabViewModel(context);
    context.gyroscopeSensorTabVM = new GyroscopeSensorTabViewModel(context);
    context.videoSensorTabVM = new VideoSensorTabViewModel(context);
    context.geoSensorTabVM = new GeoSensorTabViewModel(context);
    // Dialogs
    context.manageFilesVM = new ManageFilesViewModel(context);
    context.settingsVM = new SettingsViewModel(context);
    context.importImagesVM = new ImportImagesViewModel(context);

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
    ko.applyBindings(context.manageFilesVM, $("#manageFilesModal")[0]);
    ko.applyBindings(context.settingsVM, $("#settingsModal")[0]);
    ko.applyBindings(context.importImagesVM, $("#importImagesModal")[0]);

    // Other initialization
    context.ev3BrickServer.initialize(); // WebSsocket connexion with the server
    
    // Register config events to update translation if needed
    self.context.events.changeSettings.add(function(keyChanged, newValue) {
      if("language" == keyChanged) {
        i18n.setLng(context.settings.language, function(t) { 
          $(".i18n").i18n(); 
          context.events.languageReloaded.fire();
        });
      }
    });

    
    // Publish events for settings
    context.events.changeSettings.fire("programmingStyle", context.settings.programmingStyle);
    context.events.changeSettings.fire("language", context.settings.language);
    

    // Register windows events for editor auto-resize
    window.onresize = function() {
      var workAreaHeight = window.innerHeight - 60; // Should be synchronized with body.padding-top (in css/HTML)
      var usefullWorkAreaHeight = workAreaHeight - 35; // Also remove the button bar
      context.events.resize.fire(workAreaHeight, usefullWorkAreaHeight);
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
      return "";
    };  
  });
});
