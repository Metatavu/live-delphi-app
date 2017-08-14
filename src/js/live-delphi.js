/* global getConfig */

(function(){
  'use strict';
  
  $.widget("custom.liveDelphi", { 
    
    options: {
      logDebug: false
    },
    
    _create : function() {
      const serverConfig = getConfig().server;
      const secure = serverConfig.secure;
      const host = serverConfig.host;
      const port = serverConfig.port;
      const httpProtocol = secure ? 'https' : 'http';
      const wsProtocol = secure ? 'wss' : 'ws';
      const serverUrl = httpProtocol + '://' + host + ':' + port;
      const wsUrl = wsProtocol + '://' + host + ':' + port;

      this.element.on('authenticated', $.proxy(this._onAuthenticated, this));
      this.element.on('joined', $.proxy(this._onJoined, this));
      $(document.body).on('connect', $.proxy(this._onConnect, this));
      $(document.body).on('reconnect', $.proxy(this._onReconnect, this));

      this.element.on('message:answers-not-found', $.proxy(this._onEmptyAnswerResponse, this));
      this.element.on('message:comment-added', $.proxy(this._onMessageCommentAdded, this));
      
      this.element.liveDelphiQueryList();
      this.element.liveDelphiQuery({
        serverUrl: serverUrl,
        logDebug: this.options.logDebug
      });
      
      this.element.liveDelphiClient({
        wsUrl: wsUrl,
        serverUrl: serverUrl
      });
      
      this.element.liveDelphiAuth({
        serverUrl: serverUrl
      });
      
      this.element.liveDelphiComment();
      this.element.liveDelphiAuth('authenticate'); 
    },
    
    sessionId: function () {
      return this.element.liveDelphiAuth('sessionId');
    },

    _onAuthenticated: function () {
      this.element.liveDelphiAuth('join');
    },
    
    _onJoined: function () {
      this.element.liveDelphiClient('connect', this.sessionId());
      this.element.liveDelphiQueryList('listQueries');
      
      // this.element.liveDelphiQuery('joinQuery');
    },
    
    _onConnect: function (event, data) {
      $('.connecting-modal').hide();
    },
    
    _onReconnect: function () {
      $('.connecting-modal').show();
    },
    
    _onEmptyAnswerResponse: function () {
    },    
    
    _onMessageCommentAdded: function (event, data) {
      const color = $("#chart").liveDelphiChart('getColor', {
        x: data.x,
        y: data.y
      }, 0);
      
      if (data.parentCommentId) {
        this.element.liveDelphiComment('renderChildComment', color, data); 
      } else {
        this.element.liveDelphiComment('renderRootComment', color, data); 
      }
    }
    
  });
  
  $(document).on("deviceready", () => {
    $(document.body).liveDelphi();      
  });
  
})();
