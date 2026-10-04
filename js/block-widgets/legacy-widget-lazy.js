/* qTranslate-KQ Legacy Widget lazy hydration bootstrap. */
'use strict';

const qTranslateConfig = window.qTranslateConfig || {};
const environment = qTranslateConfig.widget_environment || {};
const GLOBAL_NAME = 'qTranslateKQLegacyWidgetLazyHydration';
const PLACEHOLDER_CLASS = 'qtkq-legacy-widget-lazy-placeholder';
const PLACEHOLDER_META = 'qtkq-legacy-widget-lazy-preview';

const isBlockWidgetsScreen = function () {
    return environment.editorMode === 'block' && environment.screenId === 'widgets';
};

const clonePlain = function (value) {
    try {
        if (typeof structuredClone === 'function')
            return structuredClone(value);
    } catch (error) {
        // Fall through to JSON cloning for the plain apiFetch request data.
    }

    try {
        return JSON.parse(JSON.stringify(value));
    } catch (error) {
        return value;
    }
};

const getRoute = function (path) {
    const match = String(path || '').match(
        /^\/wp\/v2\/widget-types\/([^/]+)\/(encode|render)(?:\?|$)/i
    );

    return match
        ? {
            idBase: decodeURIComponent(match[1]),
            action: match[2].toLowerCase(),
        }
        : null;
};

const getInstanceSignature = function (instance) {
    if (
        !instance ||
        typeof instance.encoded !== 'string' ||
        typeof instance.hash !== 'string'
    ) {
        return null;
    }

    return instance.encoded + '|' + instance.hash;
};

const getWidgetNumber = function (options) {
    const value = options && options.data
        ? options.data.number
        : null;
    const number = Number(value);

    return Number.isFinite(number)
        ? number
        : null;
};

const getKey = function (idBase, number) {
    return idBase && Number.isFinite(number)
        ? idBase + '|' + number
        : null;
};

const makePlaceholderForm = function (idBase, number) {
    return (
        '<div class="' + PLACEHOLDER_CLASS + '"' +
        ' data-qtkq-id-base="' + String(idBase || '').replace(/"/g, '&quot;') + '"' +
        ' data-qtkq-number="' + String(number == null ? '' : number) + '">' +
        '<span class="spinner is-active" aria-hidden="true"></span>' +
        '<span class="screen-reader-text">Loading Legacy Widget form…</span>' +
        '</div>'
    );
};

const makePlaceholderPreview = function (idBase, number) {
    return (
        '<!doctype html><html><head><meta charset="utf-8">' +
        '<meta name="' + PLACEHOLDER_META + '" content="1">' +
        '<style>html,body{margin:0;padding:0;background:transparent}body{font:13px/1.4 sans-serif;color:#646970;padding:8px}</style>' +
        '</head><body data-qtkq-legacy-placeholder="1">' +
        '<span aria-hidden="true">Loading…</span>' +
        '<span class="screen-reader-text">Loading Legacy Widget preview…</span>' +
        '</body></html>'
    );
};

const installLegacyWidgetLazyMiddleware = function () {
    if (!isBlockWidgetsScreen())
        return;

    if (window[GLOBAL_NAME] && window[GLOBAL_NAME].installed)
        return;

    if (!window.wp || !wp.apiFetch || typeof wp.apiFetch.use !== 'function') {
        console.error('qTranslate-KQ: wp.apiFetch is unavailable for early Legacy Widget lazy hydration.');
        return;
    }

    const capturedRequests = new Map();
    const initialInstanceSignatures = new Set();
    const hydratedKeys = new Set();
    const realEncodeAllowances = new Map();
    const suppressedEncodeCounts = new Map();
    let suppressBootstrapRenders = true;
    const stats = {
        placeholderEncode: 0,
        placeholderRender: 0,
        realEncode: 0,
        realRender: 0,
        suppressedEncode: 0,
    };

    const incrementCounter = function (map, key) {
        map.set(key, (map.get(key) || 0) + 1);
    };

    const consumeCounter = function (map, key) {
        const count = map.get(key) || 0;
        if (count <= 0)
            return false;

        if (count === 1)
            map.delete(key);
        else
            map.set(key, count - 1);

        return true;
    };

    const makePlaceholderEncodeResponse = function (options, idBase, number) {
        return {
            form: makePlaceholderForm(idBase, number),
            preview: makePlaceholderPreview(idBase, number),
            instance: options && options.data
                ? options.data.instance || null
                : null,
        };
    };

    const controller = {
        installed: true,
        placeholderClass: PLACEHOLDER_CLASS,
        placeholderPreviewMeta: PLACEHOLDER_META,

        getKey,

        endBootstrap: function () {
            suppressBootstrapRenders = false;
        },

        getCapturedRequest: function (idBase, number) {
            const key = getKey(idBase, Number(number));
            const request = key
                ? capturedRequests.get(key)
                : null;

            return request
                ? clonePlain(request)
                : null;
        },

        hasCapturedRequest: function (idBase, number) {
            const key = getKey(idBase, Number(number));
            return !!key && capturedRequests.has(key);
        },

        isHydrated: function (idBase, number) {
            const key = getKey(idBase, Number(number));
            return !!key && hydratedKeys.has(key);
        },

        markHydrated: function (idBase, number) {
            const key = getKey(idBase, Number(number));
            if (key)
                hydratedKeys.add(key);
        },

        suppressNextEncode: function (idBase, number) {
            const key = getKey(idBase, Number(number));
            if (key)
                incrementCounter(suppressedEncodeCounts, key);
        },

        hydrate: function (idBase, number) {
            const numericNumber = Number(number);
            const key = getKey(idBase, numericNumber);
            const request = key
                ? capturedRequests.get(key)
                : null;

            if (!key || !request)
                return Promise.reject(new Error('Missing captured Legacy Widget request for ' + idBase + ' #' + numericNumber));

            incrementCounter(realEncodeAllowances, key);

            return Promise.resolve(
                wp.apiFetch({
                    path: request.path,
                    method: request.method || 'POST',
                    data: clonePlain(request.data),
                })
            ).finally(function () {
                // If the request never reached middleware for any reason, remove
                // the unused allowance instead of leaking it into a later edit.
                consumeCounter(realEncodeAllowances, key);
            });
        },

        getDiagnostics: function () {
            return {
                capturedCount: capturedRequests.size,
                hydratedCount: hydratedKeys.size,
                capturedKeys: Array.from(capturedRequests.keys()),
                hydratedKeys: Array.from(hydratedKeys),
                stats: Object.assign({}, stats),
            };
        },
    };

    window[GLOBAL_NAME] = controller;

    wp.apiFetch.use(function (options, next) {
        const route = getRoute(options && (options.path || options.url));
        if (!route)
            return next(options);

        const instance = options && options.data
            ? options.data.instance
            : null;
        const signature = getInstanceSignature(instance);

        if (route.action === 'render') {
            if (suppressBootstrapRenders) {
                stats.placeholderRender++;
                return Promise.resolve({
                    preview: makePlaceholderPreview(route.idBase, null),
                });
            }

            // Initial Legacy previews always render the same encoded instance
            // captured during bootstrap. Keep those previews lightweight. A real
            // user edit returns a new encoded instance, so its /render naturally
            // proceeds through WordPress and the existing qTranslate preview
            // projection middleware.
            if (signature && initialInstanceSignatures.has(signature)) {
                stats.placeholderRender++;
                return Promise.resolve({
                    preview: makePlaceholderPreview(route.idBase, null),
                });
            }

            stats.realRender++;
            return next(options);
        }

        const number = getWidgetNumber(options);
        const key = getKey(route.idBase, number);

        // New/unmappable Legacy Widgets remain entirely on WordPress's native
        // path. Lazy hydration is only for existing encoded instances that have
        // a stable widget number.
        if (!key || !signature)
            return next(options);

        if (consumeCounter(realEncodeAllowances, key)) {
            stats.realEncode++;
            return next(options);
        }

        if (consumeCounter(suppressedEncodeCounts, key)) {
            stats.suppressedEncode++;
            stats.placeholderEncode++;
            return Promise.resolve(makePlaceholderEncodeResponse(options, route.idBase, number));
        }

        if (hydratedKeys.has(key)) {
            stats.realEncode++;
            return next(options);
        }

        if (!capturedRequests.has(key)) {
            capturedRequests.set(key, {
                path: options.path,
                method: options.method || 'POST',
                data: clonePlain(options.data),
                idBase: route.idBase,
                number,
                instanceSignature: signature,
            });
            initialInstanceSignatures.add(signature);
        }

        stats.placeholderEncode++;
        return Promise.resolve(makePlaceholderEncodeResponse(options, route.idBase, number));
    });
};

installLegacyWidgetLazyMiddleware();

export {installLegacyWidgetLazyMiddleware};
