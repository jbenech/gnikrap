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


// Model that manage the "Settings" dialog
function SettingsViewModel(appContext) {
  'use strict';

  var self = this;
  (function() { // Init
    self.context = appContext; // The application context
    self.language = ko.observable("");
    self.programmingStyle = ko.observable("TEXT");
  })();
  
  self.display = function() {
    // Initialize the values
    self.language(self.context.settings.language);
    self.programmingStyle(self.context.settings.programmingStyle);

    $('#settingsModal').modal('show');
  };
  
  self.hide = function() {
    $('#settingsModal').modal('hide');
  };

  self.onSave = function() {
    self.context.settings.update({
      language: self.language(),
      programmingStyle: self.programmingStyle()
    });

    self.hide();
  };
}
