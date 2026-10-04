/* qTranslate-KQ native Block Widgets multilingual adapter. */
/**
 * Native Block Widgets multilingual RichText adapter.
 *
 * The canonical block attribute always remains the full qTranslate multilingual
 * value. BlockEdit receives only the currently selected language and edits are
 * merged back into the full value before Gutenberg writes them to the
 * block-editor store.
 *
 * Supported block types are deliberately enumerated in native-rich-text.js.
 */
'use strict';

import {qtranxj_split} from '../core/qblocks';
import {
    getNativeRichTextBlockConfig,
    getNativeRichTextContentAttributes,
    isNativeRichTextContent,
    getNativeRichTextHtml,
    joinBracketTranslations
} from './native-rich-text';

const LANGUAGE_EVENT = 'qtkq:native-widget-language-change';
const PARAGRAPH_BLOCK = 'core/paragraph';
const PARAGRAPH_CONTENT_ATTRIBUTE = 'content';
const PARAGRAPH_ENTER_INSTALL_FLAG = '__qtkqNativeParagraphEnterAdapterInstalled';
const LIST_ITEM_BLOCK = 'core/list-item';
const LIST_ITEM_CONTENT_ATTRIBUTE = 'content';
const LIST_ITEM_ENTER_INSTALL_FLAG = '__qtkqNativeListItemEnterAdapterInstalled';
const CODE_BLOCK = 'core/code';
const CODE_CONTENT_ATTRIBUTE = 'content';
const CODE_ENTER_INSTALL_FLAG = '__qtkqNativeCodeEnterAdapterInstalled';
const qTranslateConfig = window.qTranslateConfig || {};

const isBlockWidgetsScreen = function () {
    const environment = qTranslateConfig.widget_environment || {};
    return environment.editorMode === 'block' && environment.screenId === 'widgets';
};

const getActiveLanguage = function () {
    const activeLanguage = qTranslateConfig.activeLanguage || qTranslateConfig.language || null;
    if (!activeLanguage)
        return null;

    const languages = qTranslateConfig.language_config || {};
    return Object.prototype.hasOwnProperty.call(languages, activeLanguage)
        ? activeLanguage
        : null;
};

const clamp = function (value, minimum, maximum) {
    return Math.min(Math.max(value, minimum), maximum);
};

/**
 * Split the projected language value, never the canonical value containing
 * qTranslate markers. Other languages remain intact in the first list item;
 * there is no safe way to infer their corresponding caret position.
 */
const splitActiveListItemLanguage = function (rawHtml, activeLanguage, startOffset, endOffset) {
    const translations = qtranxj_split(rawHtml);
    if (!Object.prototype.hasOwnProperty.call(translations, activeLanguage))
        return null;

    const languageHtml = translations[activeLanguage];
    const richTextValue = wp.richText.create({html: languageHtml});
    const visibleLength = richTextValue.text.length;
    const orderedStart = Math.min(startOffset, endOffset);
    const orderedEnd = Math.max(startOffset, endOffset);
    const start = clamp(orderedStart, 0, visibleLength);
    const end = clamp(orderedEnd, start, visibleLength);

    const headValue = wp.richText.remove(
        wp.richText.create({html: languageHtml}),
        start,
        visibleLength
    );
    const tailValue = wp.richText.remove(
        wp.richText.create({html: languageHtml}),
        0,
        end
    );
    const headTranslations = Object.assign({}, translations, {
        [activeLanguage]: wp.richText.toHTMLString({value: headValue})
    });
    const tailTranslations = {};

    for (const language in translations)
        tailTranslations[language] = '';

    tailTranslations[activeLanguage] = wp.richText.toHTMLString({value: tailValue});

    return {
        hasMultilingualMarkers: rawHtml !== languageHtml,
        visibleLength,
        start,
        end,
        headHtml: joinBracketTranslations(headTranslations),
        tailHtml: joinBracketTranslations(tailTranslations)
    };
};

const isUnmodifiedEnter = function (event) {
    return (
        !event.defaultPrevented &&
        !event.shiftKey &&
        !event.altKey &&
        !event.ctrlKey &&
        !event.metaKey &&
        !event.isComposing &&
        (event.key === 'Enter' || event.keyCode === 13)
    );
};

const isEditableEventTarget = function (event) {
    return Boolean(
        event.target &&
        typeof event.target.closest === 'function' &&
        event.target.closest('[contenteditable="true"]')
    );
};

/**
 * Gutenberg's selection offsets refer to the single-language projection, but
 * its generic split action reads the canonical block attribute. Intercept
 * Enter before that action and perform a marker-safe list-item split.
 */
const handleNativeListItemEnter = function (event) {
    if (!isUnmodifiedEnter(event) || !isEditableEventTarget(event))
        return false;

    const activeLanguage = getActiveLanguage();
    if (!activeLanguage || !wp.data || typeof wp.data.select !== 'function')
        return false;

    const blockEditorSelect = wp.data.select('core/block-editor');
    const blockEditorDispatch = wp.data.dispatch('core/block-editor');
    if (!blockEditorSelect || !blockEditorDispatch)
        return false;

    const selectionStart = blockEditorSelect.getSelectionStart();
    const selectionEnd = blockEditorSelect.getSelectionEnd();
    if (
        !selectionStart ||
        !selectionEnd ||
        selectionStart.clientId !== selectionEnd.clientId ||
        selectionStart.attributeKey !== LIST_ITEM_CONTENT_ATTRIBUTE ||
        selectionEnd.attributeKey !== LIST_ITEM_CONTENT_ATTRIBUTE ||
        typeof selectionStart.offset !== 'number' ||
        typeof selectionEnd.offset !== 'number'
    ) {
        return false;
    }

    const clientId = selectionStart.clientId;
    const block = blockEditorSelect.getBlock(clientId);
    if (!block || block.name !== LIST_ITEM_BLOCK || !block.attributes)
        return false;

    const rawHtml = getNativeRichTextHtml(block.attributes[LIST_ITEM_CONTENT_ATTRIBUTE]);
    const split = splitActiveListItemLanguage(
        rawHtml,
        activeLanguage,
        selectionStart.offset,
        selectionEnd.offset
    );

    // Native splitting is already correct for neutral content because its raw
    // and projected offsets are identical.
    if (!split || !split.hasMultilingualMarkers)
        return false;

    event.preventDefault();
    event.stopPropagation();

    const isCollapsed = split.start === split.end;
    const rootClientId = blockEditorSelect.getBlockRootClientId(clientId);
    const blockIndex = blockEditorSelect.getBlockIndex(clientId);

    if (isCollapsed && split.start === 0 && split.visibleLength > 0) {
        blockEditorDispatch.insertBlocks(
            [wp.blocks.createBlock(LIST_ITEM_BLOCK)],
            blockIndex,
            rootClientId,
            false
        );
        return true;
    }

    if (isCollapsed && split.end === split.visibleLength) {
        blockEditorDispatch.insertBlocks(
            [wp.blocks.createBlock(LIST_ITEM_BLOCK)],
            blockIndex + 1,
            rootClientId
        );
        return true;
    }

    const head = Object.assign({}, block, {
        innerBlocks: [],
        attributes: Object.assign({}, block.attributes, {
            [LIST_ITEM_CONTENT_ATTRIBUTE]: wp.richText.RichTextData.fromHTMLString(split.headHtml)
        })
    });
    const tail = Object.assign({}, block, {
        clientId: wp.blocks.createBlock(LIST_ITEM_BLOCK).clientId,
        attributes: Object.assign({}, block.attributes, {
            [LIST_ITEM_CONTENT_ATTRIBUTE]: wp.richText.RichTextData.fromHTMLString(split.tailHtml)
        })
    });

    blockEditorDispatch.replaceBlocks([clientId], [head, tail], 1, 0);
    return true;
};

const installNativeListItemEnterAdapter = function () {
    if (
        document[LIST_ITEM_ENTER_INSTALL_FLAG] ||
        !wp.data ||
        typeof wp.data.dispatch !== 'function' ||
        !wp.blocks ||
        typeof wp.blocks.createBlock !== 'function' ||
        typeof wp.richText.create !== 'function' ||
        typeof wp.richText.remove !== 'function'
    ) {
        return;
    }

    document[LIST_ITEM_ENTER_INSTALL_FLAG] = true;
    document.addEventListener('keydown', handleNativeListItemEnter, true);
};

/**
 * Paragraphs use the same structural Enter split as Gutenberg list items: the
 * editor selection offsets belong to the active-language projection, while the
 * block-editor store contains the canonical qTranslate value. Intercept plain
 * Enter only for marker-bearing core/paragraph content and split the projected
 * language instead of applying projection offsets to canonical markers.
 *
 * Other languages remain intact in the first paragraph. The second paragraph
 * receives only the active-language tail because there is no safe corresponding
 * caret position for translations that were not being edited.
 */
const handleNativeParagraphEnter = function (event) {
    if (!isUnmodifiedEnter(event) || !isEditableEventTarget(event))
        return false;

    const activeLanguage = getActiveLanguage();
    if (!activeLanguage || !wp.data || typeof wp.data.select !== 'function')
        return false;

    const blockEditorSelect = wp.data.select('core/block-editor');
    const blockEditorDispatch = wp.data.dispatch('core/block-editor');
    if (!blockEditorSelect || !blockEditorDispatch)
        return false;

    const selectionStart = blockEditorSelect.getSelectionStart();
    const selectionEnd = blockEditorSelect.getSelectionEnd();
    if (
        !selectionStart ||
        !selectionEnd ||
        selectionStart.clientId !== selectionEnd.clientId ||
        selectionStart.attributeKey !== PARAGRAPH_CONTENT_ATTRIBUTE ||
        selectionEnd.attributeKey !== PARAGRAPH_CONTENT_ATTRIBUTE ||
        typeof selectionStart.offset !== 'number' ||
        typeof selectionEnd.offset !== 'number'
    ) {
        return false;
    }

    const clientId = selectionStart.clientId;
    const block = blockEditorSelect.getBlock(clientId);
    if (!block || block.name !== PARAGRAPH_BLOCK || !block.attributes)
        return false;

    const rawHtml = getNativeRichTextHtml(block.attributes[PARAGRAPH_CONTENT_ATTRIBUTE]);
    const split = splitActiveListItemLanguage(
        rawHtml,
        activeLanguage,
        selectionStart.offset,
        selectionEnd.offset
    );

    // Neutral paragraphs use Gutenberg's native path because raw and projected
    // offsets are identical and there are no qTranslate markers to protect.
    if (!split || !split.hasMultilingualMarkers)
        return false;

    event.preventDefault();
    event.stopPropagation();

    const isCollapsed = split.start === split.end;
    const rootClientId = blockEditorSelect.getBlockRootClientId(clientId);
    const blockIndex = blockEditorSelect.getBlockIndex(clientId);

    if (isCollapsed && split.start === 0 && split.visibleLength > 0) {
        blockEditorDispatch.insertBlocks(
            [wp.blocks.createBlock(PARAGRAPH_BLOCK)],
            blockIndex,
            rootClientId,
            false
        );
        return true;
    }

    if (isCollapsed && split.end === split.visibleLength) {
        blockEditorDispatch.insertBlocks(
            [wp.blocks.createBlock(PARAGRAPH_BLOCK)],
            blockIndex + 1,
            rootClientId
        );
        return true;
    }

    const head = Object.assign({}, block, {
        innerBlocks: [],
        attributes: Object.assign({}, block.attributes, {
            [PARAGRAPH_CONTENT_ATTRIBUTE]: wp.richText.RichTextData.fromHTMLString(split.headHtml)
        })
    });
    const tail = Object.assign({}, block, {
        clientId: wp.blocks.createBlock(PARAGRAPH_BLOCK).clientId,
        innerBlocks: [],
        attributes: Object.assign({}, block.attributes, {
            [PARAGRAPH_CONTENT_ATTRIBUTE]: wp.richText.RichTextData.fromHTMLString(split.tailHtml)
        })
    });

    blockEditorDispatch.replaceBlocks([clientId], [head, tail], 1, 0);
    return true;
};

const installNativeParagraphEnterAdapter = function () {
    if (
        document[PARAGRAPH_ENTER_INSTALL_FLAG] ||
        !wp.data ||
        typeof wp.data.dispatch !== 'function' ||
        !wp.blocks ||
        typeof wp.blocks.createBlock !== 'function' ||
        typeof wp.richText.create !== 'function' ||
        typeof wp.richText.remove !== 'function'
    ) {
        return;
    }

    document[PARAGRAPH_ENTER_INSTALL_FLAG] = true;
    document.addEventListener('keydown', handleNativeParagraphEnter, true);
};

/**
 * Insert a native RichText line break into the active-language projection of a
 * multilingual Code block. Gutenberg selection offsets are projection-relative,
 * so they must never be applied directly to the canonical marker-bearing value.
 */
const insertActiveCodeLanguageLineBreak = function (rawHtml, activeLanguage, startOffset, endOffset) {
    const translations = qtranxj_split(rawHtml);
    if (!Object.prototype.hasOwnProperty.call(translations, activeLanguage))
        return null;

    const languageHtml = translations[activeLanguage];
    const richTextValue = wp.richText.create({html: languageHtml});
    const visibleLength = richTextValue.text.length;
    const orderedStart = Math.min(startOffset, endOffset);
    const orderedEnd = Math.max(startOffset, endOffset);
    const start = clamp(orderedStart, 0, visibleLength);
    const end = clamp(orderedEnd, start, visibleLength);
    const nextValue = wp.richText.insert(richTextValue, '\n', start, end);

    translations[activeLanguage] = wp.richText.toHTMLString({value: nextValue});

    return {
        hasMultilingualMarkers: rawHtml !== languageHtml,
        visibleLength,
        start,
        end,
        caretOffset: start + 1,
        fullHtml: joinBracketTranslations(translations)
    };
};

/**
 * Code blocks normally keep Enter inside <code>. With qTranslate markers in the
 * canonical attribute, Gutenberg can instead apply the projected caret offset to
 * that canonical value and split it at the wrong raw position. Intercept plain
 * Enter only for marker-bearing core/code content, insert the native newline in
 * the active-language RichText value, merge it back, and restore the caret after
 * the inserted break. Neutral content keeps Gutenberg's native path.
 */
const handleNativeCodeEnter = function (event) {
    if (!isUnmodifiedEnter(event) || !isEditableEventTarget(event))
        return false;

    const activeLanguage = getActiveLanguage();
    if (!activeLanguage || !wp.data || typeof wp.data.select !== 'function')
        return false;

    const blockEditorSelect = wp.data.select('core/block-editor');
    const blockEditorDispatch = wp.data.dispatch('core/block-editor');
    if (
        !blockEditorSelect ||
        !blockEditorDispatch ||
        typeof blockEditorDispatch.updateBlockAttributes !== 'function'
    ) {
        return false;
    }

    const selectionStart = blockEditorSelect.getSelectionStart();
    const selectionEnd = blockEditorSelect.getSelectionEnd();
    if (
        !selectionStart ||
        !selectionEnd ||
        selectionStart.clientId !== selectionEnd.clientId ||
        selectionStart.attributeKey !== CODE_CONTENT_ATTRIBUTE ||
        selectionEnd.attributeKey !== CODE_CONTENT_ATTRIBUTE ||
        typeof selectionStart.offset !== 'number' ||
        typeof selectionEnd.offset !== 'number'
    ) {
        return false;
    }

    const clientId = selectionStart.clientId;
    const block = blockEditorSelect.getBlock(clientId);
    if (!block || block.name !== CODE_BLOCK || !block.attributes)
        return false;

    const rawHtml = getNativeRichTextHtml(block.attributes[CODE_CONTENT_ATTRIBUTE]);
    const insertion = insertActiveCodeLanguageLineBreak(
        rawHtml,
        activeLanguage,
        selectionStart.offset,
        selectionEnd.offset
    );

    // Neutral content uses identical raw/projected offsets and is already handled
    // correctly by the native Code block.
    if (!insertion || !insertion.hasMultilingualMarkers)
        return false;

    event.preventDefault();
    event.stopPropagation();

    blockEditorDispatch.updateBlockAttributes(clientId, {
        [CODE_CONTENT_ATTRIBUTE]: wp.richText.RichTextData.fromHTMLString(insertion.fullHtml)
    });

    if (typeof blockEditorDispatch.selectionChange === 'function') {
        blockEditorDispatch.selectionChange(
            clientId,
            CODE_CONTENT_ATTRIBUTE,
            insertion.caretOffset,
            insertion.caretOffset
        );
    }

    return true;
};

const installNativeCodeEnterAdapter = function () {
    if (
        document[CODE_ENTER_INSTALL_FLAG] ||
        !wp.data ||
        typeof wp.data.dispatch !== 'function' ||
        !wp.richText ||
        !wp.richText.RichTextData ||
        typeof wp.richText.create !== 'function' ||
        typeof wp.richText.insert !== 'function' ||
        typeof wp.richText.toHTMLString !== 'function'
    ) {
        return;
    }

    document[CODE_ENTER_INSTALL_FLAG] = true;
    document.addEventListener('keydown', handleNativeCodeEnter, true);
};

const installNativeWidgetBlockAdapter = function () {
    if (!isBlockWidgetsScreen())
        return;

    if (
        !window.wp ||
        !wp.hooks ||
        typeof wp.hooks.addFilter !== 'function' ||
        !wp.element ||
        typeof wp.element.createElement !== 'function' ||
        typeof wp.element.useEffect !== 'function' ||
        typeof wp.element.useMemo !== 'function' ||
        typeof wp.element.useState !== 'function' ||
        !wp.richText ||
        !wp.richText.RichTextData ||
        typeof wp.richText.toHTMLString !== 'function'
    ) {
        console.error('qTranslate-KQ: required WordPress APIs are unavailable for native Block Widgets.');
        return;
    }

    const RichTextData = wp.richText.RichTextData;
    const createElement = wp.element.createElement;
    const useEffect = wp.element.useEffect;
    const useMemo = wp.element.useMemo;
    const useState = wp.element.useState;

    const withQTranslateNativeWidget = function (BlockEdit) {
        const NativeRichTextBlockEdit = function (props) {
            const blockConfig = getNativeRichTextBlockConfig(props.name);
            const contentAttributes = getNativeRichTextContentAttributes(blockConfig);
            const [activeLanguage, setActiveLanguage] = useState(getActiveLanguage);

            useEffect(function () {
                const onLanguageChange = function (event) {
                    const nextLanguage = event && event.detail && event.detail.language;
                    const languages = qTranslateConfig.language_config || {};

                    if (
                        nextLanguage &&
                        Object.prototype.hasOwnProperty.call(languages, nextLanguage)
                    ) {
                        setActiveLanguage(nextLanguage);
                    }
                };

                window.addEventListener(LANGUAGE_EVENT, onLanguageChange);

                const currentLanguage = getActiveLanguage();
                if (currentLanguage)
                    setActiveLanguage(currentLanguage);

                return function () {
                    window.removeEventListener(LANGUAGE_EVENT, onLanguageChange);
                };
            }, []);

            const visibleAttributes = useMemo(function () {
                const projected = {};

                for (const contentAttribute of contentAttributes) {
                    const rawContent = props.attributes[contentAttribute];
                    if (!isNativeRichTextContent(rawContent, blockConfig))
                        continue;

                    if (!activeLanguage) {
                        projected[contentAttribute] = rawContent;
                        continue;
                    }

                    const rawHtml = getNativeRichTextHtml(rawContent);
                    const translations = qtranxj_split(rawHtml);
                    const languageHtml = Object.prototype.hasOwnProperty.call(translations, activeLanguage)
                        ? translations[activeLanguage]
                        : '';

                    projected[contentAttribute] = blockConfig.projectsHtmlString
                        ? languageHtml
                        : RichTextData.fromHTMLString(languageHtml);
                }

                return projected;
            }, [props.attributes, activeLanguage]);

            const originalSetAttributes = props.setAttributes;
            const setAttributes = function (nextAttributes) {
                if (
                    !activeLanguage ||
                    !nextAttributes ||
                    typeof nextAttributes !== 'object'
                ) {
                    return originalSetAttributes(nextAttributes);
                }

                const managedAttributes = contentAttributes.filter(function (contentAttribute) {
                    return (
                        Object.prototype.hasOwnProperty.call(nextAttributes, contentAttribute) &&
                        isNativeRichTextContent(nextAttributes[contentAttribute], blockConfig)
                    );
                });

                if (!managedAttributes.length)
                    return originalSetAttributes(nextAttributes);

                let latestBlock = null;
                if (
                    props.clientId &&
                    window.wp &&
                    wp.data &&
                    typeof wp.data.select === 'function'
                ) {
                    const blockEditorStore = wp.data.select('core/block-editor');
                    latestBlock = blockEditorStore &&
                        typeof blockEditorStore.getBlock === 'function'
                        ? blockEditorStore.getBlock(props.clientId)
                        : null;
                }

                const mergedAttributes = Object.assign({}, nextAttributes);

                for (const contentAttribute of managedAttributes) {
                    let latestRawContent = props.attributes[contentAttribute];
                    const latestContent = latestBlock && latestBlock.attributes
                        ? latestBlock.attributes[contentAttribute]
                        : null;

                    if (latestBlock && isNativeRichTextContent(latestContent, blockConfig))
                        latestRawContent = latestContent;

                    const rawHtml = getNativeRichTextHtml(latestRawContent);
                    const translations = qtranxj_split(rawHtml);
                    translations[activeLanguage] = getNativeRichTextHtml(
                        nextAttributes[contentAttribute]
                    );

                    const fullMultilingualHtml = joinBracketTranslations(translations);
                    mergedAttributes[contentAttribute] = RichTextData.fromHTMLString(
                        fullMultilingualHtml
                    );
                }

                return originalSetAttributes(mergedAttributes);
            };

            const nextProps = Object.assign({}, props, {
                attributes: Object.assign({}, props.attributes, visibleAttributes),
                setAttributes
            });

            return createElement(BlockEdit, nextProps);
        };

        return function QTranslateNativeWidgetBlockEdit(props) {
            const blockConfig = getNativeRichTextBlockConfig(props.name);
            if (!blockConfig)
                return createElement(BlockEdit, props);

            const contentAttributes = getNativeRichTextContentAttributes(blockConfig);
            const hasSupportedContent = contentAttributes.some(function (contentAttribute) {
                const rawContent = props.attributes && props.attributes[contentAttribute];
                return isNativeRichTextContent(rawContent, blockConfig);
            });

            if (!hasSupportedContent)
                return createElement(BlockEdit, props);

            return createElement(NativeRichTextBlockEdit, props);
        };
    };

    wp.hooks.addFilter(
        'editor.BlockEdit',
        'qtranslate-kq/native-widget-rich-text',
        withQTranslateNativeWidget
    );

    installNativeListItemEnterAdapter();
    installNativeParagraphEnterAdapter();
    installNativeCodeEnterAdapter();
};

installNativeWidgetBlockAdapter();

export {
    LANGUAGE_EVENT,
    handleNativeListItemEnter,
    splitActiveListItemLanguage,
    handleNativeParagraphEnter,
    handleNativeCodeEnter,
    insertActiveCodeLanguageLineBreak
};
