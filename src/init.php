<?php

/*
 * Modified for qTranslate-KQ; latest changes 2026-09-25.
 * See MODIFICATIONS.md for the modification history and original-project attribution.
 */
if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

require_once QTRANSLATE_DIR . '/src/class_translator.php';
require_once QTRANSLATE_DIR . '/src/deprecated.php';
require_once QTRANSLATE_DIR . '/src/language_blocks.php';
require_once QTRANSLATE_DIR . '/src/language_config.php';
require_once QTRANSLATE_DIR . '/src/language_detect.php';
require_once QTRANSLATE_DIR . '/src/options.php';
require_once QTRANSLATE_DIR . '/src/url.php';
require_once QTRANSLATE_DIR . '/src/utils.php';
require_once QTRANSLATE_DIR . '/src/taxonomy.php';
require_once QTRANSLATE_DIR . '/src/modules/module_loader.php';

/**
 * Backward-compatible entry point.
 *
 * @return void
 */
function qtranxf_init_language(): void {
    qtranxf_init_language_late();
}

/**
 * Load qTranslate-KQ configuration as early as possible, without running
 * language-dependent front/admin setup before WordPress init.
 *
 * @return void
 */
function qtranxf_init_language_early(): void {
    qtranxf_load_config();
}

/**
 * Defer canonical language redirects until template_redirect.
 *
 * @return void
 */
function qtranxf_template_redirect(): void {
    global $q_config;

    if ( empty( $q_config['url_info'] ) ) {
        return;
    }

    $url_info = &$q_config['url_info'];

    if ( ! empty( $url_info['doing_front_end'] ) && qtranxf_can_redirect() ) {
        qtranxf_check_url_maybe_redirect( $url_info );
    }
}
add_action( 'template_redirect', 'qtranxf_template_redirect', 0 );

/**
 * Complete language detection and load language-dependent runtime on init.
 *
 * The early/late split keeps configuration available from plugins_loaded while
 * postponing the heavier front/admin setup until WordPress initialization.
 *
 * @return void
 */
function qtranxf_init_language_late(): void {
    global $q_config, $pagenow;

    // Safety fallback for direct/backward-compatible calls.
    if ( empty( $q_config ) ) {
        qtranxf_load_config();
    }

    // 'url_info' hash is not for external use, it is subject to change at any time.
    // 'url_info' is preserved on reloadConfig.
    if ( ! isset( $q_config['url_info'] ) ) {
        $q_config['url_info'] = array();
    }

    $url_info = &$q_config['url_info'];

    // TODO clarify url_info fields that are exposed in API.
    if ( ! $q_config['disable_client_cookies'] && isset( $_COOKIE[ QTKQ_COOKIE_NAME_FRONT ] ) ) {
        $url_info['cookie_lang_front'] = $_COOKIE[ QTKQ_COOKIE_NAME_FRONT ];
    }
    if ( isset( $_COOKIE[ QTKQ_COOKIE_NAME_ADMIN ] ) ) {
        $url_info['cookie_lang_admin'] = $_COOKIE[ QTKQ_COOKIE_NAME_ADMIN ];
    }

    // TODO this field should be removed, to be avoided as much as possible.
    $url_info['cookie_front_or_admin_found'] =
        isset( $url_info['cookie_lang_front'] ) ||
        isset( $url_info['cookie_lang_admin'] );

    if ( WP_DEBUG ) {
        $url_info['pagenow']        = $pagenow;
        $url_info['REQUEST_METHOD'] = $_SERVER['REQUEST_METHOD'] ?? '';
        if ( is_admin() ) {
            $url_info['WP_ADMIN'] = true;
        }
        if ( wp_doing_ajax() ) {
            $url_info['WP_DOING_AJAX_POST'] = $_POST;
        }
        if ( wp_doing_cron() ) {
            $url_info['WP_DOING_CRON_POST'] = $_POST;
        }
    }

    // Fill url_info similarly to qtranxf_parseURL.
    $url_info['scheme'] = is_ssl() ? 'https' : 'http';
    // See https://wordpress.org/support/topic/messy-wp-cronphp-command-line-output
    $url_info['host'] = $_SERVER['HTTP_HOST'] ?? '';
    $url_info['path'] = strtok( $_SERVER['REQUEST_URI'], '?' );

    if ( ! empty( $_SERVER['QUERY_STRING'] ) ) {
        $url_info['query'] = qtranxf_sanitize_url( $_SERVER['QUERY_STRING'] ); // prevent XSS

        if ( isset( $_GET['qtranslate-mode'] ) && $_GET['qtranslate-mode'] == 'raw' ) {
            $url_info['qtranslate-mode']      = 'raw';
            $url_info['doing_front_end']      = true;
            $q_config['url_info']             = $url_info;
            $q_config['url_info']['language'] = $q_config['default_language'];
            $q_config['language']             = $q_config['default_language'];

            return;
        }
    }

    $url_info['language'] = qtranxf_detect_language( $url_info );
    $q_config['language'] = apply_filters( 'qtranslate_language', $url_info['language'], $url_info );

    // Canonical redirects are intentionally handled later on template_redirect.
    // At this stage we only record cases where redirects are impossible.
    if ( isset( $url_info['doredirect'] ) && ! qtranxf_can_redirect() ) {
        $url_info['doredirect'] .= ' - cancelled by can_redirect';
    }

    require_once QTRANSLATE_DIR . '/src/rest_api.php';
    add_action( 'init', 'qtranxf_rest_api_register_rewrites', 11 );

    require_once QTRANSLATE_DIR . '/src/widget.php';
    add_action( 'widgets_init', 'qtranxf_widget_init' );

    require_once QTRANSLATE_DIR . '/src/hooks.php'; // Common hooks need language already detected.
    qtranxf_add_main_filters();

    require_once QTRANSLATE_DIR . '/src/date_time.php';
    qtranxf_add_date_time_filters();

    // See https://developer.wordpress.org/reference/functions/load_plugin_textdomain/
    add_action( 'init', 'qtranxf_load_plugin_textdomain' );

    /**
     * Allow other plugins to initialize whatever they need before the fork between front and admin.
     */
    do_action( 'qtranslate_load_front_admin', $url_info );

    if ( $q_config['url_info']['doing_front_end'] ) {
        require_once QTRANSLATE_DIR . '/src/frontend.php';
        qtranxf_add_front_filters();
    } else {
        require_once QTRANSLATE_DIR . '/src/admin/admin.php';
        qtranxf_admin_load();
    }

    QTKQ_Translator::get_translator();
    apply_filters_deprecated(
        'wp_translator',
        array( null ),
        '3.14.0',
        '',
        'This filter will be removed in a future major release. Open a ticket on https://github.com/KayronQuantor/qtranslate-kq/issues if you need this.'
    );

    QTKQ_Module_Loader::load_active_modules();

    qtranxf_load_option_qtrans_compatibility();

    /**
     * Allow other plugins and modules to initialize whatever they need for language.
     */
    do_action( 'qtranslate_init_language', $url_info );
}
