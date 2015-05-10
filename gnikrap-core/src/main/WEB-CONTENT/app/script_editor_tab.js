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


// An editor should have the following API:
//   doResize(workAreaHeight, usefullWorkAreaHeight): void
//   clearScript(): void
//   setValue(value): void
//   getValue(): Value
//   displatMessage(msg): void // Can do nothing
//   setVisible(visible): void

 
 // The Javascript editor based on ace (http://ace.c9.io/)
function JavascriptEditor(appContext) {
  'use strict';
  
  var self = this;
  { // Init
    self.context = appContext; // The application context
    self.ace = ace.edit("aceEditor");
    self.ace.setTheme("ace/theme/chrome");
    self.ace.getSession().setMode("ace/mode/javascript");
    self.ace.getSession().setTabSize(2);
    self.ace.getSession().setUseSoftTabs(true); // Use spaces instead of tabs
  }

  this.doResize = function(workAreaHeight, usefullWorkAreaHeight) {
    $('#aceEditor').css('height', Math.max(350, usefullWorkAreaHeight - 10).toString() + 'px');
    self.ace.resize();
  };
  
  this.clearScript = function() {
    self.setValue("");
  };
  
  this.setValue = function(value) {
    self.ace.setValue(value);
    self.ace.moveCursorTo(0, 0);
  };
  
  this.displayMessage = function(msg) {
    self.setValue(msg);
  };
  
  this.setVisible = function(visible) {
    if(visible) {
      $('#aceEditor').css('display', '');
    } else {
      $('#aceEditor').css('display', 'none');
    }
  };
}

function BlocklyEditor(appContext) {
  'use strict';
  
  var self = this;
  { // Init
    self.context = appContext; // The application context
    Blockly.inject(document.getElementById('blocklyEditor'),
        { /*toolbox: document.getElementById('toolbox') */ });
  }
  
  this.doResize = function(workAreaHeight, usefullWorkAreaHeight) {
    $('#blocklyEditor').css('height', Math.max(350, usefullWorkAreaHeight - 10).toString() + 'px');
    //self.ace.resize();
  };
  
  this.clearScript = function() {
    self.setValue("");
  };
  
  this.setValue = function(value) {
    self.ace.setValue(value);
    self.ace.moveCursorTo(0, 0);
  };
  
  this.displayMessage = function(msg) {
    // Does nothing
  };

  this.setVisible = function(visible) {
    if(visible) {
      $('#blocklyEditor').css('display', '');
    } else {
      $('#blocklyEditor').css('display', 'none');
    }
  };
}  

// Model to manage the script editor tab
function ScriptEditorTabViewModel(appContext) {
  'use strict';

  var self = this;

  { // Init
    self.context = appContext; // The application context
    self.scriptFilename = undefined;
    self.editor = undefined;
    self.javascriptEditor = undefined;
    self.blocklyEditor = undefined;

    // Register events
    $.subscribe(self.context.events.resize, function(evt, workAreaHeight, usefullWorkAreaHeight) {
      if(self.editor) {
        self.editor.doResize(workAreaHeight, usefullWorkAreaHeight);
      }
    });
    $.subscribe(self.context.events.changeSettings, function(evt, keyChanged, newValue) {
      if("programmingStyle" == keyChanged) {
        self.__doChangeEditor();
      }
    });
  }

  self.__doChangeEditor = function() {
    if(self.editor) {
      self.editor.setVisible(false);
      self.editor = undefined;
    }
    if("TEXT" == self.context.settings.programmingStyle) {
      if(self.javascriptEditor == undefined) {
        console.log("JavaScript editor created");
        self.javascriptEditor = new JavascriptEditor(self.context);
      }
      console.log("Editor set to JavaScript editor");
      self.editor = self.javascriptEditor;
    } else {
      if(self.blocklyEditor == undefined) {
        console.log("Blockly editor created");
        self.blocklyEditor = new BlocklyEditor(self.context);
      }
      console.log("Editor set to Blockly editor");
      self.editor = self.blocklyEditor;
    }
    self.editor.setVisible(true);
  };
    
  self.onClearScript = function() {
    bootbox.confirm(i18n.t("scriptEditorTab.clearScriptModal.title"), function(result) {
      if(result) {
        self.editor.clearScript();
      }
    });
  };

  self.onLoadScript = function() {
    self.context.manageScriptFilesVM.display();
  };

  self.loadScriptFile = function(filename) {
    if(self.editor == undefined) {
      return;
    }
    self.editor.displayMessage(i18n.t("scriptEditorTab.loadingScripWait", { "filename": filename }));
    self.scriptFilename = undefined;
    $.ajax({
      url: "/rest/scriptfiles/" + filename,
      success: function(data, status) {
        var scriptFile = JSON.parse(data);
        self.editor.setValue(scriptFile.content);
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
}
