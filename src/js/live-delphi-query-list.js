/* jshint esversion: 6 */
/* global window, document, WebSocket, MozWebSocket, $, _, bootbox, moment*/
(function() {
  'use strict';
  
  $.widget("custom.liveDelphiQueryList", {
    
    _create: function() {
      this.element.on('click', '.select-query-btn', $.proxy(this._onQueryElementClick, this));
      this.element.on('click', '.query-selection', $.proxy(this._onQuerySelectionClick, this));
      $(document.body).on('message:queries-found', $.proxy(this._onMessageQueriesFound, this));
      
      setInterval($.proxy(this._checkQueries, this), 5000);
    },
    
    listQueries: function() {   
      $('.query-container').addClass('loading');
      $('.available-queries').empty();
      
      $(document.body).liveDelphiClient('sendMessage', {
        'type': 'list-active-queries'
      });
    },
    
    _onMessageQueriesFound: function(event, data) {
      $('.query-container').removeClass('loading');
      
      const queries = data.queries;
      let removedQueryIds = $('a[data-query-id]').map((index, queryElement) => {
        return parseInt($(queryElement).attr('data-query-id'));
      }).get();
      
      queries.forEach((query) => {
        removedQueryIds  = _.without(removedQueryIds, query.id);
        this._renderQueryElement(query);
      });
      
      removedQueryIds.forEach((removedQueryId) => {
        $(`a[data-query-id=${removedQueryId}]`).closest('li.list-group-item').remove();
      });
    },
    
    _joinQuery: function (queryId, data) {
      $(document.body).liveDelphiQuery('joinQuery', queryId, data);
    },
    
    _checkQueries: function() {
     $(document.body).liveDelphiClient('sendMessage', {
        'type': 'list-active-queries'
      });
    },
    
    _renderQueryElement: function(query) {
      const queryListItem = pugQueryListItem({
        query: query
      });
      
      const existingQueryElement = $(`a[data-query-id=${query.id}]`);
      if (existingQueryElement.length > 0) {
        existingQueryElement.closest('li.list-group-item').replaceWith(queryListItem);
      } else {
        $('.available-queries').append(queryListItem);
      }
    },
    
    _onQuerySelectionClick: function(event) {
      $('.chart-view').slideUp(400, () => {
        $('.query-view').slideDown(400);
      });
    },
    
    _onQueryElementClick: function(event) {
      event.preventDefault();
      
      $('.list-group-item').removeClass('active');
      $(event.target).parent().addClass('active');
      
      this._joinQuery(parseInt($(event.target).attr('data-query-id')), {
        labelX: $(event.target).attr('data-label-x'),
        labelY: $(event.target).attr('data-label-y'),
        thesis: $(event.target).attr('data-thesis')
      });
    }
    
  });
  
})();