/* global window, document, WebSocket, MozWebSocket, $, _, bootbox*/
(function() {
  'use strict';
  
  $.widget("custom.liveDelphiQuery", {
    
    _create: function() {
      this.currentQuery = null;
      $(this.element).on('click', '.select-query-btn', (e) => { this._onQueryElementClick(e); });
      $(this.element).on('click', '.query-selection', (e) => { this._onToQuerySelectionClick(e); });
    },
    
    _onToQuerySelectionClick: function(event) {
      $('.chart-view').slideUp(400, () => {
        $('.query-view').slideDown(400);
      });
    },
    
    _onQueryElementClick: function(event) {
      event.preventDefault();
      $('.list-group-item').removeClass('active');
      $(event.target).parent().addClass('active');
      $('.query-thesis').text($(event.target).attr('data-thesis'));
      this.currentQuery = $(event.target).attr('data-query-id');
      this.joinQuery();
    },
    
    joinQuery: function() {
      if (this.currentQuery) {
        $('.swiper-slide').remove();
        $('.query-view').slideUp(400, () => {
          $('.chart-view').slideDown(400);
        });

        $(document.body).liveDelphiClient('joinQuery', $(document.body).liveDelphi('sessionId'), this.currentQuery);
      } else {
        this.getQueries();
      }
    },
    
    getQueries: function() {
      $(document.body).liveDelphiClient('sendMessage', {
        'type': 'get-queries'
      });
    },
    
    renderQueryElement: function(data) {
      const queryElement = $('<li>')
        .addClass('list-group-item')
        .append(
          $('<a>')
            .addClass('select-query-btn')
            .attr('href', '#')
            .attr('data-thesis', data.thesis)
            .attr('data-query-id', data.id)
            .text(data.name)
        );

      $('.available-queries').append(queryElement);
    }
  });
  
})();