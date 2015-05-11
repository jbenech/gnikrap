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


// Model that manage the message log view
function MessageLogViewModel(appContext) { // appContext not used for MessageLog
  'use strict';

  var self = this;
  { // Init
    self.context = appContext; // The application context
    self.messages = ko.observableArray();
    self.messages.extend({ rateLimit: 200 }); // Accept lower refresh rate
    self.keepOnlyLastMessages = ko.observable(true);
    self.MESSAGES_TO_KEEP = 15;

    // Register events
    $.subscribe(self.context.events.resize, function(evt, workAreaHeight, usefullWorkAreaHeight) {
      self.doResize(workAreaHeight, usefullWorkAreaHeight);
    });
  }

  self.addMessage = function(isError, message) {
    //console.log("new message: " + isError + " / " + message);
    function doAddMessage(isError, message, count) {
      self.messages.unshift({
        "time": new Date().toLocaleTimeString(),
        "isError": isError,
        "cssClazz":  (isError ? "list-group-item-danger" : "list-group-item-info"),
        "text": message,
        "count": count
      });
      self.__doKeepOnlyLastMessages();
    }

    // Manage the message count
    var m0 = (self.messages().length > 0 ? self.messages()[0] : undefined);
    if(m0 && (m0.isError == isError) && (m0.text == message)) {
      self.messages.shift();
      doAddMessage(isError, message, m0.count + 1);
    } else {
      doAddMessage(isError, message, 1);
    }
  };

  self.onResetMessages = function() {
    self.messages.removeAll();
  };

  self.onKeepOnlyLastMessages = function() {
    self.keepOnlyLastMessages(!self.keepOnlyLastMessages());
    self.__doKeepOnlyLastMessages();
  };
  
  self.__doKeepOnlyLastMessages = function() {
    if(self.keepOnlyLastMessages()) {
      self.messages.splice(self.MESSAGES_TO_KEEP); // Keep the first n messages
    }
  };
  
  self.doResize = function(workAreaHeight, usefullWorkAreaHeight) {
    self.MESSAGES_TO_KEEP = Math.max(15, Math.round(usefullWorkAreaHeight/40)); // 40 is a bit more than the height of a single line message
    self.__doKeepOnlyLastMessages();
  };
}
