/* jshint esversion: 6 */
/* global window, document, WebSocket, MozWebSocket, $, _*/
(function() {
  'use strict';
  
  $.widget("custom.liveDelphiClient", {
    
    options: {
      serverUrl: 'http://localhost:8000',
      wsUrl: 'ws://localhost:8000',
      reconnectTimeout: 3000,
      pingThreshold: 10000,
      logDebug: false
    },
    
    _create : function() {
      this._state = null;
      this._pendingMessages = [];
      this._queryId = null;
      this._pong = null;
      this._onWebSocketMessageRef = $.proxy(this._onWebSocketMessage, this);
      this._onWebSocketCloseRef = $.proxy(this._onWebSocketClose, this);
      this._onWebSocketErrorRef = $.proxy(this._onWebSocketError, this);
      this._onWebSocketOpenRef = $.proxy(this._onWebSocketOpen, this);
       
      setInterval($.proxy(this._ping, this, 1000));
    },
    
    connect: function (sessionId) {
      if (this.options.logDebug) {
        console.log(`Connecting ${sessionId}...`);
      }
      
      this._state = 'CONNECTING';
      
      this._webSocket = this._createWebSocket(sessionId);
      if (!this._webSocket) {
        return;
      } 
      
      switch (this._webSocket.readyState) {
        case this._webSocket.CONNECTING:
          this._webSocket.onopen = this._onWebSocketOpenRef;
        break;
        case this._webSocket.OPEN:
          this._onWebSocketOpen();
        break;
        default:
          this._reconnect(`Ready state ${this._webSocket.readyState}`);
        break;
      }
      
      this._webSocket.onmessage = this._onWebSocketMessageRef;
      this._webSocket.onclose = this._onWebSocketCloseRef;
      this._webSocket.onerror = this._onWebSocketErrorRef;
    },
    
    sendMessage: function (data) {
      this._sendMessage(data);
    },
    
    joinQuery: function (sessionId, queryId) {
      this.element.trigger("before-join-query", { 
        queryId: queryId
      });
      
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
      }, this))
      .fail( $.proxy(function () {
        if (this.options.logDebug) {
          console.log("error");
        }
      }, this));
    },
    
    _ping: function () {
      if (this._state === 'CONNECTED') {
        this.sendMessage({
          'type': 'ping'
        });
        
        if (this._pong && (this._pong < (new Date().getTime() - this.options.pingThreshold))) {
          try {
            this._webSocket.close(); 
          } catch (e) { }
        }
      }
    },
    
    _reconnect: function (reason) {
      this.element.trigger("reconnect", { });
      this._pong = null;
      this._state = 'RECONNECTING';

      if (this.options.logDebug) {
        console.log(`Reconnecting... (${reason})`);
      }
          
      if (this._reconnectTimeout) {
        clearTimeout(this._reconnectTimeout);
      }
      
      if (!this._webSocket || this._webSocket.readyState !== this._webSocket.CONNECTING) {
        this.connect($(document.body).liveDelphiAuth('sessionId'));
      }
      
      this._reconnectTimeout = setTimeout($.proxy(function () {
        if (this.options.logDebug) {
          console.log("timeout socket state: " + this._webSocket.readyState);
        }
        
        this.element.liveDelphiAuth('join');
        
        if (this._webSocket.readyState === this._webSocket.CLOSED) {
          this._reconnect(`Reconnect timeout`);
        }
      }, this), this.options.reconnectTimeout);
    },

    _createWebSocket: function (sessionId) {
      const url = this.options.wsUrl + '/' + sessionId;
      if ((typeof window.WebSocket) !== 'undefined') {
        return new WebSocket(url);
      } else if ((typeof window.MozWebSocket) !== 'undefined') {
        return new MozWebSocket(url);
      }
    },
    
    _sendMessage: function (data) {
      const message = JSON.stringify(data);
      
      if (this._state === 'CONNECTED') {
        this._webSocket.send(message);
      } else {
        this._pendingMessages.push(message);
      }
    },
    
    _onWebSocketOpen: function (event) {
      while (this._pendingMessages.length) {
        this._webSocket.send(this._pendingMessages.shift());
      }
      
      this._state = 'CONNECTED';
      
      this.element.trigger("connect", { }); 
      if (this.options.logDebug) {
        console.log("Connected");
      }
    },
    
    _onWebSocketMessage: function (event) {
      const message = JSON.parse(event.data);
      if (message.type === 'pong') {
        this._pong = new Date().getTime(); 
      } else {
        this.element.trigger("message:" + message.type, message.data); 
      }
    },
    
    _onWebSocketClose: function (event) {
      this._reconnect("Socket closed");
    },
    
    _onWebSocketError: function (event) {
      this._reconnect("Socket error");
    }
    
  });
  
  
}).call(this);