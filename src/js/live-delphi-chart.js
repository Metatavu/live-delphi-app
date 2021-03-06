/* jshint esversion: 6 */
/* global window, document, WebSocket, MozWebSocket, $, _, bootbox, device*/
(function() {
  'use strict';
  
  $.widget("custom.liveDelphiChart", {
    
    options: {
      ticks: ["---", "--", "-", "-/+", "+","++", "+++"],
      maxX: 6,
      maxY: 6,
      pendingTime: 1000,
      tooltipActive: false,
      fadeUpdateInterval: 200,
      userAnswerUpdateInterval: 500,
      userAnswerSizeSmall: 8,
      userAnswerSizeLarge: 10,
      answerMinSize: 4,
      answerMaxSize: 7,
      baseColor: 100,
      colorX: 'RED', 
      colorY: 'BLUE'
    },
    
    _create : function() {
      this._userHashes = [];
      this._series = [];
      this.currentX  = 0;
      this.currentY = 0;
      this._loggedUserHash = null; 
      this._loggedUserIterator = 0;
      $(document.body).liveDelphiComment('disableCommenting');

      const chartWidth = $(this.element).parent().width();
      $(this.element).css('width', chartWidth);
      $(this.element).css('height', chartWidth);

      this._scatterChart = new Chart(this.element, {
        type: 'line',
        data: {
          datasets: this._getSeries()
        },
        options: {
          tooltips: {
            enabled: false
          },
          legend: {
            display: false
          },
          scales: {
            xAxes: [{
              gridLines: {
                lineWidth: [1, 1, 1, 2, 1, 1],
                color: [
                  'rgba(0, 0, 0, 0.1)',
                  'rgba(0, 0, 0, 0.1)',
                  'rgba(0, 0, 0, 0.1)',
                  'rgba(0, 0, 0, 0.3)',
                  'rgba(0, 0, 0, 0.1)',
                  'rgba(0, 0, 0, 0.1)'
                ]
              },
              type: 'linear',
              position: 'bottom',
              ticks: {
                min: 0,
                max: 6,
                stepSize: 1,
                callback: function(value, index, values) {
                  return this.options.ticks[value];
                }.bind(this)
              }
            }],
            yAxes: [{
              gridLines: {
                lineWidth: [1, 1, 1, 2, 1, 1],
                color: [
                  'rgba(0, 0, 0, 0.1)',
                  'rgba(0, 0, 0, 0.1)',
                  'rgba(0, 0, 0, 0.1)',
                  'rgba(0, 0, 0, 0.3)',
                  'rgba(0, 0, 0, 0.1)',
                  'rgba(0, 0, 0, 0.1)'
                ]
              },
              type: 'linear',
              ticks: {
                mirror: true,
                labelOffset: -100,
                min: 0,
                max: 6,
                stepSize: 1,
                callback: function(value, index, values) {
                  return this.options.ticks[value];
                }.bind(this)
              }
            }]
          }
        }
      });
      
      $(this.element).on('touchstart mousedown', (e) => { this._onCanvasTouchStart(e); } );
      $(this.element).on('touchend mouseup', (e) => { this._onCanvasTouchEnd(e); } );

      this._updateInterval = setInterval($.proxy(this._updateFade, this), this.options.fadeUpdateInterval);
      this._updateUserAnswerInterval = setInterval($.proxy(this._updateUserAnswer, this), this.options.userAnswerUpdateInterval);
    },
    
    _destroy: function () {
      clearInterval(this._updateInterval);
      clearInterval(this._updateUserAnswerInterval);
      this._scatterChart.destroy();
    },
    
    loggedUserHash: function (loggedUserHash) {
      this._loggedUserHash = loggedUserHash;
    },
    
    _pointerEventToLayerCoords: function(e){
      var position = $(this.element).offset();
      var coords = {x:0, y:0};
      if(e.type == 'touchstart' || e.type == 'touchmove' || e.type == 'touchend' || e.type == 'touchcancel'){
        var touch = e.originalEvent.touches[0] || e.originalEvent.changedTouches[0];
        coords.x = touch.pageX;
        coords.y = touch.pageY;
      } else if (e.type == 'mousedown' || e.type == 'mouseup' || e.type == 'mousemove' || e.type == 'mouseover'|| e.type=='mouseout' || e.type=='mouseenter' || e.type=='mouseleave') {
        coords.x = e.pageX;
        coords.y = e.pageY;
      }
      
      coords.x = coords.x - position.left;
      coords.y = coords.y - position.top;
      return coords;
    },
    
    _getLabelX: function () {
      return this.element.attr('data-query-label-x');
    },
    
    _getLabelY: function () {
      return this.element.attr('data-query-label-y');
    },
    
    _onCanvasTouchEnd: function() {
      clearTimeout(this.touchTimer);
    },
    
    _onCanvasTouchStart: function(event) {
      this.touchTimer = setTimeout(() => { this._ontouchAndHold() }, 2000);
      var coords = this._pointerEventToLayerCoords(event);
      var x = coords.x;
      var y = coords.y;
      var chartArea = this._scatterChart.chartArea;
      var chartLeft = chartArea.left;
      var chartRight = chartArea.right;
      var chartTop = chartArea.top;
      var chartBottom = chartArea.bottom;

      var xValue = ((x - chartLeft) / chartRight) * this.options.maxX;
      var yValue = this.options.maxY - (((y - chartTop) / chartBottom) * this.options.maxY);

      $(document.body).liveDelphiClient('sendMessage', {
        'type': 'answer',
        'x': xValue,
        'y': yValue
      });
    },
    
    _ontouchAndHold: function() {
      $(document.body).liveDelphiComment('renderRootCommentDialog');
    },
    
    _updateFade: function () {
      const anwerCount = this._userHashes.length;
      const pointRadius = Math.round(this.options.answerMaxSize - this._convertToRange(Math.min(anwerCount, 20), 1, 20, 0, this.options.answerMaxSize - this.options.answerMinSize));
      const loggedUserIndex = this._loggedUserHash ? this._userHashes.indexOf(this._loggedUserHash) : -1;
      
      this._series.forEach($.proxy(function(dataset, index) {
        dataset.pointBackgroundColor = this.getColor(dataset.data[0], dataset.lastUpdated);
         if (index !== loggedUserIndex) {
           dataset.pointRadius = pointRadius;
         }
      }, this));
       
      this._updateChart();
    },
    
    _updateUserAnswer: function () {
      if (this._loggedUserHash) {
        const index = this._userHashes.indexOf(this._loggedUserHash);
        if (index !== -1) {
          this._loggedUserIterator = (this._loggedUserIterator + 1) % 2;
          this._series[index].pointRadius = this._loggedUserIterator === 1 
            ? this.options.userAnswerSizeLarge 
            : this.options.userAnswerSizeSmall;
        }
      }
    },
    
    reset: function () {
      $(document.body).liveDelphiComment('disableCommenting');
      this._userHashes = [];
      this._series = [];
      this._loggedUserHash = null; 
      this._updateChart();
    },
    
    userData: function (userHash, data) {

      if (userHash === this._loggedUserHash) {
        this.currentX = data.x;
        this.currentY = data.y;
        $(document.body).liveDelphiComment('enableCommenting');
      }

      const newData = {
        x: data.x > 6 ?  6 : data.x < 0 ?  0.05 : data.x,
        y: data.y > 6 ?  6 : data.y < 0 ?  0 : data.y
      };
      
      const index = this._userHashes.indexOf(userHash);
      if (index !== -1) {
        const lastUpdated = new Date().getTime();
        this._series[index].data[0] = newData;
        this._series[index].pointBackgroundColor = this.getColor(data, lastUpdated);
        this._series[index].lastUpdated = lastUpdated;
      } else {
        this._userHashes.push(userHash);
        this._series.push(this._getDataSet(newData));
      }
      
      this._updateChart();
    },
    
    _updateChart: function  () {
      this._scatterChart.update();
    },
    
    _convertToRange: function(value, fromLow, fromHigh, toLow, toHigh) {
      var fromLength = fromHigh - fromLow;
      var toRange = toHigh - toLow;
      var newValue = toRange / (fromLength / value);
      if (newValue < toLow) {
        return toLow;
      } else if (newValue > toHigh) {
        return toHigh;
      } else {
        return newValue;
      }
    },
    
    getCurrentValues: function() {
      return {
        x: this.currentX,
        y: this.currentY
      };
    },
    
    getColor: function (value, updated) {
      const xColor = Math.floor(this._convertToRange(value.x, 0, this.options.maxX, 0, 255));
      const yColor = Math.floor(this._convertToRange(value.y, 0, this.options.maxY, 0, 255));
      const r = this.options.colorX === 'RED' ? xColor : this.options.colorY === 'RED' ? yColor : this.options.baseColor;
      const g = this.options.colorX === 'GREEN' ? xColor : this.options.colorY === 'GREEN' ? yColor : this.options.baseColor;
      const b = this.options.colorX === 'BLUE' ? xColor : this.options.colorY === 'BLUE' ? yColor : this.options.baseColor;
      const age = new Date().getTime() - updated;
      const a = this._convertToRange(age, 0, this.options.pendingTime, 0, 1);
      
      return tinycolor({
        r: r,
        g: g,
        b: b,
        a: a
      }).toRgbString();
    },
    
    _getDataSet: function (data) { 
      var lastUpdated = new Date().getTime();
      return {showLine: false, data: [ data ], pointBackgroundColor : this.getColor(data, lastUpdated), pointRadius: 5, lastUpdated: lastUpdated};
    },
    
    _getSeries: function() {
      return this._series;
    }
    
  });
  
  
}).call(this);