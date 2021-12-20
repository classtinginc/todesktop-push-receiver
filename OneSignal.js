(function () {
  'use strict';

  const ONESIGNAL_VERSION = 01000;
  const ONESIGNAL_HOST_URL = 'https://onesignal.com/api/v1/';
  const ONESIGNAL_LOGGING = false;
  const ONESIGNAL_GAME_VERSION = '10.0.0';

  var __OneSignalHelper = {
    sendToOneSignalApi: function(url, action, inData, callback) {
      const xhr = new XMLHttpRequest();
      xhr.onerror = function() {
        OneSignal.log('Error connecting to OneSignal servers:' + url)
      };
      xhr.onload = function() {
        if (callback) {
          callback(xhr.response);
        }
      };

      xhr.open(action, ONESIGNAL_HOST_URL + url);
      xhr.setRequestHeader('Content-Type', 'application/json;charset=UTF-8');
      xhr.send(JSON.stringify(inData));
    }
  };

  var OneSignal = {
    log: function(message) {
      if (ONESIGNAL_LOGGING) {
        console.log(message);
      }
    },

    registerWithOneSignal: function(appId, registrationId, userId, tagsToSendOnRegister) {
      var playerId = window.localStorage.getItem('player_id');
      var requestUrl = 'players';

      if (playerId !== null) {
        requestUrl = 'players/' + playerId + '/on_session';
      }

      var jsonData = {
        app_id: appId,
        device_type: 4,
        identifier: registrationId,
        language: window.navigator.language ? window.navigator.language.substring(0, 2) : 'en',
        timezone: (new Date().getTimezoneOffset() * -60),
        device_model: 'ClasstingDesktopApp',
        device_os: navigator.appVersion,
        game_version: ONESIGNAL_GAME_VERSION,
        sdk: ONESIGNAL_VERSION
      };

      if (userId !== null) {
        jsonData['external_user_id'] = userId;
      }

      __OneSignalHelper.sendToOneSignalApi(requestUrl, 'POST', jsonData,
        function registeredCallback(response) {
          var responseJSON = JSON.parse(response);
          window.localStorage.setItem('app_id', appId);
          window.localStorage.setItem('player_id', responseJSON.id);

          if (tagsToSendOnRegister !== null) {
            OneSignal.sendTags(tagsToSendOnRegister);
          }
        }
      );
    },

    sendTag: function (key, value) {
      var jsonKeyValue = {};
      jsonKeyValue[key] = value;
      OneSignal.sendTags(jsonKeyValue);
    },

    sendTags: function (jsonPair) {
      var appId = window.localStorage.getItem('app_id');
      var playerId = window.localStorage.getItem('player_id');

      if (playerId !== null) {
        __OneSignalHelper.sendToOneSignalApi('players/' + playerId, 'PUT', {app_id: appId, tags: jsonPair});
      }
    },

    deleteTag: function (key) {
      OneSignal.deleteTags([key]);
    },

    deleteTags: function (keyArray) {
      var jsonPair = {};
      var length = keyArray.length;
      for (var i = 0; i < length; i++)
        jsonPair[keyArray[i]] = '';

      OneSignal.sendTags(jsonPair);
    },

    getTags: function (callback) {
      var playerId = window.localStorage.getItem('player_id');

      if (playerId !== null) {
        __OneSignalHelper.sendToOneSignalApi('players/' + playerId, 'GET', {},
          function registeredCallback(response) {
            callback(JSON.parse(response).tags);
          }
        );
      }
    },

    addListenerForNotificationOpened: function (notifiationId) {
      var appId = window.localStorage.getItem('app_id');
      var playerId = window.localStorage.getItem('player_id');

      __OneSignalHelper.sendToOneSignalApi('notifications/' + notifiationId, 'PUT',
        {app_id: appId, player_id: playerId, opened: true}
      );
    },

    addListenerForReceivedNotification: function (title, notification, callback) {
      var myNotification = new Notification(title, {
        body: notification.data.alert
      });

      var customJSON = JSON.parse(notification.data.custom);
      var notifiationId = customJSON.i;

      myNotification.onclick = function () {
        OneSignal.addListenerForNotificationOpened(notifiationId);
        if (callback) {
          callback(customJSON.a);
        }

        if (!callback) {
          window.location.href = customJSON.u;
        }
      }
    }
  };

  if (typeof define === 'function' && typeof define.amd === 'object' && define.amd) {
    // AMD. Register as an anonymous module.
    define(function() {
      return OneSignal;
    });
  } else if (typeof module !== 'undefined' && module.exports) {
    module.exports.OneSignal = OneSignal;
  } else {
    window.OneSignal = OneSignal;
  }
}());
