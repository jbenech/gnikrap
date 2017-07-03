/*
 * Gnikrap is a simple scripting environment for the Lego Mindstrom EV3
 * Copyright (C) 2017-2017 Jean BENECH
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


// Model that manage the "ViewCode" dialog
function ViewCodeViewModel(appContext) {
  'use strict';

  var self = this;
  (function() { // Init
    self.context = appContext; // The application context
    self.code = ko.observable("");
  })();
  
  self.display = function(codeToDisplay) {
    console.log("Dialog display code" + codeToDisplay);
    self.code(codeToDisplay);
    $('#viewCodeModal').modal('show');
  };
  
  self.hide = function() {
    $('#viewCodeModal').modal('hide');
  };
}
