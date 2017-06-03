/* global window, document, WebSocket, MozWebSocket, $, _*/
(function() {
  'use strict';
  
  $.widget("custom.liveDelphiChart", {
    
    options: {
      ticks: ["---", "--", "-", "-/+", "+","++", "+++"],
      maxX: 6,
      maxY: 6,
      pendingTime: 1000,
      tooltipActive: false,
      fadeUpdateInterval: 200
    },
    
    _create : function() {
      this._userHashes = [];
      this._series = [];
      
      this._scatterChart = new Chart(this.element, {
        type: 'line',
        data: {
          datasets: this._getSeries()
        },
        options: {
          tooltips: {
            callbacks: {
              title: function(items, data) {
                return "";
              },
              label: function(item, data) {
                return "Lorem ipsum dolor sit amet...";
              }
            }
          },
          onClick: function (event) {
            var canvas = event.target;
            var x = event.layerX;
            var y = event.layerY;
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
          }.bind(this),
          legend: {
            display: false
          },
          scales: {
            xAxes: [{
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
      
      setInterval($.proxy(this._updateFade, this), this.options.fadeUpdateInterval);
    },
    
    _updateFade: function () {
       this._series.forEach($.proxy(function(dataset) {
         dataset.pointBackgroundColor = this._getColor(dataset.data[0], dataset.lastUpdated);
       }, this));
       
       this._updateChart();
    },
    
    userData: function (userHash, data) {
      var index = this._userHashes.indexOf(userHash);
      if (index !== -1) {
        var lastUpdated = new Date().getTime();
        this._series[index].data[0] = data;
        this._series[index].pointBackgroundColor = this._getColor(data, lastUpdated);
        this._series[index].lastUpdated = lastUpdated;
      } else {
        this._userHashes.push(userHash);
        this._series.push(this._getDataSet(data));
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
    
    _getColor: function (value, updated) {
      var red = Math.floor(this._convertToRange(value.x, 0, this.options.maxX, 0, 255));
      var blue = Math.floor(this._convertToRange(value.y, 0, this.options.maxY, 0, 255));
      var age = new Date().getTime() - updated;
      var opacity = this._convertToRange(age, 0, this.options.pendingTime, 0, 1);
      return "rgba(" + [red, 50, blue, opacity].join(',') + ")";
    },
    
    _getDataSet: function (data) { 
      var lastUpdated = new Date().getTime();
      return {showLine: false, data: [ data ], pointBackgroundColor : this._getColor(data, lastUpdated), pointRadius: 5, lastUpdated: lastUpdated};
    },
    
    _getSeries: function() {
      return this._series;
    }
    
  });
  
  
}).call(this);