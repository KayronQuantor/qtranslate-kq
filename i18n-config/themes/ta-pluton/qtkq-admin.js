/*! Modified for qTranslate-KQ on 2026-09-15. See MODIFICATIONS.md for details and attribution. */
(function ($) {
    $(document).on('qtkqLoadAdmin:ta-pluton-panel', function (evt, qtkq) {
        qtkq.addLanguageSwitchAfterListener(function () {
            $('.slide-title').each(function (i, e) {
                var t = e.value;
                if (!t) return;
                $(e).parents().eq(3).find('.redux-slides-header').text(t);
            });
        });
    });
})(jQuery);
