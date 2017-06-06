"use strict";

/* global window, document, WebSocket, MozWebSocket, $, _, bootbox*/
(function () {
  'use strict';

  $.widget("custom.liveDelphiChart", {

    options: {
      ticks: ["---", "--", "-", "-/+", "+", "++", "+++"],
      maxX: 6,
      maxY: 6,
      pendingTime: 1000,
      tooltipActive: false,
      fadeUpdateInterval: 200
    },

    _create: function _create() {
      var _this = this;

      this._userHashes = [];
      this._series = [];
      this.currentX = 0;
      this.currentY = 0;

      this._scatterChart = new Chart(this.element, {
        type: 'line',
        data: {
          datasets: this._getSeries()
        },
        options: {
          tooltips: {
            callbacks: {
              title: function title(items, data) {
                return "";
              },
              label: function label(item, data) {
                return "Lorem ipsum dolor sit amet...";
              }
            }
          },
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
                callback: function (value, index, values) {
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
                callback: function (value, index, values) {
                  return this.options.ticks[value];
                }.bind(this)
              }
            }]
          }
        }
      });

      $(this.element).on('touchstart', function (e) {
        _this._onCanvasTouchStart(e);
      });
      $(this.element).on('touchend', function (e) {
        _this._onCanvasTouchEnd(e);
      });
      setInterval(function () {
        _this._updateFade();
      }, this.options.fadeUpdateInterval);
    },

    _pointerEventToLayerCoords: function _pointerEventToLayerCoords(e) {
      var position = $(this.element).offset();
      var coords = { x: 0, y: 0 };
      if (e.type == 'touchstart' || e.type == 'touchmove' || e.type == 'touchend' || e.type == 'touchcancel') {
        var touch = e.originalEvent.touches[0] || e.originalEvent.changedTouches[0];
        coords.x = touch.pageX;
        coords.y = touch.pageY;
      } else if (e.type == 'mousedown' || e.type == 'mouseup' || e.type == 'mousemove' || e.type == 'mouseover' || e.type == 'mouseout' || e.type == 'mouseenter' || e.type == 'mouseleave') {
        coords.x = e.pageX;
        coords.y = e.pageY;
      }

      coords.x = coords.x - position.left;
      coords.y = coords.y - position.top;
      return coords;
    },

    _onCanvasTouchEnd: function _onCanvasTouchEnd() {
      clearTimeout(this.touchTimer);
    },

    _onCanvasTouchStart: function _onCanvasTouchStart(event) {
      var _this2 = this;

      this.touchTimer = setTimeout(function () {
        _this2._ontouchAndHold();
      }, 2000);
      var coords = this._pointerEventToLayerCoords(event);
      var x = coords.x;
      var y = coords.y;
      var chartArea = this._scatterChart.chartArea;
      var chartLeft = chartArea.left;
      var chartRight = chartArea.right;
      var chartTop = chartArea.top;
      var chartBottom = chartArea.bottom;

      var xValue = (x - chartLeft) / chartRight * this.options.maxX;
      var yValue = this.options.maxY - (y - chartTop) / chartBottom * this.options.maxY;

      $(document.body).liveDelphiClient('sendMessage', {
        'type': 'answer',
        'x': xValue,
        'y': yValue
      });
    },

    _ontouchAndHold: function _ontouchAndHold() {
      var _this3 = this;

      bootbox.prompt({
        title: 'Type a comment',
        inputType: 'textarea',
        callback: function callback(comment) {
          if (comment) {
            $(document.body).liveDelphiClient('sendMessage', {
              'type': 'comment',
              'comment': comment,
              'x': _this3.currentX,
              'y': _this3.currentY
            });
          }
        }
      });
    },

    _updateFade: function _updateFade() {
      this._series.forEach($.proxy(function (dataset) {
        dataset.pointBackgroundColor = this.getColor(dataset.data[0], dataset.lastUpdated);
      }, this));

      this._updateChart();
    },

    userData: function userData(userHash, data) {
      this.currentX = data.x;
      this.currentY = data.y;

      var index = this._userHashes.indexOf(userHash);
      if (index !== -1) {
        var lastUpdated = new Date().getTime();
        this._series[index].data[0] = data;
        this._series[index].pointBackgroundColor = this.getColor(data, lastUpdated);
        this._series[index].lastUpdated = lastUpdated;
      } else {
        this._userHashes.push(userHash);
        this._series.push(this._getDataSet(data));
      }

      this._updateChart();
    },
    _updateChart: function _updateChart() {
      this._scatterChart.update();
    },

    _convertToRange: function _convertToRange(value, fromLow, fromHigh, toLow, toHigh) {
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

    getCurrentValues: function getCurrentValues() {
      return {
        x: this.currentX,
        y: this.currentY
      };
    },

    getColor: function getColor(value, updated) {
      var red = Math.floor(this._convertToRange(value.x, 0, this.options.maxX, 0, 255));
      var blue = Math.floor(this._convertToRange(value.y, 0, this.options.maxY, 0, 255));
      var age = new Date().getTime() - updated;
      var opacity = this._convertToRange(age, 0, this.options.pendingTime, 0, 1);
      return "rgba(" + [red, 50, blue, opacity].join(',') + ")";
    },

    _getDataSet: function _getDataSet(data) {
      var lastUpdated = new Date().getTime();
      return { showLine: false, data: [data], pointBackgroundColor: this.getColor(data, lastUpdated), pointRadius: 5, lastUpdated: lastUpdated };
    },

    _getSeries: function _getSeries() {
      return this._series;
    }

  });
}).call(undefined);
//# sourceMappingURL=live-delphi-chart.js.map
