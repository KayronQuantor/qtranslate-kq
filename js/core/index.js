/*! Modified for qTranslate-KQ on 2026-09-15. See MODIFICATIONS.md for details and attribution. */
/**
 * Shared core functionalities and setup
 */
'use strict';

import './qtranslatekq';

const qTranslateConfig = window.qTranslateConfig;

const get_page_config_keys = () => {
    const pageConfig = qTranslateConfig['page_config'] || {};
    const configKeys = pageConfig['keys'] || [];
    return configKeys;
};

const $ = jQuery;

// With jQuery3 ready handlers fire asynchronously and may be fired after load.
// See: https://github.com/jquery/jquery/issues/3194
$(window).on('load', function () {
    // qtkq may already be initialized (see 'wp_tiny_mce_init' for the Classic Editor)
    const qtkq = qTranslateConfig.js.get_qtkq();
    // Setup hooks for additional TinyMCE editors initialized dynamically
    qtkq.loadAdditionalTinyMceHooks();

    const configKeys = get_page_config_keys();
    configKeys.forEach(key => {
        $(document).trigger('qtkqLoadAdmin:' + key, [qtkq]);
    });
});

export * from './dom';
export * from './qblocks';
