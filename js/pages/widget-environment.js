/* qTranslate-KQ widgets editor environment detection. */
'use strict';

const getPhpEnvironment = function () {
    const config = window.qTranslateConfig || {};
    return config.widget_environment || {};
};

const getSelectedBlock = function () {
    if (!window.wp || !window.wp.data || typeof window.wp.data.select !== 'function')
        return null;

    const blockEditor = window.wp.data.select('core/block-editor');
    if (!blockEditor || typeof blockEditor.getSelectedBlockClientId !== 'function' || typeof blockEditor.getBlock !== 'function')
        return null;

    const clientId = blockEditor.getSelectedBlockClientId();
    if (!clientId)
        return {clientId: null, block: null};

    return {clientId, block: blockEditor.getBlock(clientId)};
};

const getSnapshot = function () {
    const phpEnvironment = getPhpEnvironment();
    const editorMode = phpEnvironment.editorMode === 'block' ? 'block' : 'classic';

    if (editorMode === 'classic') {
        return {
            editorMode: 'classic',
            screenId: phpEnvironment.screenId || null,
            wpScreenIsBlockEditor: !!phpEnvironment.wpScreenIsBlockEditor,
            wpUseWidgetsBlockEditor: !!phpEnvironment.wpUseWidgetsBlockEditor,
        };
    }

    const selection = getSelectedBlock();
    const block = selection && selection.block ? selection.block : null;
    const blockName = block && typeof block.name === 'string' ? block.name : null;
    const isLegacy = blockName === 'core/legacy-widget';
    const attributes = block && block.attributes ? block.attributes : {};

    const snapshot = {
        editorMode: 'block',
        screenId: phpEnvironment.screenId || null,
        wpScreenIsBlockEditor: !!phpEnvironment.wpScreenIsBlockEditor,
        wpUseWidgetsBlockEditor: !!phpEnvironment.wpUseWidgetsBlockEditor,
        selectedBlockClientId: selection ? selection.clientId : null,
        selectedBlockType: blockName ? (isLegacy ? 'legacy' : 'native') : null,
        blockName,
    };

    if (isLegacy) {
        snapshot.idBase = typeof attributes.idBase === 'string' ? attributes.idBase : null;
        snapshot.widgetId = typeof attributes.id === 'string' ? attributes.id : null;
        snapshot.internalWidgetId = typeof attributes.__internalWidgetId === 'string'
            ? attributes.__internalWidgetId
            : null;
    }

    return snapshot;
};

const installWidgetEnvironmentDiagnostics = function () {
    const diagnostic = {
        getSnapshot,
    };

    [
        'editorMode',
        'screenId',
        'wpScreenIsBlockEditor',
        'wpUseWidgetsBlockEditor',
        'selectedBlockClientId',
        'selectedBlockType',
        'blockName',
        'idBase',
        'widgetId',
        'internalWidgetId',
    ].forEach(function (property) {
        Object.defineProperty(diagnostic, property, {
            configurable: false,
            enumerable: true,
            get: function () {
                return getSnapshot()[property];
            },
        });
    });

    window.qTranslateKQWidgetEnvironment = diagnostic;
};

export {installWidgetEnvironmentDiagnostics};
