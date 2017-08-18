/* jshint esversion: 6 */
/* global window, document, WebSocket, MozWebSocket, $, _, bootbox, moment, device*/
(function() {
  'use strict';
  
  $.widget("custom.liveDelphiQuery", {
    
    options: {
      serverUrl: null,
      logDebug: false
    },
    
    _create: function() {
      this._queryId = null;
      this._queryUserId = null;
      this._userHash = null;
      
      $(document.body).on('message:answer-changed', $.proxy(this._onMessageAnswerChanged, this));
      $(document.body).on('message:answers-found', $.proxy(this._onMessageAnswersFound, this));
      $(document.body).on('reconnect', $.proxy(this._onReconnect, this));
      $(document.body).on('connect', $.proxy(this._onConnect, this));
    },
    
    joinQuery: function(queryId, data) {
      this._queryId = queryId;
      this._labelX = data.labelX;
      this._labelY = data.labelY;
      this._colorX = data.colorX;
      this._colorY = data.colorY;
      this._thesis = data.thesis;
      
      $('.chart-label-left .chart-label-inner')
        .text(this._labelY)
        .append($('<div>').addClass('chart-label-color').css('background-color', this._colorY));
      
      $('.chart-label-bottom .chart-label-inner')
        .text(this._labelX)
        .append($('<div>').addClass('chart-label-color').css('background-color', this._colorX));
      
      $('.query-thesis').text(this._thesis);
      
      $("#chart").remove();
      $('.swiper-slide').remove();
      $('.query-view').slideUp(400, () => {
        $('.chart-view').addClass('loading').show();
        this._createChart(this.getColorX(), this.getColorY());
        const sessionId = $(document.body).liveDelphi('sessionId');
        this._joinQuery(sessionId, this._queryId);
      });
    },
    
    getQueryId: function () {
      return this._queryId;
    },
    
    getLabelX: function() {
      return this._labelX;
    },
    
    getLabelY: function() {
      return this._labelY;
    },
    
    getThesis: function() {
      return this._thesis;
    },
    
    getColorX: function() {
      return this._colorX;
    },
    
    getColorY: function() {
      return this._colorY;
    },

    _createChart: function(colorX, colorY) {
      $(".chart-canvas-container").append($('<canvas>').attr('id', 'chart'));
      $("#chart").liveDelphiChart({
        colorX: colorX, 
        colorY: colorY
      });
    },
    
    _joinQuery: function (sessionId, queryId) {
      $(document.body).trigger("before-join-query", { 
        queryId: queryId
      });
      
      $.post(this.options.serverUrl + '/joinQuery/' + queryId, {
        sessionId: sessionId
      }, $.proxy(function (response) {
        this._queryId = queryId;
        this._queryUserId = response.queryUserId;
        this._userHash = response.userHash;
        
        $(document.body).trigger("join-query", { 
          queryId: queryId
        }); 
        
        $("#chart").liveDelphiChart('loggedUserHash', this._userHash);
        
        this._loadExistingAnswers();
        this._loadExistingRootComments();
      }, this))
      .fail($.proxy(function () {
        if (this.options.logDebug) {
          console.log("error");
        }
      }, this));
    },
    
    _rejoinQuery: function () {
      const sessionId = $(document.body).liveDelphi('sessionId');
      
      if (device.platform === 'iOS') {
        $('#chart').liveDelphiChart('destroy').remove();
        this._createChart(this.getColorX(), this.getColorY());
      } else {
        $("#chart").liveDelphiChart('reset');
      }
      
      this._joinQuery(sessionId, this._queryId);
    },
    
    _loadExistingAnswers: function (queryId) {
      this.element.liveDelphiClient('sendMessage', {
        'type': 'list-latest-answers',
        'data': {
          'queryId': this._queryId,
          'before': new Date().getTime(),
          'resultMode': 'batch'
        }
      });
    },
    
    _loadExistingRootComments: function (queryId) {
      this.element.liveDelphiClient('sendMessage', {
        'type': 'list-root-comments-by-query',
        'data': {
          'queryId': this._queryId
        }
      });
    },
    
    _onMessageAnswersFound: function (event, data) {
      if (data.queryId === this.getQueryId()) {
        $(".chart-view").removeClass('loading');
        
        const answers = data.answers;
        
        answers.forEach((answer) => {
          $("#chart").liveDelphiChart('userData', answer.userHash, {
            x: answer.x,
            y: answer.y
          });
        });
      }
    },
    
    _onMessageAnswerChanged: function (event, data) {
      if (data.queryId === this.getQueryId()) {
        $("#chart").liveDelphiChart('userData', data.userHash, {
          x: data.x,
          y: data.y
        });
      }
    },
    
    _onReconnect: function () {
      
    },
    
    _onConnect: function () {
      if (this._queryId) {
        this._rejoinQuery();
      }
    }
    
  });
  
})();