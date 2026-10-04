/* qTranslate-KQ native Block Widgets RichText configuration. */
/**
 * Shared configuration/helpers for native blocks whose multilingual payload is
 * stored in one or more explicitly configured RichText attributes.
 *
 * Keep this list explicit. A block is supported only after its schema and
 * runtime lifecycle have been verified on the target WordPress version.
 */
'use strict';

const NATIVE_RICH_TEXT_BLOCKS = Object.freeze({
    'core/paragraph': Object.freeze({
        contentAttribute: 'content'
    }),
    'core/heading': Object.freeze({
        contentAttribute: 'content'
    }),
    'core/list-item': Object.freeze({
        contentAttribute: 'content',
        acceptsHtmlString: true
    }),
    'core/preformatted': Object.freeze({
        contentAttribute: 'content'
    }),
    'core/verse': Object.freeze({
        contentAttribute: 'content'
    }),
    'core/details': Object.freeze({
        contentAttribute: 'summary'
    }),
    'core/accordion-heading': Object.freeze({
        contentAttribute: 'title'
    }),
    'core/file': Object.freeze({
        contentAttributes: Object.freeze(['fileName', 'downloadButtonText']),
        acceptsHtmlString: true
    }),
    'core/pullquote': Object.freeze({
        contentAttributes: Object.freeze(['value', 'citation'])
    }),
    'core/quote': Object.freeze({
        contentAttribute: 'citation'
    }),
    'core/image': Object.freeze({
        contentAttribute: 'caption'
    }),
    'core/video': Object.freeze({
        contentAttribute: 'caption',
        acceptsHtmlString: true,
        projectsHtmlString: true
    }),
    'core/audio': Object.freeze({
        contentAttribute: 'caption',
        acceptsHtmlString: true,
        projectsHtmlString: true
    }),
    'core/embed': Object.freeze({
        contentAttribute: 'caption'
    }),
    'core/gallery': Object.freeze({
        contentAttribute: 'caption'
    }),
    'core/table': Object.freeze({
        contentAttribute: 'caption'
    }),
    'core/code': Object.freeze({
        contentAttribute: 'content'
    }),
    'core/button': Object.freeze({
        contentAttribute: 'text',
        acceptsHtmlString: true,
        projectsHtmlString: true
    })
});

const getNativeRichTextBlockConfig = function (blockName) {
    if (!blockName || !Object.prototype.hasOwnProperty.call(NATIVE_RICH_TEXT_BLOCKS, blockName))
        return null;

    return NATIVE_RICH_TEXT_BLOCKS[blockName];
};

const getNativeRichTextContentAttributes = function (blockConfig) {
    if (!blockConfig)
        return [];

    if (Array.isArray(blockConfig.contentAttributes))
        return blockConfig.contentAttributes.slice();

    return blockConfig.contentAttribute
        ? [blockConfig.contentAttribute]
        : [];
};

// Some native block callbacks and structural operations can provide HTML
// strings even though parsing normally produces RichTextData. Permit strings
// and empty initial values only for explicit opt-ins above.
const isNativeRichTextContent = function (value, blockConfig) {
    return value instanceof wp.richText.RichTextData || Boolean(
        blockConfig && blockConfig.acceptsHtmlString &&
        (typeof value === 'string' || value === undefined || value === null)
    );
};

const getNativeRichTextHtml = function (value) {
    if (typeof value === 'string')
        return value;
    if (value === undefined || value === null)
        return '';
    return wp.richText.toHTMLString({value});
};

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

export {
    NATIVE_RICH_TEXT_BLOCKS,
    getNativeRichTextBlockConfig,
    getNativeRichTextContentAttributes,
    isNativeRichTextContent,
    getNativeRichTextHtml,
    joinBracketTranslations
};
