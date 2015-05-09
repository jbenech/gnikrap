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


// Basic checks for "browser compatibility"
//
// Note: Don't perform this check in jQuery .ready() callback as version 2.x of jQuery don't have compatibility with some 'old' browser.
//       Don't use i18n as it doesn't work on some old browser (eg. IE8)
if(!('WebSocket' in window && 
      'matchMedia' in window)) { // A minimal level of css for bootstrap
  alert("Gnikrap can't run in this browser, consider using a more recent browser.\nThe page will be automatically closed.");
  window.close();
}


var context = { // The application context - used as a basic dependency-injection mechanism
  events: {
    resize: "gnikrap_resize", // Params: workAreaHeight, usefullWorkAreaHeight
    changeSettings: "gnikrap_changeSettings" // Params: keyChanged, newValue
  }
};

context.settings = (function() { // Load application settings
  var STORAGE_SETTINGS = "gnikrap_settings";

  var loaded = localStorage[STORAGE_SETTINGS];
  console.log("loaded: " + loaded);
  var settings = {};
  if(loaded) {
    settings = JSON.parse(loaded);
  }
  
  if(!settings.language) {
    var language_complete = navigator.language.split("-");
    settings.language = (language_complete[0]);
  }

  if(!settings.programingStyle) {
    settings.programingStyle = "TEXT";
  }

  settings.update = function(newSettings) {
    // Note function called latter on, but 'settings' should the same object as 'context.settings'
    var needSave = false;
    for(var key in newSettings) {
      if(settings[key] && settings[key] != newSettings[key]) {
        settings[key] = newSettings[key];
        $.publish(context.events.changeSettings, [key, settings[key]]);
        needSave = true;
      }
    }
    if(needSave) {
      localStorage[STORAGE_SETTINGS] = JSON.stringify(settings);
    }
  };

  return settings;
}());


// Initialization of the application
$(document).ready(function() {
  'use strict';

  // Translation
  i18n.init({ fallbackLng: 'en', lng: context.settings.language }, function() {
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
    ko.applyBindings(context.manageScriptFilesVM, $("#manageScriptFilesModal")[0]);
    ko.applyBindings(context.settingsVM, $("#settingsModal")[0]);
    ko.applyBindings(context.importImagesVM, $("#importImagesModal")[0]);

    // Other initialization
    context.ev3BrickServer.initialize(); // WS connexion with the server
    context.scriptEditorTabVM.loadScriptFile("__default__.js"); // Load default script
    
    // Register windows events for editor auto-resize
    window.onresize = function() {
      var workAreaHeight = window.innerHeight - 60; // Should be synchronized with body.padding-top
      var usefullWorkAreaHeight = workAreaHeight - 35; // Also remove the button bar
      $.publish(context.events.resize, [workAreaHeight, usefullWorkAreaHeight]);
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
