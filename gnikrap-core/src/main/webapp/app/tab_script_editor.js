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


// An editor should have the following API:
//   doResize(workAreaHeight, usefullWorkAreaHeight): void
//   setVisible(visible): void
//   clearScript(): void
//   loadDefaultScript(): void
//   displayLoadScriptDialog(): void
//   saveScript(): void
//   getValue(): String // Return the JS code
//   displayJSCode(): String // Display the JS code
//   isJSViewable() : boolean // Is the JS code viewable

 
 // The Javascript editor using the ace component (http://ace.c9.io/)
function JavascriptEditor(appContext) {
  'use strict';
  
  var self = this;
  (function() { // Init
    self.context = appContext; // The application context
    self.STORAGE_URL_PREFIX = "/rest/scriptfiles/";
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
    self.keywordToCategories = {};
    var tmp = i18n.t("autocompletion", { returnObjectTrees: true }); // The whole object as defined in the json
    for(var type in tmp) {
      var typeData = tmp[type];
      self.autoCompleteList = self.autoCompleteList.concat(typeData.words.map(function(word) {
          return { caption: word, value: word, score: typeData.score, meta: type };
        }));
      
      typeData.keywords.forEach(function(kw) {
        var lkw = kw.toLowerCase();
        if(!self.keywordToCategories[lkw]) {
          self.keywordToCategories[lkw] = [];
        }
        self.keywordToCategories[lkw].push(type);
      });
    }
    
    var staticWordCompleter = {
      getCompletions: function(editor, session, pos, prefix, callback) {
        var line = session.getLine(pos.row);
        line = line.substring(0, pos.column);
        var context = Utils.getJSContext(line);
        var catKw = (context[0] ? context[0].toLowerCase() : "");
        var categories = Object.keys(self.keywordToCategories).filter(function(kw) {
            return (catKw == kw) || (kw.length > 0 && catKw.indexOf(kw) != -1);
          }).reduce(function(acc, kw) {
            return acc.concat(self.keywordToCategories[kw]);
          }, []);
        // var categories = self.keywordToCategories[catKw];
        console.log("Context: " + JSON.stringify(context) + ", categories: " + JSON.stringify(categories));
        var temp = JSON.parse(JSON.stringify(self.autoCompleteList)); // Need to clone each time otherwise the list is mixed
        if(categories) {
          callback(null, temp.map(function(item) {
              if(categories.indexOf(item.meta) != -1) {
                item.score = 1000;
                return item;
              }
              return item;
            }));
        } else {
          callback(null, temp);
        }        
      }
    }
    // Reset the completers: The default completer add too much useless keyword for us
    self.langTools.setCompleters([staticWordCompleter, self.langTools.textCompleter, self.langTools.snippetCompleter]);
  })();

  self.doResize = function(workAreaHeight, usefullWorkAreaHeight) {
    $('#aceEditor').css('height', Math.max(350, usefullWorkAreaHeight - 10).toString() + 'px');
    self.ace.resize();
  };
  
  self.setVisible = function(visible) {
    if(visible) {
      $('#aceEditor').css('display', '');
    } else {
      $('#aceEditor').css('display', 'none');
    }
  };

  self.clearScript = function() {
    self.setValue("");
  };

  self.loadDefaultScript = function() {
    self.loadScriptFile("__default__.js");
  };
  
  self.displayLoadScriptDialog = function() {
    self.context.manageFilesVM.display(
      self.loadScriptFile,
      function() { return self.STORAGE_URL_PREFIX; },
      function(filename) { return self.STORAGE_URL_PREFIX + filename; }
    );
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
            url: self.STORAGE_URL_PREFIX + filename,
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

  self.getValue = function() {
    return self.ace.getValue();
  };
  
  self.displayJSCode = function() {
    // Does nothing
  }
  
  self.isJSViewable = function() {
    return false;
  }
  
  self.setValue = function(value) {
    self.ace.setValue(value);
    self.ace.moveCursorTo(0, 0);
  };
  
  self.loadScriptFile = function(filename) {
    self.setValue(i18n.t("scriptEditorTab.loadingScripWait", { "filename": filename }));
    self.scriptFilename = undefined;
    $.ajax({
      url: self.STORAGE_URL_PREFIX + filename,
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
}

// The visual editor using Blockly (https://developers.google.com/blockly/)
function BlocklyEditor(appContext) {
  'use strict';
  
  var self = this;
  (function() { // Init
    self.context = appContext; // The application context
    self.STORAGE_URL_PREFIX = "/rest/blocklyfiles/";

    self.blockly = new GnikrapBlocks();
    self.blockly.injectInDOM(document.getElementById('blocklyEditor'), self.context.settings.language);

    // Define events function
    self.__onUpdateLanguage = function() {
      self.blockly.updateLanguage(self.context.settings.language);
    };
    self.__onTabDisplayedChanged = function(tabName, visible) {
      if(tabName == "scriptEditorTab") {
        self.setVisible(visible);
      } 
    };
    
    // Register events - /!\ Unregister all events in dispose
    self.context.events.languageReloaded.add(self.__onUpdateLanguage);
    self.context.events.tabDisplayedChanged.add(self.__onTabDisplayedChanged);
  })();
  
  self.doResize = function(workAreaHeight, usefullWorkAreaHeight) {
    $('#blocklyEditor').css('height', Math.max(350, usefullWorkAreaHeight - 10).toString() + 'px');
  };
  
  self.setVisible = function(visible) {
    self.blockly.setVisible(visible);
    if(visible) {
      $('#blocklyEditor').css('display', '');
      Blockly.fireUiEvent(window, 'resize');
    } else {
      $('#blocklyEditor').css('display', 'none');
    }
  };

  self.clearScript = function() {
    self.blockly.clear();
  };

  self.loadDefaultScript = function() {
    // Does nothing
  }

  self.displayLoadScriptDialog = function() {
    self.context.manageFilesVM.display(
      self.loadScriptFile,
      function() { return self.STORAGE_URL_PREFIX; },
      function(filename) { return self.STORAGE_URL_PREFIX + filename; }
    );
  };

  self.saveScript = function() {
    bootbox.prompt({
      title: i18n.t('scriptEditorTab.saveScriptModal.title'),
      value: (self.scriptFilename ? self.scriptFilename : ""),
      callback: function(result) {
        if (result && (result.trim().lenght != 0)) {
          var filename = result.trim();
          console.log("Save ev3blocks: '" + filename + "'");
          $.ajax({
            url: self.STORAGE_URL_PREFIX + filename,
            content: "application/json",
            data:  JSON.stringify({
              name: filename,
              content: JSON.stringify(self.blockly.getEV3Blocks()) // String expected by Java code
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
   }
  
  // Returns the JS code or undefined if there is errors
  self.getValue = function() {
    var result = self.blockly.buildJavascriptCode();

    result.warnings.forEach(function(warn) {
        self.context.messageLogVM.addMessage(true, warn);
      });
    result.errors.forEach(function(err) {
        self.context.messageLogVM.addMessage(true, err);
      });

    return (result.errors.length > 0 ? undefined : result.code);
  };

  self.displayJSCode = function() {
    var jsCode = self.getValue();
    if(jsCode) {
      self.context.viewCodeVM.display(jsCode);
    } else {
      bootbox.alert(i18n.t("scriptEditorTab.fixGenikrapErrorModal.title"));
    }
  }

  self.isJSViewable = function() {
    return true;
  }

  self.dispose = function() {
    self.context.events.tabDisplayedChanged.remove(self.__onTabDisplayedChanged);
    self.context.events.languageReloaded.remove(self.__onUpdateLanguage);
    self.blockly.dispose();
  }
  
  self.loadScriptFile = function(filename) {
    self.clearScript();
    self.scriptFilename = undefined;
    $.ajax({
      url: self.STORAGE_URL_PREFIX + filename,
      success: function(data, status) {
        try {
          var scriptFile = JSON.parse(data);
          var ev3blocks = JSON.parse(scriptFile.content);
          self.blockly.loadEV3Blocks(ev3blocks);
          if(filename.indexOf("__") != 0) { // Not read-only => memorize the filename
            self.scriptFilename = filename;
          }
        } catch(e) {
          self.context.messageLogVM.addMessage(true, i18n.t("scriptEditorTab.errors.cantLoadScriptFile",
          { "filename": filename, causedBy: ("" + e)}));
        }
      },
      error: function(XMLHttpRequest, textStatus, errorThrown) {
        // XMLHttpRequest.status: HTTP response code
        self.context.messageLogVM.addMessage(true, i18n.t("scriptEditorTab.errors.cantLoadScriptFile",
          { "filename": filename, causedBy: ("" + XMLHttpRequest.status + " - " +  errorThrown)}));
      }
    });
  };
}  

// Model to manage the script editor tab
function ScriptEditorTabViewModel(appContext) {
  'use strict';

  var self = this;
  (function() { // Init
    self.context = appContext; // The application context
    self.editor = undefined;
    self.isJSViewable = ko.observable(false);
    self.javascriptEditor = undefined;
    self.blocklyEditor = undefined;

    // Register events
    self.context.events.resize.add(function(workAreaHeight, usefullWorkAreaHeight) {
      if(self.editor) {
        self.editor.doResize(workAreaHeight, usefullWorkAreaHeight);
      }
    });
    self.context.events.changeSettings.add(function(keyChanged, newValue) {
      if("programmingStyle" == keyChanged) {
        self.__doChangeEditor();
      }
    });
  })();

  self.__doChangeEditor = function() {
    if(self.editor) {
      self.editor.setVisible(false);
      if(self.blocklyEditor) {
        self.blocklyEditor.dispose();
        self.blocklyEditor = undefined;
      }
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
      // Blockly has been disposed => Need to recreate it each time.
      console.log("Create Blockly editor...");
      self.blocklyEditor = new BlocklyEditor(self.context);
      self.blocklyEditor.loadDefaultScript();
      console.log("Editor set to Blockly editor");
      self.editor = self.blocklyEditor;
    }
    self.editor.setVisible(true);
    self.isJSViewable(self.editor.isJSViewable());
    // Force resize in order to ensure visibility
    $(window).resize();    
  };
    
  self.onClearScript = function() {
    if(self.editor) {
      bootbox.confirm(i18n.t("scriptEditorTab.clearScriptModal.title"), function(result) {
        if(result) {
          self.editor.clearScript();
        }
      });
    } else {
      console.log("Cannot clear script, self.editor is not set");
    }
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

  self.onViewJS = function() {
    if(self.editor) {
      self.editor.displayJSCode();
    } else {
      console.log("Cannot view JavaScript, self.editor is not set");
    }
  };
  
  self.getValue = function() {
    if(self.editor) {
      return self.editor.getValue();
    } else {
      console.log("Cannot getValue, self.editor is not set");
      return "";
    }
  };  
}