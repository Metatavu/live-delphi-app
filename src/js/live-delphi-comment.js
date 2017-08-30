/* jshint esversion: 6 */
/* global window, document, WebSocket, MozWebSocket, $, _, bootbox*/
(function() {
  'use strict';
  
  $.widget("custom.liveDelphiComment", {
    
    _create: function() {
      this.openComment = null;
      this.dialog = null;
      this.commentsEnabled = false;
      this.swiper = new Swiper('.swiper-container', {
        slidesPerView: 1,
        spaceBetween: 5,
        loop: true,
        autoplay: 2000,
        autoplayDisableOnInteraction: false,
        nextButton: '.swiper-button-next',
        prevButton: '.swiper-button-prev',
      });

      $(this.element).on('click', '.comment-container', $.proxy(this._onCommentContainerClick, this));
      $(this.element).on('click', '.send-child-comment', $.proxy(this._onAddChildCommentClick, this));
      $(this.element).on('click', '.add-root-comment-btn', $.proxy(this._onAddRootCommentClick, this));
    },

    _onAddRootCommentClick: function (event) {
      this.renderRootCommentDialog();
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
        backdrop: true,
        onEscape: true
      });
      
      this.dialog.on('hidden.bs.modal', () => {
        this.openComment = null;
      });
    },
    
    _truncateText(text, maxLength) {
      if (text.length < maxLength) {
        return text;
      } else {
        return text.substring(0, maxLength) + '...';
      }
    },
    
    enableCommenting() {
      this.commentsEnabled = true;
      $('.add-root-comment-btn').removeClass('disabled');
    },
    
    disableCommenting() {
      this.commentsEnabled = false;
      $('.add-root-comment-btn').addClass('disabled');
    },

    renderRootCommentDialog() {
      if (!this.commentsEnabled) {
        return;
      }
      
      bootbox.prompt({
        title: 'Type a comment',
        inputType: 'textarea',
        backdrop: true,
        onEscape: true,
        callback: (comment) => {
          if(comment) {
            const values = $("#chart").liveDelphiChart('getCurrentValues');
            $(document.body).liveDelphiClient('sendMessage', {
              'type': 'comment',
              'comment': comment,
              'x': values.x,
              'y': values.y
            });
          }
        }
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
              .addClass('comment-text')
              .append($('<div>')
                .addClass('comment-ball')
                .css('background', color)
              )
              .append($('<p>').text(this._truncateText(data.comment, 300)))
          )
        );

      this.swiper.appendSlide(newSlide[0].outerHTML);
    }
  });
  
})();