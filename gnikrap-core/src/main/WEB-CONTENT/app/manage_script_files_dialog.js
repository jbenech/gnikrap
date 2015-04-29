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

 
// Model that manage the "load/manage scripts" dialog
function ManageScriptFilesViewModel(appContext) {
  var self = this;
  { // Init
    self.context = appContext; // The application context
    self.files = ko.observableArray();
  }

  self.display = function() {
    self.doRefreshFileList();
    $('#manageScriptFilesModal').modal('show');
  }

  self.hide = function() {
    $('#manageScriptFilesModal').modal('hide');
  }

  self.doRefreshFileList = function() {
    // Retrieve the list from the server
    self.files.removeAll();
    $.ajax({
      url: "/rest/scriptfiles/",
      success: function(data, status) {
        var scriptFiles = JSON.parse(data);
        for(var i = 0; i < scriptFiles.length; i++) {
          //console.log("Adding: " + scriptFiles[i]);
          scriptFiles[i].isReadWrite = (scriptFiles[i].name.indexOf("__") != 0);
          self.files.push(scriptFiles[i]);
        }
        $("#manageScriptFilesModal .i18n").i18n(); // DOM generated by Knockout isn't i18n => Need to re-translate the modal
      },
      error: function(XMLHttpRequest, textStatus, errorThrown) {
        // XMLHttpRequest.status: HTTP response code
        self.context.messageLogVM.addMessage(true, i18n.t("manageScriptFilesModal.errors.cantRetrieveListOfScriptFiles",
          { causedBy: ("" + XMLHttpRequest.status + " - " +  errorThrown)}));
        self.hide();
      }
    });
  }

  self.onLoadScript = function(file) {
    self.hide();
    self.context.scriptEditorTabVM.loadScriptFile(file.name);
  }

  self.onDeleteScript = function(file) {
    bootbox.confirm(i18n.t("manageScriptFilesModal.confirmScriptFileDeletion", { filename: file.name }), function(result) {
      if(result) {
        self.files.remove(file);
        $.ajax({
          url: "/rest/scriptfiles/" + file.name,
          type: "DELETE",
          success: function(data, status) {
            console.log("Script file: '" + file.name + "' successfully deleted");
          },
          error: function(XMLHttpRequest, textStatus, errorThrown) {
            // XMLHttpRequest.status: HTTP response code
            alert(i18n.t("manageScriptFilesModal.errors.cantDeleteScriptFile",
                { filename: result, causedBy: ("" + XMLHttpRequest.status + " - " +  errorThrown)}));
            self.doRefreshList();
          }
        });
      } // else cancel
    });
  }
}
