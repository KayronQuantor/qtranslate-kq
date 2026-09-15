/*! Modified for qTranslate-KQ on 2026-09-15. See MODIFICATIONS.md for details and attribution. */
/* executed for
 /wp-admin/widgets.php
*/
'use strict';

const $ = jQuery;

$(document).on('qtkqLoadAdmin:widgets', (event, qtkq) => {
    if (!window.wpWidgets)
        return;

    jQuery(document).on('tinymce-editor-init', (event, editor) => {
        const widget = $(editor.settings.selector).parents('.widget');
        const widgetId = widget.find('.widget-id').val();
        // The title is not dependent on TinyMCE
        // But the widget input fields are created dynamically by WP when the area is shown
        const titleContentId = 'widget-' + widgetId + '-title';
        widget.find(".text-widget-fields input[id$='_title']").each(function (i, e) {
            qtkq.attachContentHook(e, titleContentId);
        });
        const textContentId = 'widget-' + widgetId + '-text';
        qtkq.attachEditorHook(editor, textContentId);
    });

    // WP_Custom_HTML_Widget uses a visible title proxy (without a form name)
    // and a separate .sync-input which is handled by qTranslate and submitted by WordPress.
    // Keep the qTranslate hook on the sync input and mirror its current-language value
    // to/from the visible proxy around a language switch.
    const getCustomHtmlTitleFields = function (widget) {
        const syncTitle = widget.find("input.sync-input[id^='widget-custom_html-'][id$='-title']").first();
        const visibleTitle = widget.find("input.widefat.title[id$='_title']").not('.sync-input').first();
        return {syncTitle, visibleTitle};
    };

    const syncCustomHtmlVisibleToContent = function (widget) {
        if (widget.find('.id_base').val() !== 'custom_html')
            return;
        const fields = getCustomHtmlTitleFields(widget);
        if (!fields.syncTitle.length || !fields.visibleTitle.length)
            return;
        fields.syncTitle.val(fields.visibleTitle.val());
    };

    const syncCustomHtmlContentToVisible = function (widget) {
        if (widget.find('.id_base').val() !== 'custom_html')
            return;
        const fields = getCustomHtmlTitleFields(widget);
        if (!fields.syncTitle.length || !fields.visibleTitle.length)
            return;
        fields.visibleTitle.val(fields.syncTitle.val());
        fields.visibleTitle.addClass('qtranxs-translatable');
    };

    const syncCustomHtmlWidgetsToContent = function () {
        $('#widgets-right .widget').each(function () {
            syncCustomHtmlVisibleToContent($(this));
        });
    };

    const syncCustomHtmlWidgetsToVisible = function () {
        $('#widgets-right .widget').each(function () {
            syncCustomHtmlContentToVisible($(this));
        });
    };

    // WP creates the visible Custom HTML title proxy only when an existing widget
    // is opened. It therefore may not exist during the initial qTranslate page scan.
    // Observe only creation of that proxy (not arbitrary widget DOM mutations), so
    // we can mark/synchronize it immediately without risking overwriting later edits.
    const observeCustomHtmlTitleProxy = function () {
        const widgetsRight = document.getElementById('widgets-right');
        if (!widgetsRight || !window.MutationObserver)
            return;

        const visibleTitleSelector = "input.widefat.title[id$='_title']:not(.sync-input)";
        const observer = new MutationObserver(function (mutations) {
            const widgets = new Set();

            mutations.forEach(function (mutation) {
                mutation.addedNodes.forEach(function (node) {
                    if (node.nodeType !== 1)
                        return;

                    const visibleTitles = [];
                    if (node.matches && node.matches(visibleTitleSelector))
                        visibleTitles.push(node);
                    if (node.querySelectorAll)
                        visibleTitles.push(...node.querySelectorAll(visibleTitleSelector));

                    visibleTitles.forEach(function (visibleTitle) {
                        const widget = $(visibleTitle).closest('.widget');
                        if (widget.length && widget.find('.id_base').val() === 'custom_html')
                            widgets.add(widget[0]);
                    });
                });
            });

            widgets.forEach(function (widget) {
                syncCustomHtmlContentToVisible($(widget));
            });
        });

        observer.observe(widgetsRight, {childList: true, subtree: true});
    };

    const onWidgetUpdate = function (evt, widget) {
        const widgetBase = widget.find('.id_base').val();
        switch (widgetBase) {
            case 'text':
                const widgetId = widget.find('.widget-id').val();
                const fieldTitle = widget.find(".text-widget-fields input[id$='_title']");
                widget.find(".widget-content input[id^='widget-text-'][id$='-title']").each(function (i, e) {
                    qtkq.refreshContentHook(e);
                    qtkq.attachContentHook(fieldTitle[0], e.id);
                });

                const fieldText = widget.find(".text-widget-fields textarea[id$='_text']");
                const editor = window.tinyMCE.get(fieldText[0].id);
                widget.find(".widget-content textarea[id^='widget-text-'][id$='-text']").each(function (i, e) {
                    qtkq.refreshContentHook(e);
                    if (editor) {
                        qtkq.attachEditorHook(editor, e.id);
                        // The text field has not been synced after translation yet.
                        // Because the text field has not been updated by wp.widgets when in Visual Mode,
                        // it still has the translated content before saving the widget.
                        // To allow updateField to change the MCE content, change the value of the text field.
                        const syncInput = widget.find('.sync-input.text');
                        fieldText.val(syncInput.val() + '*');
                    }
                });
                if (widgetId in wp.textWidgets.widgetControls) {
                    wp.textWidgets.widgetControls[widgetId].updateFields();
                }
                break;
            case 'custom_html':
                widget.find(".widget-content input[id^='widget-custom_html-'][id$='-title']").each(function (i, e) {
                    qtkq.refreshContentHook(e);
                });
                syncCustomHtmlContentToVisible(widget);
                break;
            default:
                widget.find(".widget-content input[id^='widget-'][id$='-title']").each(function (i, e) {
                    qtkq.refreshContentHook(e);
                });
                break;
        }
        wpWidgets.appendTitle(widget);
    };

    const onWidgetAdded = function (evt, widget) {
        // Rely on refreshContent to create hooks
        onWidgetUpdate(evt, widget);
        // The LSB may not be initialized yet if all widget areas were empty on page load
        qtkq.setupLanguageSwitch();
    };

    $(document).on('widget-added', onWidgetAdded);
    $(document).on('widget-updated', onWidgetUpdate);

    // Before qTranslate stores the current language, copy the value actually edited
    // by the user into the qTranslate-controlled sync input.
    qtkq.addLanguageSwitchBeforeListener(syncCustomHtmlWidgetsToContent);

    const onLanguageSwitchAfter = function () {
        // qTranslate has loaded the selected language into the sync input.
        // Copy it to the visible Custom HTML title editor.
        syncCustomHtmlWidgetsToVisible();
        $('#widgets-right .widget').each(function () {
            wpWidgets.appendTitle(this);
        });
    };

    qtkq.addLanguageSwitchAfterListener(onLanguageSwitchAfter);

    // Mark already-rendered visible Custom HTML title proxies as translatable and
    // synchronize them with the qTranslate-controlled fields on initial page load.
    observeCustomHtmlTitleProxy();
    syncCustomHtmlWidgetsToVisible();
});
