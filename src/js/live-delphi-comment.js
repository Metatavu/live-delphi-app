/* jshint esversion: 6 */
/* global window, document, WebSocket, MozWebSocket, $, _, bootbox*/
(function() {
  'use strict';
  
  $.widget("custom.liveDelphiComment", {
    
    _create: function() {
      this.openComment = null;
      this.dialog = null;
      this.swiper = new Swiper('.swiper-container', {
        slidesPerView: 1,
        spaceBetween: 5,
        loop: true,
        autoplay: 2000,
        autoplayDisableOnInteraction: false,
        nextButton: '.swiper-button-next',
        prevButton: '.swiper-button-prev',
      });

      $(this.element).on('click', '.comment-container', (event) => { this._onCommentContainerClick(event); });
      $(this.element).on('click', '.send-child-comment', (event) => { this._onAddChildCommentClick(event); });
    },

    _onAddChildCommentClick: function(event) {
      const commentText = this.element.find('.child-comment-input').val();
      
      if (commentText) {
        this.dialog.find('.bootbox-body').find('.loader-container').show();
        const values = $("#chart").liveDelphiChart('getCurrentValues');
        $(document.body).liveDelphiClient('sendMessage', {
          'type': 'comment',
          'comment': commentText,
          'parentCommentId': this.openComment,
          'x': values.x,
          'y': values.y
        }); 
      }
    },

    _onCommentContainerClick: function(event) {
      const commentContainer = $(event.target).parents('.comment-container');
      this.openComment = parseInt(commentContainer.attr('data-comment-id'));
      $(document.body).liveDelphiClient('sendMessage', {
        'type': 'comment-opened',
        'commentId': this.openComment
      });
      this.dialog = bootbox.dialog({
        title: commentContainer.find('.comment-text').text(),
        message: '<div class="child-comments-container"></div><p class="loader-container"><i class="fa fa-spin fa-spinner"></i> Loading...</p><div class="input-group"><input type="text" class="form-control child-comment-input" placeholder="Kirjoita kommentti..."><span class="input-group-btn"><button class="btn btn-primary send-child-comment" type="button">Lähetä</button></span></div>',
        backdrop: true
      });
      
      this.dialog.on('hidden.bs.modal', () => {
        this.openComment = null;
      });
    },

    renderChildComment: function(color, data) {
      if (this.dialog && this.openComment === data.parentCommentId) {
        this.dialog.find('.bootbox-body').find('.loader-container').hide();
        const childCommentContainer = this.dialog.find('.bootbox-body').find('.child-comments-container');
        const childComment = $('<blockquote>')
          .addClass('blockquote')
          .css('border-color', color)
          .append($('<p>').text(data.comment));
        childComment.appendTo(childCommentContainer);
        
        $.each(childCommentContainer.find('blockquote'), (index, element) => {
          if (index % 2 === 0) {
            $(element).addClass('blockquote-reverse');
          }
        });
      }
    },

    renderRootComment: function(color, data) {
      const newSlide = $('<div>')
        .addClass('swiper-slide')
        .append(
          $('<div>')
          .addClass('comment-container')
          .attr('data-comment-id', data.id)
          .append(
            $('<div>')
              .addClass('comment-ball')
              .css('background', color),
            $('<div>')
              .addClass('comment-text')
              .append($('<p>').text(data.comment))
          )
        );

      this.swiper.appendSlide(newSlide[0].outerHTML);
    }
  });
  
})();