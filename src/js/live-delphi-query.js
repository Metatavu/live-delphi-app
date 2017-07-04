/* jshint esversion: 6 */
/* global window, document, WebSocket, MozWebSocket, $, _, bootbox, moment*/
(function() {
  'use strict';
  
  $.widget("custom.liveDelphiQuery", {
    
    _create: function() {
      this.currentQuery = null;
      $(this.element).on('click', '.select-query-btn', (e) => { this._onQueryElementClick(e); });
      $(this.element).on('click', '.query-selection', (e) => { this._onToQuerySelectionClick(e); });
      setInterval(() => { this._removeEndedQueries(); }, 100);
    },
    
    _onToQuerySelectionClick: function(event) {
      $('.chart-view').slideUp(400, () => {
        $('.query-view').slideDown(400);
      });
    },
    
    _removeEndedQueries: function() {
      $.each($('.select-query-btn'), (index, element ) => {
      let queryEnds = $(element).attr('data-query-ends');
        let endingMoment = moment(queryEnds);
        if (queryEnds && endingMoment.isBefore(moment())) {
          $(element).parent().remove();
        }
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
          $('.chart-view').slideDown(400, () => {
            $(document.body).liveDelphi('createChart');
            $(document.body).liveDelphiClient('sendMessage', {
              'type': 'join-query'
            });
          });
        });

        $(document.body).liveDelphiClient('joinQuery', $(document.body).liveDelphi('sessionId'), this.currentQuery);
      } else {
        this.getQueries();
      }
    },
    
    getQueries: function() {   
      $('.query-container').addClass('loading');
      
      $(document.body).liveDelphiClient('sendMessage', {
        'type': 'get-queries'
      });
    },
    
    renderQueryElement: function(data) {
      $('.query-container').removeClass('loading');
      
      const existingQueryElement = $('a[data-query-id="'+ data.id +'"]');
      if (existingQueryElement.length > 0) {
        existingQueryElement.text(data.name);
      } else {
        const queryElement = $('<li>')
          .addClass('list-group-item')
          .append(
            $('<a>')
              .addClass('select-query-btn')
              .attr('href', '#')
              .attr('data-thesis', data.thesis)
              .attr('data-query-id', data.id)
              .attr('data-query-ends', data.ends)
              .text(data.name)
          );

        $('.available-queries').append(queryElement);
      }
    }
  });
  
})();