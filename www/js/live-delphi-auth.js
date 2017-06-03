'use strict';

/* global window, document, WebSocket, MozWebSocket, $, _*/
(function () {
  'use strict';

  $.widget("custom.liveDelphiAuth", {

    options: {
      serverUrl: 'http://localhost:8000'
    },

    _create: function _create() {
      this._sessionId = null;
    },

    authenticate: function authenticate() {
      var _this = this;

      this._keycloak = this._getKeycloak();
      this._keycloak.init({ onLoad: 'login-required' }).success(function (authenticated) {
        if (authenticated) {
          _this.element.trigger("authenticated");
        } else {
          _this.element.trigger("authentication-failure");
        }
      }).error(function (err) {
        console.error("Authentication failed", err);
        _this.element.trigger("authentication-error");
      });
    },

    token: function token() {
      return this._keycloak.token;
    },

    sessionId: function sessionId() {
      return this._sessionId;
    },

    join: function join() {
      $.post(this.options.serverUrl + '/join', {
        token: this.token()
      }, $.proxy(function (data) {
        this._sessionId = data.sessionId;
        this.element.trigger("joined");
      }, this)).fail($.proxy(function () {
        this.element.trigger("join-error");
      }, this));
    },

    _getKeycloak: function _getKeycloak() {
      return Keycloak(this.options.serverUrl + '/keycloak.json');
    }

  });
}).call(undefined);
//# sourceMappingURL=live-delphi-auth.js.map
