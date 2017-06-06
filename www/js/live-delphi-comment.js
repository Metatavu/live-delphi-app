'use strict';

/* global window, document, WebSocket, MozWebSocket, $, _, bootbox*/
(function () {
  'use strict';

  $.widget("custom.liveDelphiComment", {

    _create: function _create() {
      var _this = this;

      this.openComment = null;
      this.dialog = null;
      this.swiper = new Swiper('.swiper-container', {
        slidesPerView: 1,
        spaceBetween: 5,
        loop: true,
        autoplay: 2000,
        autoplayDisableOnInteraction: false
      });

      $(this.element).on('click', '.comment-container', function (event) {
        _this._onCommentContainerClick(event);
      });
      $(this.element).on('click', '.send-child-comment', function (event) {
        _this._onAddChildCommentClick(event);
      });
    },

    _onAddChildCommentClick: function _onAddChildCommentClick(event) {
      var commentText = this.element.find('.child-comment-input').val();

      if (commentText) {
        this.dialog.find('.bootbox-body').find('.loader-container').show();
        var values = $("#chart").liveDelphiChart('getCurrentValues');
        $(document.body).liveDelphiClient('sendMessage', {
          'type': 'comment',
          'comment': commentText,
          'parentCommentId': this.openComment,
          'x': values.x,
          'y': values.y
        });
      }
    },

    _onCommentContainerClick: function _onCommentContainerClick(event) {
      var _this2 = this;

      var commentContainer = $(event.target).parents('.comment-container');
      this.openComment = commentContainer.attr('data-comment-id');
      console.log(commentContainer);
      $(document.body).liveDelphiClient('sendMessage', {
        'type': 'comment-opened',
        'commentId': this.openComment
      });
      this.dialog = bootbox.dialog({
        title: commentContainer.find('.comment-text').text(),
        message: '<div class="child-comments-container"></div><p class="loader-container"><i class="fa fa-spin fa-spinner"></i> Loading...</p><div class="input-group"><input type="text" class="form-control child-comment-input" placeholder="Kirjoita kommentti..."><span class="input-group-btn"><button class="btn btn-primary send-child-comment" type="button">Lähetä</button></span></div>'
      });

      this.dialog.on('hidden.bs.modal', function () {
        _this2.openComment = null;
      });
    },

    renderChildComment: function renderChildComment(color, data) {
      if (this.dialog && this.openComment === data.parentCommentId) {
        this.dialog.find('.bootbox-body').find('.loader-container').hide();
        var childCommentContainer = this.dialog.find('.bootbox-body').find('.child-comments-container');
        var childComment = $('<blockquote>').addClass('blockquote').css('border-color', color).append($('<p>').text(data.comment));
        childComment.appendTo(childCommentContainer);

        $.each(childCommentContainer.find('blockquote'), function (index, element) {
          if (index % 2 === 0) {
            $(element).addClass('blockquote-reverse');
          }
        });
      }
    },

    renderRootComment: function renderRootComment(color, data) {
      var newSlide = $('<div>').addClass('swiper-slide').append($('<div>').addClass('comment-container').attr('data-comment-id', data.id).append($('<div>').addClass('comment-ball').css('background', color), $('<div>').addClass('comment-text').append($('<p>').text(data.comment))));

      this.swiper.appendSlide(newSlide[0].outerHTML);
    }
  });
})();
//# sourceMappingURL=live-delphi-comment.js.map
