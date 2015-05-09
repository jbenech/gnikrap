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


// Model to manage the script editor tab
function ScriptEditorTabViewModel(appContext) {
  'use strict';

  var self = this;
  { // Init
    self.context = appContext; // The application context
    self.editor = undefined;
    self.scriptFilename = undefined;
  
    self.editor = ace.edit("editor");
    self.editor.setTheme("ace/theme/chrome");
    self.editor.getSession().setMode("ace/mode/javascript");
    self.editor.getSession().setTabSize(2);
    self.editor.getSession().setUseSoftTabs(true); // Use spaces instead of tabs
    
    // Register events
    $.subscribe(self.context.events.resize, function(evt, workAreaHeight, usefullWorkAreaHeight) {
      self.doResize(workAreaHeight, usefullWorkAreaHeight);
    });
  }

  self.onClearScript = function() {
    bootbox.confirm(i18n.t("scriptEditorTab.clearScriptModal.title"), function(result) {
      if(result) {
        self.__doClearScript();
      }
    });
  };

  self.onLoadScript = function() {
    self.context.manageScriptFilesVM.display();
  };

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
  };

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
  };

  this.getValue = function() {
    return self.editor.getValue();
  };

  this.doResize = function(workAreaHeight, usefullWorkAreaHeight) {
    $('#editor').css('height', Math.max(350, usefullWorkAreaHeight - 10).toString() + 'px');
    self.editor.resize();
  };

  this.__doClearScript = function() {
    self.__setValue("");
  };

  this.__setValue = function(value) {
    self.editor.setValue(value);
    self.editor.moveCursorTo(0, 0);
  };
}
