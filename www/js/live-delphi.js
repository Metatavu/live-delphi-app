'use strict';

/* global getConfig */

(function () {
  'use strict';

  $.widget("custom.liveDelphi", {
    _create: function _create() {
      var serverConfig = getConfig().server;
      var secure = serverConfig.secure;
      var host = serverConfig.host;
      var port = serverConfig.port;
      var httpProtocol = secure ? 'https' : 'http';
      var wsProtocol = secure ? 'wss' : 'ws';

      console.log(serverConfig);

      var serverUrl = httpProtocol + '://' + host + ':' + port;
      var wsUrl = wsProtocol + '://' + host + ':' + port;

      this.element.on('authenticated', $.proxy(this._onAuthenticated, this));
      this.element.on('joined', $.proxy(this._onJoined, this));
      this.element.on('connect', $.proxy(this._onConnect, this));
      this.element.on('message:answer-changed', $.proxy(this._onMessageAnswerChanged, this));
      this.element.on('message:comment-added', $.proxy(this._onMessageCommentAdded, this));

      console.log(serverUrl);

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

    sessionId: function sessionId() {
      return this.element.liveDelphiAuth('sessionId');
    },

    joinQuery: function joinQuery(queryId) {
      this.element.liveDelphiClient("joinQuery", this.sessionId(), queryId);
    },

    _onAuthenticated: function _onAuthenticated() {
      this.element.liveDelphiAuth('join');
    },

    _onJoined: function _onJoined() {
      this.element.liveDelphiClient('connect', this.sessionId());
      // TODO: Move joinQuery call
      this.joinQuery("2194774e-ebe9-49ce-bc6b-4e28645da40c");
    },

    _onConnect: function _onConnect(event, data) {
      $("#chart").liveDelphiChart();
    },

    _onMessageAnswerChanged: function _onMessageAnswerChanged(event, data) {
      $("#chart").liveDelphiChart('userData', data.userHash, {
        x: data.x,
        y: data.y
      });
    },

    _onMessageCommentAdded: function _onMessageCommentAdded(event, data) {
      var color = $("#chart").liveDelphiChart('getColor', {
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

  $(document).on("deviceready", function () {
    $(document.body).liveDelphi();
  });
})();
//# sourceMappingURL=live-delphi.js.map
