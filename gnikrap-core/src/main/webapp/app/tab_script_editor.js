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


// An editor should have the following API:
//   doResize(workAreaHeight, usefullWorkAreaHeight): void
//   clearScript(): void
//   getValue(): Value
//   setVisible(visible): void
//   saveScript(): void
//   displayLoadScriptDialog(): void
//   loadDefaultScript(): void

 
 // The Javascript editor based on ace (http://ace.c9.io/)
function JavascriptEditor(appContext) {
  'use strict';
  
  var self = this;
  (function() { // Init
    self.context = appContext; // The application context
    self.scriptFilename = undefined;
    self.langTools = ace.require("ace/ext/language_tools");
    self.ace = ace.edit("aceEditor");
    // Possible options: https://github.com/ajaxorg/ace/wiki/Configuring-Ace
    self.ace.setOptions({
        enableBasicAutocompletion: true,
        vScrollBarAlwaysVisible: true });
    self.ace.setTheme("ace/theme/chrome");
    self.ace.getSession().setMode("ace/mode/javascript");
    self.ace.getSession().setTabSize(2);
    self.ace.getSession().setUseSoftTabs(true); // Use spaces instead of tabs

    // Enable auto-completion    
    self.autoCompleteList = [];
    var tmp = i18n.t("autocompletion", { returnObjectTrees: true })
    for(var type in tmp) {
      self.autoCompleteList = self.autoCompleteList.concat(tmp[type].map(function(word) {
                return { caption: word, value: word, score: 100, meta: type };
        }));
    }

    var staticWordCompleter = {
      getCompletions: function(editor, session, pos, prefix, callback) {
        callback(null, self.autoCompleteList);
      }
    }
    // Reset the completers: The default completer add too much useless keyword for us
    self.langTools.setCompleters([staticWordCompleter, self.langTools.textCompleter, self.langTools.snippetCompleter]);
  })();

  self.doResize = function(workAreaHeight, usefullWorkAreaHeight) {
    $('#aceEditor').css('height', Math.max(350, usefullWorkAreaHeight - 10).toString() + 'px');
    self.ace.resize();
  };
  
  self.clearScript = function() {
    self.setValue("");
  };
  
  self.setValue = function(value) {
    self.ace.setValue(value);
    self.ace.moveCursorTo(0, 0);
  };

  self.setVisible = function(visible) {
    if(visible) {
      $('#aceEditor').css('display', '');
    } else {
      $('#aceEditor').css('display', 'none');
    }
  };
  
  self.getValue = function() {
    return self.ace.getValue();
  };
  
  self.displayLoadScriptDialog = function() {
    self.context.manageFilesVM.display(
      self.loadScriptFile,
      function() { return "/rest/scriptfiles/"; },
      function(filename) { return "/rest/scriptfiles/" + filename; }
    );
  };
  
  self.loadScriptFile = function(filename) {
    self.setValue(i18n.t("scriptEditorTab.loadingScripWait", { "filename": filename }));
    self.scriptFilename = undefined;
    $.ajax({
      url: "/rest/scriptfiles/" + filename,
      success: function(data, status) {
        var scriptFile = JSON.parse(data);
        self.setValue(scriptFile.content);
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
  
  self.saveScript = function() {
    bootbox.prompt({
      title: i18n.t('scriptEditorTab.saveScriptModal.title'),
      value: (self.scriptFilename ? self.scriptFilename : ""),
      callback: function(result) {
        if (result && (result.trim().lenght != 0)) {
          var filename = result.trim();
          console.log("Save script: '" + filename + "'");
          $.ajax({
            url: "/rest/scriptfiles/" + filename,
            content: "application/json",
            data:  JSON.stringify({
              name: filename,
              content: self.getValue()
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
  
  self.loadDefaultScript = function() {
    self.loadScriptFile("__default__.js");
  }
}

function BlocklyEditor(appContext) {
  'use strict';
  
  var self = this;
  (function() { // Init
    self.context = appContext; // The application context

    self.blockly = new GnikrapBlocks();
    self.blockly.injectInDOM(document.getElementById('blocklyEditor'), self.context.settings.language);

    // Register events
    $.subscribe(self.context.events.languageReloaded, function(evt) {
      self.blockly.updateLanguage(self.context.settings.language);
    });
  })();
  
  self.doResize = function(workAreaHeight, usefullWorkAreaHeight) {
    $('#blocklyEditor').css('height', Math.max(350, usefullWorkAreaHeight - 10).toString() + 'px');
  };
  
  self.clearScript = function() {
    self.blockly.clear();
  };
  
  /*
  self.setValue = function(value) {
    // TODO
  };
  */
  
  self.setVisible = function(visible) {
    if(visible) {
      $('#blocklyEditor').css('display', '');
    } else {
      $('#blocklyEditor').css('display', 'none');
    }
  };

  self.getValue = function() {
    var result = self.blockly.buildJavascriptCode();
    console.log("Code generated: " + result.code);

    result.warnings.forEach(function(warn) {
        self.context.messageLogVM.addMessage(true, warn);
      });
    result.errors.forEach(function(err) {
        self.context.messageLogVM.addMessage(true, err);
      });

    return (result.errors.length > 0 ? undefined : result.code);
  };

  self.displayLoadScriptDialog = function() {
    // TODO
  };

  self.loadScriptFile = function(filename) {
    // TODO
  };

  self.saveScript = function() {
    // TODO
  }
  
  self.loadDefaultScript = function() {
    // Does nothing
  }
}  

// Model to manage the script editor tab
function ScriptEditorTabViewModel(appContext) {
  'use strict';

  var self = this;
  (function() { // Init
    self.context = appContext; // The application context
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
  })();

  self.__doChangeEditor = function() {
    if(self.editor) {
      self.editor.setVisible(false);
      self.editor = undefined;
    }
    if("TEXT" == self.context.settings.programmingStyle) {
      if(self.javascriptEditor == undefined) {
        console.log("Create JavaScript editor...");
        self.javascriptEditor = new JavascriptEditor(self.context);
        self.javascriptEditor.loadDefaultScript();
      }
      console.log("Editor set to JavaScript editor");
      self.editor = self.javascriptEditor;
    } else {
      if(self.blocklyEditor == undefined) {
        console.log("Create Blockly editor...");
        self.blocklyEditor = new BlocklyEditor(self.context);
        self.blocklyEditor.loadDefaultScript();
      }
      console.log("Editor set to Blockly editor");
      self.editor = self.blocklyEditor;
    }
    self.editor.setVisible(true);
    // Force resiez in order to ensure visibility
    $(window).resize();    
  };
    
  self.onClearScript = function() {
    bootbox.confirm(i18n.t("scriptEditorTab.clearScriptModal.title"), function(result) {
      if(result) {
        self.editor.clearScript();
      }
    });
  };

  self.onLoadScript = function() {
    if(self.context.settings.demoMode) {
      self.context.messageLogVM.addMessage(false, i18n.t("scriptEditorTab.demo.no_load"));
      return;
    }
    if(self.editor) {
      self.editor.displayLoadScriptDialog();
    } else {
      console.log("Cannot display load script dialog, self.edtior is not set");
    }
  };

  self.onSaveScript = function() {
    if(self.context.settings.demoMode) {
      self.context.messageLogVM.addMessage(false, i18n.t("scriptEditorTab.demo.no_save"));
      return;
    }
    if(self.editor) {
      self.editor.saveScript();
    } else {
      console.log("Cannot load script file, self.editor is not set");
    }
  };
  
  self.getValue = function() {
    return self.editor.getValue();
  };
}
