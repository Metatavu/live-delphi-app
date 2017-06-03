'use strict';

/* global window, document, WebSocket, MozWebSocket, $, _*/
(function () {
  'use strict';

  $.widget("custom.liveDelphiClient", {

    options: {
      serverUrl: 'http://localhost:8000',
      wsUrl: 'ws://localhost:8000',
      reconnectTimeout: 3000
    },

    _create: function _create() {
      this._state = null;
      this._pendingMessages = [];
      this._queryId = null;
    },

    connect: function connect(sessionId) {
      this._state = 'CONNECTING';

      this._webSocket = this._createWebSocket(sessionId);
      if (!this._webSocket) {
        // Handle error  
        return;
      }

      switch (this._webSocket.readyState) {
        case this._webSocket.CONNECTING:
          this._webSocket.onopen = $.proxy(this._onWebSocketOpen, this);
          break;
        case this._webSocket.OPEN:
          this._onWebSocketOpen();
          break;
        default:
          this._reconnect();
          break;
      }

      this._webSocket.onmessage = $.proxy(this._onWebSocketMessage, this);
      this._webSocket.onclose = $.proxy(this._onWebSocketClose, this);
      this._webSocket.onerror = $.proxy(this._onWebSocketError, this);
    },

    sendMessage: function sendMessage(data) {
      this._sendMessage(data);
    },

    joinQuery: function joinQuery(sessionId, queryId) {
      $.post(this.options.serverUrl + '/joinQuery/' + queryId, {
        sessionId: sessionId
      }, $.proxy(function (data) {
        this._queryId = queryId;

        this.sendMessage({
          'type': 'join-query'
        });

        this.element.trigger("join-query", {
          queryId: queryId
        });
      }, this)).fail($.proxy(function () {
        callback("error");
      }, this));
    },

    _reconnect: function _reconnect() {
      console.log("Reconnecting...");

      if (this._reconnectTimeout) {
        clearTimeout(this._reconnectTimeout);
      }

      if (!this._webSocket || this._webSocket.readyState !== this._webSocket.CONNECTING) {
        this.connect();
      }

      this._reconnectTimeout = setTimeout($.proxy(function () {
        console.log("timeout socket state: " + this._webSocket.readyState);

        if (this._webSocket.readyState === this._webSocket.CLOSED) {
          this._reconnect();
        }
      }, this), this.options.reconnectTimeout);
    },

    _createWebSocket: function _createWebSocket(sessionId) {
      var url = this.options.wsUrl + '/' + sessionId;
      if (typeof window.WebSocket !== 'undefined') {
        return new WebSocket(url);
      } else if (typeof window.MozWebSocket !== 'undefined') {
        return new MozWebSocket(url);
      }
    },

    _sendMessage: function _sendMessage(data) {
      var message = JSON.stringify(data);

      if (this._state === 'CONNECTED') {
        this._webSocket.send(message);
      } else {
        this._pendingMessages.push(message);
      }
    },

    _onWebSocketOpen: function _onWebSocketOpen(event) {
      while (this._pendingMessages.length) {
        this._webSocket.send(this._pendingMessages.shift());
      }

      this._state = 'CONNECTED';

      this.element.trigger("connect", {});

      console.log("Connected");
    },

    _onWebSocketMessage: function _onWebSocketMessage(event) {
      var message = JSON.parse(event.data);
      this.element.trigger("message:" + message.type, message.data);
    },

    _onWebSocketClose: function _onWebSocketClose(event) {
      console.log("Socket closed");
      this._reconnect();
    },

    _onWebSocketError: function _onWebSocketError(event) {
      console.log("Socket error");
      this._reconnect();
    }

  });
}).call(undefined);
//# sourceMappingURL=live-delphi-client.js.map
