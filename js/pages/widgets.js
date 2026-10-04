/*! Modified for qTranslate-KQ; latest changes 2026-10-05. See MODIFICATIONS.md for details and attribution. */
/* executed for
 /wp-admin/widgets.php
*/
'use strict';

import {installWidgetEnvironmentDiagnostics} from './widget-environment';
import {qtranxj_split} from '../core/qblocks';
import {getNativeRichTextBlockConfig, getNativeRichTextContentAttributes, isNativeRichTextContent, getNativeRichTextHtml, joinBracketTranslations as joinNativeTranslations} from '../block-widgets/native-rich-text';

const $ = jQuery;

let blockWidgetsEncodeMiddlewareInstalled = false;

$(document).on('qtkqLoadAdmin:widgets', (event, qtkq) => {
    // Install widgets-environment diagnostics for both editor modes before the
    // existing Classic Widgets branch checks for wpWidgets.
    installWidgetEnvironmentDiagnostics();

    // Block Widgets use a different lifecycle from the Classic Widgets screen.
    // Keep this compatibility layer deliberately narrow: only ordinary title
    // inputs of Legacy Widget blocks are initialized here.
    if (window.qTranslateKQWidgetEnvironment.editorMode === 'block') {
        const legacyLazyHydration = window.qTranslateKQLegacyWidgetLazyHydration || null;
        if (legacyLazyHydration && typeof legacyLazyHydration.endBootstrap === 'function')
            legacyLazyHydration.endBootstrap();
        // Legacy Widget previews need two properties that WordPress's native
        // preview lifecycle does not provide: language switching after the
        // initial /render response and a stable way to bind that response back to
        // its iframe. Cache complete per-language srcdoc projections behind an
        // inert token embedded in each preview. Visible previews swap immediately
        // on a qTranslate language change; hidden previews stay idle and are
        // updated lazily when WordPress makes them visible. No extra REST render is
        // issued for a language switch.
        const legacyPreviewCache = new Map();
        const observedLegacyPreviewIframes = new WeakSet();
        let legacyPreviewTokenSequence = 0;
        let legacyPreviewDesiredLanguage = qtkq.getActiveLanguage();
        let legacyPreviewSyncScheduled = false;
        let legacyPreviewMutationObserver = null;
        let legacyPreviewResizeObserver = null;

        const stripLegacyPreviewRecaptchaScripts = function (html) {
            return String(html).replace(
                /<script\b(?=[^>]*\bid=(["'])(?:google-recaptcha-js|wpcf7-recaptcha-js-before|wpcf7-recaptcha-js)\1)[^>]*>[\s\S]*?<\/script\s*>/gi,
                ''
            );
        };

        const injectLegacyPreviewToken = function (html, token) {
            const meta = '<meta name="qtkq-legacy-preview-token" content="' + token + '">';
            const source = String(html);

            if (/<\/head\s*>/i.test(source))
                return source.replace(/<\/head\s*>/i, meta + '</head>');

            if (/<body\b/i.test(source))
                return source.replace(/<body\b/i, meta + '<body');

            return meta + source;
        };

        const createLegacyPreviewCacheEntry = function (canonicalPreview) {
            const token = 'qtkq-preview-' + (++legacyPreviewTokenSequence).toString(36);
            const translations = qtranxj_split(String(canonicalPreview));
            const previews = {};
            let fallbackPreview = null;

            Object.keys(translations).forEach(function (language) {
                const preview = injectLegacyPreviewToken(
                    stripLegacyPreviewRecaptchaScripts(translations[language]),
                    token
                );

                previews[language] = preview;
                if (fallbackPreview === null)
                    fallbackPreview = preview;
            });

            if (fallbackPreview === null) {
                fallbackPreview = injectLegacyPreviewToken(
                    stripLegacyPreviewRecaptchaScripts(canonicalPreview),
                    token
                );
            }

            const entry = {
                token,
                previews,
                fallbackPreview
            };

            legacyPreviewCache.set(token, entry);
            return entry;
        };

        const getLegacyPreviewVersion = function (entry, language) {
            if (!entry)
                return null;

            if (
                language &&
                Object.prototype.hasOwnProperty.call(entry.previews, language)
            ) {
                return entry.previews[language];
            }

            return entry.fallbackPreview;
        };

        const getLegacyPreviewIframes = function () {
            if (
                !window.wp ||
                !wp.data ||
                typeof wp.data.select !== 'function'
            ) {
                return [];
            }

            const blockEditorStore = wp.data.select('core/block-editor');
            if (!blockEditorStore || typeof blockEditorStore.getBlock !== 'function')
                return [];

            return Array.from(document.querySelectorAll('iframe[srcdoc]')).filter(function (iframe) {
                const blockElement = iframe.closest('[data-block]');
                const clientId = blockElement
                    ? blockElement.getAttribute('data-block')
                    : null;

                if (!clientId)
                    return false;

                const block = blockEditorStore.getBlock(clientId);
                return !!block && block.name === 'core/legacy-widget';
            });
        };

        const getLegacyPreviewToken = function (iframe) {
            if (!iframe)
                return null;

            // The srcdoc attribute is the authoritative requested document. During
            // iframe navigation contentDocument can still expose the PREVIOUS srcdoc
            // for a short time. Reading contentDocument first can therefore resolve
            // a stale cache token and restore an old placeholder over a newly written
            // Legacy Widget preview. Prefer the current srcdoc token and use the live
            // document only as a fallback when srcdoc itself has no token.
            const source = String(iframe.srcdoc || '');
            const match = source.match(
                /<meta\b[^>]*\bname=(["'])qtkq-legacy-preview-token\1[^>]*\bcontent=(["'])([^"']+)\2/i
            );

            if (match)
                return match[3];

            try {
                const meta = iframe.contentDocument
                    ? iframe.contentDocument.querySelector('meta[name="qtkq-legacy-preview-token"]')
                    : null;

                if (meta) {
                    const token = meta.getAttribute('content');
                    if (token)
                        return token;
                }
            } catch (error) {
                // srcdoc is same-origin, but tolerate a transient inaccessible document.
            }

            return null;
        };

        const isLegacyPreviewIframeVisible = function (iframe) {
            if (!iframe || typeof iframe.getBoundingClientRect !== 'function')
                return false;

            const rect = iframe.getBoundingClientRect();
            if (rect.width <= 0 || rect.height <= 0)
                return false;

            const style = window.getComputedStyle(iframe);
            return style.display !== 'none' && style.visibility !== 'hidden';
        };

        const applyLegacyPreviewLanguage = function (iframe, language) {
            if (!iframe || !language || !isLegacyPreviewIframeVisible(iframe))
                return false;

            const token = getLegacyPreviewToken(iframe);
            const entry = token
                ? legacyPreviewCache.get(token)
                : null;
            const preview = getLegacyPreviewVersion(entry, language);

            if (!preview)
                return false;

            if (iframe.srcdoc !== preview)
                iframe.srcdoc = preview;

            return true;
        };

        const observeLegacyPreviewIframe = function (iframe) {
            if (!iframe || observedLegacyPreviewIframes.has(iframe))
                return;

            observedLegacyPreviewIframes.add(iframe);

            if (legacyPreviewResizeObserver)
                legacyPreviewResizeObserver.observe(iframe);
        };

        const syncLegacyPreviewLanguage = function () {
            const language = legacyPreviewDesiredLanguage;
            if (!language)
                return;

            getLegacyPreviewIframes().forEach(function (iframe) {
                observeLegacyPreviewIframe(iframe);
                applyLegacyPreviewLanguage(iframe, language);
            });
        };

        const scheduleLegacyPreviewSync = function (language) {
            if (language)
                legacyPreviewDesiredLanguage = language;

            if (legacyPreviewSyncScheduled)
                return;

            legacyPreviewSyncScheduled = true;

            const run = function () {
                legacyPreviewSyncScheduled = false;
                syncLegacyPreviewLanguage();
            };

            if (typeof window.requestAnimationFrame === 'function')
                window.requestAnimationFrame(run);
            else
                window.setTimeout(run, 0);
        };

        const installLegacyPreviewVisibilityObservers = function () {
            if (typeof window.ResizeObserver === 'function') {
                legacyPreviewResizeObserver = new window.ResizeObserver(function (entries) {
                    entries.forEach(function (entry) {
                        if (
                            entry &&
                            entry.target &&
                            entry.contentRect &&
                            entry.contentRect.width > 0 &&
                            entry.contentRect.height > 0
                        ) {
                            applyLegacyPreviewLanguage(
                                entry.target,
                                legacyPreviewDesiredLanguage
                            );
                        }
                    });
                });
            }

            if (typeof window.MutationObserver === 'function' && document.body) {
                legacyPreviewMutationObserver = new window.MutationObserver(function () {
                    scheduleLegacyPreviewSync();
                });

                legacyPreviewMutationObserver.observe(document.body, {
                    childList: true,
                    subtree: true,
                    attributes: true,
                    attributeFilter: ['class', 'style', 'hidden', 'aria-expanded']
                });
            }

            scheduleLegacyPreviewSync(legacyPreviewDesiredLanguage);
        };

        // Legacy Widget forms are serialized by @wordpress/widgets before
        // /wp/v2/widget-types/<idBase>/encode. qTranslate-KQ keeps the
        // current language in the visible field and the other languages in
        // qtranslate-fields[] hidden inputs. Rebuild the raw multilingual value
        // in form_data at the official wp.apiFetch middleware boundary so the
        // encoded block instance retains every language.
        const installLegacyWidgetEncodeMiddleware = function () {
            if (blockWidgetsEncodeMiddlewareInstalled)
                return;

            if (!window.wp || !wp.apiFetch || typeof wp.apiFetch.use !== 'function') {
                console.error('qTranslate-KQ: wp.apiFetch middleware API is unavailable in Block Widgets.');
                return;
            }

            const joinBracketTranslations = function (translations) {
                let firstNonEmpty = null;

                for (const lang in translations) {
                    const value = translations[lang];
                    if (value !== '') {
                        firstNonEmpty = value;
                        break;
                    }
                }

                if (firstNonEmpty === null)
                    return '';

                let allTheSame = true;
                for (const lang in translations) {
                    if (translations[lang] !== firstNonEmpty) {
                        allTheSame = false;
                        break;
                    }
                }

                if (allTheSame)
                    return firstNonEmpty;

                let value = '';
                for (const lang in translations) {
                    if (translations[lang] !== '')
                        value += '[:' + lang + ']' + translations[lang];
                }

                if (value !== '')
                    value += '[:]';

                return value;
            };

            const projectLegacyWidgetPreview = function (response) {
                if (!response || typeof response.preview !== 'string')
                    return response;

                const entry = createLegacyPreviewCacheEntry(response.preview);
                const preview = getLegacyPreviewVersion(
                    entry,
                    qtkq.getActiveLanguage()
                );

                return Object.assign({}, response, {preview});
            };

            wp.apiFetch.use(function (options, next) {
                const path = options && options.path;

                if (
                    typeof path === 'string' &&
                    /^\/wp\/v2\/widget-types\/[^/]+\/render(?:\?|$)/.test(path)
                ) {
                    return Promise.resolve(next(options)).then(projectLegacyWidgetPreview);
                }

                const formData = options && options.data && options.data.form_data;

                if (
                    typeof path !== 'string' ||
                    !/^\/wp\/v2\/widget-types\/[^/]+\/encode(?:\?|$)/.test(path) ||
                    typeof formData !== 'string' ||
                    formData.indexOf('qtranslate-fields%5B') < 0
                ) {
                    return next(options);
                }

                const params = new URLSearchParams(formData);
                const editLanguage = params.get('qtranslate-edit-language');
                const separatorSuffix = '[qtranslate-separator]';
                let changed = false;

                // Each qTranslate content hook emits one separator field. Use it
                // as the authoritative root of that multilingual field instead
                // of guessing from arbitrary nested qtranslate-fields[] names.
                for (const [name, separator] of Array.from(params.entries())) {
                    if (
                        !name.startsWith('qtranslate-fields[') ||
                        !name.endsWith(separatorSuffix) ||
                        separator !== '['
                    ) {
                        continue;
                    }

                    const qFieldBase = name.slice(0, -separatorSuffix.length);
                    const baseMatch = qFieldBase.match(/^qtranslate-fields\[([^\]]+)\](.*)$/);
                    if (!baseMatch)
                        continue;

                    const originalName = baseMatch[1] + baseMatch[2];
                    if (!params.has(originalName))
                        continue;

                    const languagePrefix = qFieldBase + '[';
                    const translations = {};

                    for (const [fieldName, fieldValue] of Array.from(params.entries())) {
                        if (!fieldName.startsWith(languagePrefix) || !fieldName.endsWith(']'))
                            continue;

                        const lang = fieldName.slice(languagePrefix.length, -1);
                        if (!lang || lang === 'qtranslate-separator')
                            continue;

                        translations[lang] = fieldValue;
                    }

                    // The hidden field for the currently edited language is only
                    // synchronized by qTranslate on a language switch or classic
                    // form submit. Block Widgets serializes on input/change, so
                    // the visible value is authoritative for editLanguage here.
                    if (editLanguage && Object.prototype.hasOwnProperty.call(translations, editLanguage))
                        translations[editLanguage] = params.get(originalName);

                    if (!Object.keys(translations).length)
                        continue;

                    params.set(originalName, joinBracketTranslations(translations));
                    changed = true;
                }

                if (!changed)
                    return next(options);

                const nextOptions = Object.assign({}, options, {
                    data: Object.assign({}, options.data, {
                        form_data: params.toString()
                    })
                });

                return next(nextOptions);
            });

            blockWidgetsEncodeMiddlewareInstalled = true;
        };

        installLegacyWidgetEncodeMiddleware();

        // Native blocks have no classic qTranslate content hook, so explicitly
        // initialize the existing language switcher on Block
        // Widgets. The qTranslate core still owns activeLanguage, button state
        // and session persistence.
        qtkq.setupLanguageSwitch(true);

        const notifyNativeWidgetLanguage = function (language, previousLanguage) {
            if (!language || typeof window.CustomEvent !== 'function')
                return;

            window.dispatchEvent(new CustomEvent('qtkq:native-widget-language-change', {
                detail: {
                    language,
                    previousLanguage: previousLanguage || null
                }
            }));
        };

        qtkq.addLanguageSwitchAfterListener(function (language, previousLanguage) {
            notifyNativeWidgetLanguage(language, previousLanguage);
            scheduleLegacyPreviewSync(language);
        });

        installLegacyPreviewVisibilityObservers();

        // Extend the existing qTranslate "Copy from" action to explicitly
        // supported native RichText blocks. Keep the historical
        // non-overwriting semantics: copy only when the active language is empty.
        const showCopyTargetNotEmptyNotice = function () {
            if (!window.wp || !wp.data || typeof wp.data.dispatch !== 'function')
                return;

            try {
                const notices = wp.data.dispatch('core/notices');
                if (!notices || typeof notices.createNotice !== 'function')
                    return;

                notices.createNotice(
                    'warning',
                    'Copy skipped: the target language already contains content.',
                    {
                        id: 'qtkq-copy-target-not-empty',
                        type: 'snackbar',
                        isDismissible: true
                    }
                );
            } catch (error) {
                // A missing notice store must never affect the copy operation.
            }
        };

        // Gutenberg's selected block is not a reliable proxy for the RichText
        // field the user is operating on. `core/quote` exposes
        // `citation` on the parent block while its body is a child Paragraph;
        // after the qTranslate language/copy controls take focus, Gutenberg can
        // still report the body Paragraph as selected even though the user last
        // focused the Quote citation. Remember the concrete RichText target as
        // (clientId, attributeKey), preserve it while the qTranslate language
        // switcher is used, and validate it against the explicit native-block
        // configuration before Copy from writes anything.
        let lastNativeRichTextTarget = null;

        const resolveConfiguredNativeRichTextTarget = function (clientId, attributeKey) {
            if (
                !clientId ||
                !attributeKey ||
                !window.wp ||
                !wp.data ||
                typeof wp.data.select !== 'function'
            ) {
                return null;
            }

            const blockEditorStore = wp.data.select('core/block-editor');
            if (!blockEditorStore || typeof blockEditorStore.getBlock !== 'function')
                return null;

            const block = blockEditorStore.getBlock(clientId);
            const blockConfig = block
                ? getNativeRichTextBlockConfig(block.name)
                : null;

            const contentAttributes = getNativeRichTextContentAttributes(blockConfig);
            if (
                !block ||
                !blockConfig ||
                !contentAttributes.includes(attributeKey)
            ) {
                return null;
            }

            const rawContent = block.attributes
                ? block.attributes[attributeKey]
                : null;

            if (!isNativeRichTextContent(rawContent, blockConfig))
                return null;

            return {
                clientId,
                attributeKey,
                block,
                blockConfig
            };
        };

        const getNativeRichTextTargetFromElement = function (element) {
            if (!element || typeof element.closest !== 'function')
                return null;

            const editable = element.closest(
                '[contenteditable="true"][data-wp-block-attribute-key]'
            );
            if (!editable)
                return null;

            const attributeKey = editable.getAttribute('data-wp-block-attribute-key');
            const blockElement = editable.closest('[data-block]');
            const clientId = blockElement
                ? blockElement.getAttribute('data-block')
                : null;

            return resolveConfiguredNativeRichTextTarget(clientId, attributeKey);
        };

        const rememberNativeRichTextTarget = function (event) {
            const element = event && event.target;
            if (!element || typeof element.closest !== 'function')
                return;

            // The Copy from workflow itself moves focus into these controls.
            // Keep the last editor target while the language UI is being used.
            if (element.closest('.qtranxs-lang-switch-wrap'))
                return;

            const target = getNativeRichTextTargetFromElement(element);
            lastNativeRichTextTarget = target
                ? {
                    clientId: target.clientId,
                    attributeKey: target.attributeKey
                }
                : null;
        };

        const rememberFocusedNativeRichTextTarget = function (event) {
            const target = getNativeRichTextTargetFromElement(event && event.target);
            if (!target)
                return;

            lastNativeRichTextTarget = {
                clientId: target.clientId,
                attributeKey: target.attributeKey
            };
        };

        document.addEventListener('pointerdown', rememberNativeRichTextTarget, true);
        document.addEventListener('focusin', rememberFocusedNativeRichTextTarget, true);

        const getNativeRichTextCopyTarget = function (blockEditorStore) {
            if (lastNativeRichTextTarget) {
                const rememberedTarget = resolveConfiguredNativeRichTextTarget(
                    lastNativeRichTextTarget.clientId,
                    lastNativeRichTextTarget.attributeKey
                );

                if (rememberedTarget)
                    return rememberedTarget;

                lastNativeRichTextTarget = null;
            }

            if (typeof blockEditorStore.getSelectionStart === 'function') {
                const selectionStart = blockEditorStore.getSelectionStart();
                if (
                    selectionStart &&
                    selectionStart.clientId &&
                    selectionStart.attributeKey
                ) {
                    const selectionTarget = resolveConfiguredNativeRichTextTarget(
                        selectionStart.clientId,
                        selectionStart.attributeKey
                    );
                    if (selectionTarget)
                        return selectionTarget;
                }
            }

            if (typeof blockEditorStore.getSelectedBlock !== 'function')
                return null;

            const selectedBlock = blockEditorStore.getSelectedBlock();
            const blockConfig = selectedBlock
                ? getNativeRichTextBlockConfig(selectedBlock.name)
                : null;
            if (!selectedBlock || !blockConfig)
                return null;

            const contentAttributes = getNativeRichTextContentAttributes(blockConfig);
            if (contentAttributes.length !== 1)
                return null;

            return resolveConfiguredNativeRichTextTarget(
                selectedBlock.clientId,
                contentAttributes[0]
            );
        };

        const copySelectedNativeRichTextFromLanguage = function (targetLanguage, sourceLanguage) {
            if (
                !targetLanguage ||
                !sourceLanguage ||
                targetLanguage === sourceLanguage ||
                !window.wp ||
                !wp.data ||
                !wp.richText ||
                !wp.richText.RichTextData ||
                typeof wp.richText.toHTMLString !== 'function'
            ) {
                return false;
            }

            const blockEditorStore = wp.data.select('core/block-editor');
            const blockEditorDispatch = wp.data.dispatch('core/block-editor');
            if (
                !blockEditorStore ||
                !blockEditorDispatch ||
                typeof blockEditorDispatch.updateBlockAttributes !== 'function'
            ) {
                return false;
            }

            const copyTarget = getNativeRichTextCopyTarget(blockEditorStore);
            if (!copyTarget)
                return false;

            const selectedBlock = copyTarget.block;
            const blockConfig = copyTarget.blockConfig;
            const contentAttribute = copyTarget.attributeKey;
            const RichTextData = wp.richText.RichTextData;
            const rawContent = selectedBlock.attributes
                ? selectedBlock.attributes[contentAttribute]
                : null;
            if (!isNativeRichTextContent(rawContent, blockConfig))
                return false;

            const rawHtml = getNativeRichTextHtml(rawContent);
            const translations = qtranxj_split(rawHtml);

            if (
                !Object.prototype.hasOwnProperty.call(translations, targetLanguage) ||
                !Object.prototype.hasOwnProperty.call(translations, sourceLanguage)
            ) {
                return false;
            }

            if (translations[targetLanguage] !== '') {
                showCopyTargetNotEmptyNotice();
                return false;
            }

            if (translations[sourceLanguage] === '')
                return false;

            translations[targetLanguage] = translations[sourceLanguage];

            const fullMultilingualHtml = joinNativeTranslations(translations);
            const fullMultilingualContent = RichTextData.fromHTMLString(fullMultilingualHtml);

            blockEditorDispatch.updateBlockAttributes(selectedBlock.clientId, {
                [contentAttribute]: fullMultilingualContent
            });

            return true;
        };

        qtkq.addCopyContentFromListener(copySelectedNativeRichTextFromLanguage);

        // qTranslate may restore a session-stored edit language after Gutenberg
        // has already rendered its first BlockEdit tree. Synchronize the React
        // adapter once during Block Widgets initialization as well.
        notifyNativeWidgetLanguage(qtkq.getActiveLanguage(), null);

        // Only the currently active/visible Legacy Widget form is managed by
        // qTranslate-KQ. Hidden pre-rendered Legacy Widget forms are
        // deliberately left untouched so WordPress can bootstrap/encode them
        // without qTranslate fields altering their form state.
        let activeLegacyWidget = null;
        let activeLegacyWidgetInputs = [];

        // The classic/Legacy copy path lives in qTranslate core, so observe its
        // result and surface the same non-overwrite notice used
        // for native blocks when a selected Legacy Widget target is non-empty.
        const onLegacyCopyContentFromResult = function (result) {
            if (
                !activeLegacyWidget ||
                !result ||
                !result.classicSkippedNonEmpty ||
                result.classicChanged
            ) {
                return;
            }

            showCopyTargetNotEmptyNotice();
        };

        qtkq.addCopyContentFromResultListener(onLegacyCopyContentFromResult);

        // qTranslate-KQ's core language switch replaces the visible value of
        // every active content hook and then triggers a synthetic jQuery
        // "change" event. In Block Widgets that event bubbles to the Legacy
        // Widget form, where @wordpress/widgets treats it as a real user edit and
        // immediately calls /widget-types/<idBase>/encode. Some widgets normalize
        // their instance in update() even when nothing was edited (the qTranslate
        // Language Chooser intentionally drops its default widget-css value), so a
        // language-only switch can otherwise dirty and later overwrite the widget.
        // Suppress only that synthetic bubbling change while qTranslate itself is
        // synchronously switching languages. Native user input/change events are
        // not affected.
        let legacyLanguageSwitchInProgress = false;
        let legacyLanguageSwitchToken = 0;

        const getBlockCustomHtmlTitleFields = function (widget) {
            const syncTitle = widget
                .find("input.sync-input[id^='widget-custom_html-'][id$='-title']")
                .first();
            const visibleTitle = widget
                .find("input.widefat.title[id$='_title']")
                .not('.sync-input')
                .first();
            return {syncTitle, visibleTitle};
        };

        const syncActiveBlockCustomHtmlVisibleToContent = function () {
            if (!activeLegacyWidget)
                return;

            const widget = $(activeLegacyWidget);
            if (widget.find('.id_base').val() !== 'custom_html')
                return;

            const fields = getBlockCustomHtmlTitleFields(widget);
            if (fields.syncTitle.length && fields.visibleTitle.length)
                fields.syncTitle.val(fields.visibleTitle.val());
        };

        const syncActiveBlockCustomHtmlContentToVisible = function () {
            if (!activeLegacyWidget)
                return;

            const widget = $(activeLegacyWidget);
            if (widget.find('.id_base').val() !== 'custom_html')
                return;

            const fields = getBlockCustomHtmlTitleFields(widget);
            if (!fields.syncTitle.length || !fields.visibleTitle.length)
                return;

            fields.visibleTitle.val(fields.syncTitle.val());
            fields.visibleTitle.addClass('qtranxs-translatable');
        };

        const onLegacyLanguageSwitchBefore = function () {
            const token = ++legacyLanguageSwitchToken;
            legacyLanguageSwitchInProgress = true;

            // WP_Custom_HTML_Widget edits a visible title proxy while WordPress
            // submits a separate .sync-input. Copy the user's current-language
            // edit to the qTranslate-controlled sync field before qTranslate
            // stores the old language value.
            syncActiveBlockCustomHtmlVisibleToContent();

            // If another before-switch listener cancels the language change, the
            // normal after-switch callback is not called. Clear the guard at the
            // end of the current synchronous turn so it can never remain stale.
            Promise.resolve().then(function () {
                if (token === legacyLanguageSwitchToken)
                    legacyLanguageSwitchInProgress = false;
            });
        };

        const onLegacyLanguageSwitchAfter = function () {
            // qTranslate has loaded the newly selected language into the hooked
            // sync field. Mirror that value to the visible Custom HTML proxy.
            syncActiveBlockCustomHtmlContentToVisible();

            legacyLanguageSwitchToken++;
            legacyLanguageSwitchInProgress = false;
        };

        const suppressLegacyWidgetLanguageSwitchChange = function (event) {
            if (
                legacyLanguageSwitchInProgress &&
                event.type === 'change' &&
                event.isTrigger &&
                !event.originalEvent
            ) {
                event.stopPropagation();
            }
        };

        qtkq.addLanguageSwitchBeforeListener(onLegacyLanguageSwitchBefore);
        qtkq.addLanguageSwitchAfterListener(onLegacyLanguageSwitchAfter);

        const joinLegacyTranslations = function (translations) {
            let firstNonEmpty = null;

            for (const lang in translations) {
                if (translations[lang] !== '') {
                    firstNonEmpty = translations[lang];
                    break;
                }
            }

            if (firstNonEmpty === null)
                return '';

            let allTheSame = true;
            for (const lang in translations) {
                if (translations[lang] !== firstNonEmpty) {
                    allTheSame = false;
                    break;
                }
            }

            if (allTheSame)
                return firstNonEmpty;

            let value = '';
            for (const lang in translations) {
                if (translations[lang] !== '')
                    value += '[:' + lang + ']' + translations[lang];
            }

            if (value !== '')
                value += '[:]';

            return value;
        };

        const restoreLegacyWidgetInputRawValue = function (inputField) {
            if (!inputField || !inputField.id)
                return;

            const hook = qtkq.hasContentHook(inputField.id);
            if (!hook || hook.contentField !== inputField || !hook.fields)
                return;

            const activeLanguage = qtkq.getActiveLanguage();
            if (
                activeLanguage &&
                Object.prototype.hasOwnProperty.call(hook.fields, activeLanguage)
            ) {
                hook.fields[activeLanguage].value = inputField.value;
            }

            const translations = {};
            Object.keys(hook.fields).forEach(function (lang) {
                translations[lang] = hook.fields[lang].value;
            });

            if (Object.keys(translations).length)
                inputField.value = joinLegacyTranslations(translations);
        };

        const deactivateLegacyWidgetBlock = function () {
            // Custom HTML uses a visible title proxy. Preserve the text the user
            // actually sees/edited before composing the raw multilingual value
            // back into the submitted sync input.
            syncActiveBlockCustomHtmlVisibleToContent();

            if (!activeLegacyWidgetInputs.length) {
                if (activeLegacyWidget) {
                    const fields = getBlockCustomHtmlTitleFields($(activeLegacyWidget));
                    fields.visibleTitle.off('.qtkqBlockCustomHtml');
                }
                activeLegacyWidget = null;
                return;
            }

            if (activeLegacyWidget) {
                const fields = getBlockCustomHtmlTitleFields($(activeLegacyWidget));
                fields.visibleTitle.off('.qtkqBlockCustomHtml');
            }

            activeLegacyWidgetInputs.forEach(function (inputField) {
                $(inputField).off('change.qtkqLegacyBlockNoEncode');
                restoreLegacyWidgetInputRawValue(inputField);
                qtkq.removeContentHook(inputField);
                delete inputField.dataset.qtkqLegacyWidgetInitialized;
            });

            const form = activeLegacyWidgetInputs[0] && activeLegacyWidgetInputs[0].form;
            if (form && !form.querySelector("input[name^='qtranslate-fields[']")) {
                const editLanguage = form.querySelector("input[name='qtranslate-edit-language']");
                if (editLanguage)
                    editLanguage.remove();
            }

            activeLegacyWidget = null;
            activeLegacyWidgetInputs = [];
        };

        const initLegacyWidgetBlock = function (evt, widget) {
            const $widget = $(widget);
            const $editForm = $widget.closest('.wp-block-legacy-widget__edit-form');

            // widget-added also fires for forms WordPress pre-renders while hidden.
            // Only the form the user is actually editing may receive qTranslate hooks.
            if (!$editForm.length || $editForm.is('[hidden]'))
                return;

            const widgetBase = $widget.find('.id_base').val();

            // Text still has a dedicated TinyMCE lifecycle and remains outside
            // this compatibility path. Custom HTML is supported here through its WordPress
            // visible-title proxy + submitted .sync-input pair. Its content value
            // is not translated here; the selected editor receives only a layout
            // refresh after WordPress reveals the previously hidden form.
            if (widgetBase === 'text') {
                deactivateLegacyWidgetBlock();
                return;
            }

            let inputs;
            let customHtmlFields = null;

            if (widgetBase === 'custom_html') {
                customHtmlFields = getBlockCustomHtmlTitleFields($widget);
                inputs = customHtmlFields.syncTitle.toArray();
            } else {
                inputs = $widget
                    .find(".widget-content input[id^='widget-'][id$='-title']")
                    .toArray();
            }

            if (!inputs.length) {
                deactivateLegacyWidgetBlock();
                return;
            }

            if (
                activeLegacyWidget === $widget[0] &&
                activeLegacyWidgetInputs.length === inputs.length &&
                activeLegacyWidgetInputs.every(function (inputField, index) {
                    return inputField === inputs[index];
                })
            ) {
                return;
            }

            deactivateLegacyWidgetBlock();

            inputs.forEach(function (inputField) {
                let hook = inputField.id ? qtkq.hasContentHook(inputField.id) : null;

                // Never refresh an already active hook on the same DOM field:
                // refreshContentHook() removes the hidden language fields first,
                // while the visible input contains only the current language.
                if (hook && hook.contentField === inputField) {
                    inputField.dataset.qtkqLegacyWidgetInitialized = '1';
                } else {
                    // If WordPress replaced the form DOM but reused the same field id,
                    // remove the stale hook before initializing the new raw ML input.
                    if (hook && hook.contentField && hook.contentField !== inputField) {
                        qtkq.removeContentHook(hook.contentField);
                        hook = null;
                    }

                    hook = qtkq.refreshContentHook(inputField);
                    if (hook)
                        inputField.dataset.qtkqLegacyWidgetInitialized = '1';
                }

                if (inputField.dataset.qtkqLegacyWidgetInitialized === '1') {
                    $(inputField)
                        .off('change.qtkqLegacyBlockNoEncode')
                        .on(
                            'change.qtkqLegacyBlockNoEncode',
                            suppressLegacyWidgetLanguageSwitchChange
                        );
                }
            });

            activeLegacyWidget = $widget[0];
            activeLegacyWidgetInputs = inputs.filter(function (inputField) {
                return inputField.dataset.qtkqLegacyWidgetInitialized === '1';
            });

            if (
                widgetBase === 'custom_html' &&
                activeLegacyWidgetInputs.length &&
                customHtmlFields &&
                customHtmlFields.visibleTitle.length
            ) {
                // refreshContentHook() has replaced the sync input with the
                // current-language value. Mirror it to the WordPress title proxy.
                customHtmlFields.visibleTitle
                    .val(customHtmlFields.syncTitle.val())
                    .addClass('qtranxs-translatable')
                    .off('.qtkqBlockCustomHtml')
                    .on(
                        'input.qtkqBlockCustomHtml change.qtkqBlockCustomHtml',
                        function () {
                            // Keep the submitted sync field current before the
                            // same native event bubbles to the Legacy Widget form
                            // and WordPress serializes it for /encode.
                            customHtmlFields.syncTitle.val(this.value);
                        }
                    );
            }

            if (activeLegacyWidgetInputs.length)
                qtkq.setupLanguageSwitch();
        };

        $(document).on('widget-added.qtkqLegacyBlock', initLegacyWidgetBlock);

        // Legacy Widget forms and previews are hydrated per Widget Area. The early
        // middleware has already replaced the initial 1x /encode + 1x /render
        // burst for every existing Legacy Widget with lightweight responses.
        // When a Widget Area becomes expanded, hydrate all of its still-lazy
        // Legacy Widgets in one two-phase batch:
        //   1. fetch /encode responses, install every real form, run widget-added,
        //      and rehydrate Custom HTML CodeMirror models;
        //   2. only after the whole form phase is complete, install the projected
        //      response.preview values into their iframes using the existing
        //      per-language preview cache. No extra /render is needed for first open.
        const legacyWidgetAreaHydrationPromises = new Map();

        const waitTwoAnimationFrames = function () {
            return new Promise(function (resolve) {
                window.requestAnimationFrame(function () {
                    window.requestAnimationFrame(resolve);
                });
            });
        };

        const waitLegacyBatchCommit = function () {
            return waitTwoAnimationFrames().then(function () {
                // Custom HTML rehydration produces an immediate suppressed /encode
                // whose Promise still schedules a WordPress state commit. Install
                // previews only after the complete batch has settled so those
                // commits cannot restore lazy placeholders.
                return new Promise(function (resolve) {
                    window.setTimeout(resolve, 250);
                });
            });
        };

        const getLegacyWidgetNumber = function (widget) {
            if (!widget)
                return null;

            const field = widget.querySelector('.widget_number');
            const number = field ? Number(field.value) : NaN;
            return Number.isFinite(number) ? number : null;
        };

        const getLegacyWidgetBlockParts = function (block) {
            if (!block || !block.clientId)
                return null;

            const blockElement = document.querySelector(
                '[data-block="' + block.clientId + '"]'
            );
            const editForm = blockElement
                ? blockElement.querySelector('.wp-block-legacy-widget__edit-form')
                : null;
            const widget = editForm
                ? editForm.querySelector('.widget')
                : null;
            const widgetContent = widget
                ? widget.querySelector('.widget-content')
                : null;
            const previewIframe = blockElement
                ? blockElement.querySelector('iframe[srcdoc]')
                : null;

            return {
                blockElement,
                editForm,
                widget,
                widgetContent,
                previewIframe,
                widgetNumber: getLegacyWidgetNumber(widget)
            };
        };

        const rehydrateLegacyCustomHtmlCodeMirror = function (
            block,
            editForm,
            widgetNumber
        ) {
            if (
                !legacyLazyHydration ||
                !block ||
                !editForm ||
                !block.attributes ||
                block.attributes.idBase !== 'custom_html' ||
                !Number.isFinite(widgetNumber)
            ) {
                return;
            }

            const canonical = editForm.querySelector(
                'textarea[name="widget-custom_html[' + widgetNumber + '][content]"]'
            );
            const codeMirrorWrapper = editForm.querySelector('.CodeMirror');
            const codeMirror = codeMirrorWrapper
                ? codeMirrorWrapper.CodeMirror
                : null;

            if (
                !canonical ||
                !codeMirror ||
                typeof codeMirror.setValue !== 'function'
            ) {
                return;
            }

            const currentValue = typeof codeMirror.getValue === 'function'
                ? codeMirror.getValue()
                : null;

            if (currentValue !== canonical.value) {
                // CodeMirror is initially bound to WordPress's empty visible proxy
                // while the real form is still lazy. Rebuilding its model triggers
                // one native /encode; suppress exactly that programmatic request.
                legacyLazyHydration.suppressNextEncode('custom_html', widgetNumber);
                codeMirror.setValue(canonical.value);

                if (typeof codeMirror.save === 'function')
                    codeMirror.save();
                if (typeof codeMirror.clearHistory === 'function')
                    codeMirror.clearHistory();
            }

            if (!editForm.hidden && typeof codeMirror.refresh === 'function')
                codeMirror.refresh();
        };

        const installLegacyEncodePreview = function (block, canonicalPreview) {
            if (!block || typeof canonicalPreview !== 'string')
                return false;

            const parts = getLegacyWidgetBlockParts(block);
            if (!parts || !parts.previewIframe)
                return false;

            const entry = createLegacyPreviewCacheEntry(canonicalPreview);
            const preview = getLegacyPreviewVersion(
                entry,
                qtkq.getActiveLanguage()
            );

            if (!preview)
                return false;

            parts.previewIframe.srcdoc = preview;
            observeLegacyPreviewIframe(parts.previewIframe);
            return true;
        };

        const getLegacyWidgetBlocksForArea = function (areaBlock) {
            if (
                !areaBlock ||
                areaBlock.name !== 'core/widget-area' ||
                !window.wp ||
                !wp.data ||
                typeof wp.data.select !== 'function'
            ) {
                return [];
            }

            const blockEditorStore = wp.data.select('core/block-editor');
            if (
                !blockEditorStore ||
                typeof blockEditorStore.getClientIdsOfDescendants !== 'function' ||
                typeof blockEditorStore.getBlock !== 'function'
            ) {
                return [];
            }

            return blockEditorStore
                .getClientIdsOfDescendants([areaBlock.clientId])
                .map(function (clientId) {
                    return blockEditorStore.getBlock(clientId);
                })
                .filter(function (block) {
                    return block && block.name === 'core/legacy-widget';
                });
        };

        const getWidgetAreaHeaderToggle = function (areaBlock) {
            if (!areaBlock || !areaBlock.clientId)
                return null;

            const areaElement = document.querySelector(
                '[data-block="' + areaBlock.clientId + '"]'
            );
            if (!areaElement)
                return null;

            const areaName = String(
                areaBlock.attributes && areaBlock.attributes.name || ''
            ).replace(/\s+/g, ' ').trim();

            return Array.from(
                areaElement.querySelectorAll('button[aria-expanded]')
            ).find(function (button) {
                return String(button.innerText || '')
                    .replace(/\s+/g, ' ')
                    .trim() === areaName;
            }) || null;
        };

        const hydrateLegacyWidgetArea = function (areaBlock) {
            if (!legacyLazyHydration || !areaBlock || areaBlock.name !== 'core/widget-area')
                return null;

            if (legacyWidgetAreaHydrationPromises.has(areaBlock.clientId))
                return legacyWidgetAreaHydrationPromises.get(areaBlock.clientId);

            const rows = getLegacyWidgetBlocksForArea(areaBlock)
                .map(function (block) {
                    const parts = getLegacyWidgetBlockParts(block);
                    const idBase = block.attributes
                        ? block.attributes.idBase
                        : null;
                    const widgetNumber = parts
                        ? parts.widgetNumber
                        : null;

                    return {
                        block,
                        idBase,
                        widgetNumber
                    };
                })
                .filter(function (row) {
                    return (
                        row.idBase &&
                        Number.isFinite(row.widgetNumber) &&
                        legacyLazyHydration.hasCapturedRequest(row.idBase, row.widgetNumber) &&
                        !legacyLazyHydration.isHydrated(row.idBase, row.widgetNumber)
                    );
                });

            // The area can already be fully hydrated. Re-apply the currently
            // desired language through the preview cache without new REST.
            if (!rows.length) {
                scheduleLegacyPreviewSync(qtkq.getActiveLanguage());
                return null;
            }

            const hydration = Promise.all(
                rows.map(function (row) {
                    return Promise.resolve(
                        legacyLazyHydration.hydrate(row.idBase, row.widgetNumber)
                    ).then(function (response) {
                        if (
                            !response ||
                            typeof response.form !== 'string' ||
                            typeof response.preview !== 'string'
                        ) {
                            throw new Error(
                                'Invalid Legacy Widget /encode response for ' +
                                row.idBase + ' #' + row.widgetNumber
                            );
                        }

                        return {
                            row,
                            response
                        };
                    });
                })
            ).then(function (items) {
                // Phase 1: install every real form and emit the native lifecycle
                // before any real preview is written.
                items.forEach(function (item) {
                    const parts = getLegacyWidgetBlockParts(item.row.block);
                    if (
                        !parts ||
                        !parts.editForm ||
                        !parts.widget ||
                        !parts.widgetContent
                    ) {
                        throw new Error(
                            'Legacy Widget DOM disappeared during area hydration for ' +
                            item.row.idBase + ' #' + item.row.widgetNumber
                        );
                    }

                    parts.widgetContent.innerHTML = item.response.form;
                    legacyLazyHydration.markHydrated(
                        item.row.idBase,
                        item.row.widgetNumber
                    );

                    $(document).trigger('widget-added', [$(parts.widget)]);
                });

                return waitTwoAnimationFrames().then(function () {
                    items.forEach(function (item) {
                        if (item.row.idBase !== 'custom_html')
                            return;

                        const parts = getLegacyWidgetBlockParts(item.row.block);
                        if (!parts || !parts.editForm)
                            return;

                        rehydrateLegacyCustomHtmlCodeMirror(
                            item.row.block,
                            parts.editForm,
                            item.row.widgetNumber
                        );
                    });

                    return items;
                });
            }).then(function (items) {
                return waitLegacyBatchCommit().then(function () {
                    // Phase 2: all form/widget-added/CodeMirror work is complete.
                    // Use response.preview from the same /encode, project/cache it,
                    // and install it without an extra /render.
                    items.forEach(function (item) {
                        installLegacyEncodePreview(
                            item.row.block,
                            item.response.preview
                        );
                    });

                    scheduleLegacyPreviewSync(qtkq.getActiveLanguage());
                    return items;
                });
            }).catch(function (error) {
                console.error('qTranslate-KQ: Legacy Widget area hydration failed.', error);
                throw error;
            }).finally(function () {
                legacyWidgetAreaHydrationPromises.delete(areaBlock.clientId);
            });

            legacyWidgetAreaHydrationPromises.set(areaBlock.clientId, hydration);
            return hydration;
        };

        const getWidgetAreaForLegacyBlock = function (legacyBlock) {
            if (
                !legacyBlock ||
                !window.wp ||
                !wp.data ||
                typeof wp.data.select !== 'function'
            ) {
                return null;
            }

            const blockEditorStore = wp.data.select('core/block-editor');
            if (
                !blockEditorStore ||
                typeof blockEditorStore.getBlockParents !== 'function' ||
                typeof blockEditorStore.getBlock !== 'function'
            ) {
                return null;
            }

            const parentIds = blockEditorStore.getBlockParents(legacyBlock.clientId) || [];
            for (let index = parentIds.length - 1; index >= 0; --index) {
                const block = blockEditorStore.getBlock(parentIds[index]);
                if (block && block.name === 'core/widget-area')
                    return block;
            }

            return null;
        };

        const activateSelectedLegacyWidgetBlock = function () {
            if (!window.wp || !wp.data || typeof wp.data.select !== 'function')
                return;

            const blockEditorStore = wp.data.select('core/block-editor');
            if (!blockEditorStore || typeof blockEditorStore.getSelectedBlock !== 'function')
                return;

            const selectedBlock = blockEditorStore.getSelectedBlock();
            if (!selectedBlock || selectedBlock.name !== 'core/legacy-widget') {
                deactivateLegacyWidgetBlock();
                return;
            }

            const activateRealForm = function () {
                const parts = getLegacyWidgetBlockParts(selectedBlock);
                if (!parts || !parts.editForm || parts.editForm.hidden || !parts.widget)
                    return;

                initLegacyWidgetBlock(null, $(parts.widget));
                rehydrateLegacyCustomHtmlCodeMirror(
                    selectedBlock,
                    parts.editForm,
                    parts.widgetNumber
                );
            };

            const areaBlock = getWidgetAreaForLegacyBlock(selectedBlock);
            const areaHydration = areaBlock
                ? hydrateLegacyWidgetArea(areaBlock)
                : null;

            if (areaHydration) {
                Promise.resolve(areaHydration).then(function () {
                    const currentStore = wp.data.select('core/block-editor');
                    if (
                        currentStore &&
                        typeof currentStore.getSelectedBlockClientId === 'function' &&
                        currentStore.getSelectedBlockClientId() === selectedBlock.clientId
                    ) {
                        activateRealForm();
                    }
                });
                return;
            }

            activateRealForm();
        };

        let legacySelectionActivationToken = 0;

        const scheduleSelectedLegacyWidgetActivation = function () {
            const token = ++legacySelectionActivationToken;

            window.requestAnimationFrame(function () {
                window.requestAnimationFrame(function () {
                    if (token === legacySelectionActivationToken)
                        activateSelectedLegacyWidgetBlock();
                });
            });
        };

        const scheduleWidgetAreaHydrationFromClick = function (event) {
            const button = event && event.target && typeof event.target.closest === 'function'
                ? event.target.closest('button[aria-expanded]')
                : null;
            const areaElement = button && typeof button.closest === 'function'
                ? button.closest('[data-block]')
                : null;
            const clientId = areaElement
                ? areaElement.getAttribute('data-block')
                : null;

            if (!clientId)
                return;

            const blockEditorStore = wp.data.select('core/block-editor');
            const areaBlock = blockEditorStore && typeof blockEditorStore.getBlock === 'function'
                ? blockEditorStore.getBlock(clientId)
                : null;

            if (!areaBlock || areaBlock.name !== 'core/widget-area')
                return;

            const headerToggle = getWidgetAreaHeaderToggle(areaBlock);
            if (!headerToggle || button !== headerToggle)
                return;

            window.requestAnimationFrame(function () {
                window.requestAnimationFrame(function () {
                    if (headerToggle.getAttribute('aria-expanded') === 'true')
                        hydrateLegacyWidgetArea(areaBlock);
                });
            });
        };

        document.addEventListener(
            'click',
            function (event) {
                scheduleWidgetAreaHydrationFromClick(event);
                scheduleSelectedLegacyWidgetActivation();
            },
            true
        );

        // Reconcile the current Widget Area state instead of relying only on a
        // collapsed -> expanded click transition. WordPress can
        // render its first Widget Area already expanded, and that initial state may
        // land after qtkqLoadAdmin:widgets. A store subscription plus a narrow DOM
        // observer therefore schedules an idempotent reconciliation whenever the
        // editor or aria-expanded/area DOM changes. Only expanded areas that still
        // contain captured, unhydrated Legacy Widgets can start a real /encode
        // batch. If every area starts collapsed, this performs zero real requests.
        let legacyWidgetAreaReconcileScheduled = false;

        const legacyWidgetAreaNeedsHydration = function (areaBlock) {
            if (!legacyLazyHydration)
                return false;

            return getLegacyWidgetBlocksForArea(areaBlock).some(function (block) {
                const parts = getLegacyWidgetBlockParts(block);
                const idBase = block.attributes
                    ? block.attributes.idBase
                    : null;
                const widgetNumber = parts
                    ? parts.widgetNumber
                    : null;

                return (
                    idBase &&
                    Number.isFinite(widgetNumber) &&
                    legacyLazyHydration.hasCapturedRequest(idBase, widgetNumber) &&
                    !legacyLazyHydration.isHydrated(idBase, widgetNumber)
                );
            });
        };

        const reconcileExpandedLegacyWidgetAreas = function () {
            if (!window.wp || !wp.data || typeof wp.data.select !== 'function')
                return;

            const blockEditorStore = wp.data.select('core/block-editor');
            if (
                !blockEditorStore ||
                typeof blockEditorStore.getClientIdsWithDescendants !== 'function' ||
                typeof blockEditorStore.getBlock !== 'function'
            ) {
                return;
            }

            blockEditorStore.getClientIdsWithDescendants()
                .map(function (clientId) {
                    return blockEditorStore.getBlock(clientId);
                })
                .filter(function (block) {
                    return block && block.name === 'core/widget-area';
                })
                .forEach(function (areaBlock) {
                    const headerToggle = getWidgetAreaHeaderToggle(areaBlock);
                    if (
                        headerToggle &&
                        headerToggle.getAttribute('aria-expanded') === 'true' &&
                        !legacyWidgetAreaHydrationPromises.has(areaBlock.clientId) &&
                        legacyWidgetAreaNeedsHydration(areaBlock)
                    ) {
                        hydrateLegacyWidgetArea(areaBlock);
                    }
                });
        };

        const scheduleExpandedLegacyWidgetAreaReconciliation = function () {
            if (legacyWidgetAreaReconcileScheduled)
                return;

            legacyWidgetAreaReconcileScheduled = true;
            window.requestAnimationFrame(function () {
                window.requestAnimationFrame(function () {
                    legacyWidgetAreaReconcileScheduled = false;
                    reconcileExpandedLegacyWidgetAreas();
                });
            });
        };

        if (window.wp && wp.data && typeof wp.data.subscribe === 'function')
            wp.data.subscribe(scheduleExpandedLegacyWidgetAreaReconciliation);

        if (typeof window.MutationObserver === 'function' && document.body) {
            const legacyWidgetAreaStateObserver = new window.MutationObserver(function () {
                scheduleExpandedLegacyWidgetAreaReconciliation();
            });

            legacyWidgetAreaStateObserver.observe(document.body, {
                childList: true,
                subtree: true,
                attributes: true,
                attributeFilter: ['aria-expanded']
            });
        }

        scheduleExpandedLegacyWidgetAreaReconciliation();

        return;
    }

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
