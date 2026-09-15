<?php

/*
 * Modified for qTranslate-KQ on 2026-09-15.
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
 * Main initialization of qTranslate-KQ for language detection and plugin loading.
 *
 * Redirect to a canonical URL if it doesn't match the detected language.
 * @see https://github.com/qtranslate/qtranslate-xt/wiki/Browser-redirection
 * Load configuration, common hooks, detect and load front/admin configuration, load modules.
 *
 * @return void
 */


function qtranxf_init_language(): void {
    // backward compatibility only
    qtranxf_init_language_late();
}

add_action( 'template_redirect', 'qtranxf_template_redirect', 0 );

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

// ==============================
// Lifecycle split
// ==============================

function qtranxf_init_language_early(): void {
    // config only — nothing more
    qtranxf_load_config();
}

function qtranxf_init_language_late(): void {
    global $q_config, $pagenow;

    // protection (if someone executes with no early)
    if ( empty( $q_config ) ) {
        qtranxf_load_config();
    }

    // --- COPY from qtranxf_init_language(), but WITHOUT load_config ---

    if ( ! isset( $q_config['url_info'] ) ) {
        $q_config['url_info'] = array();
    }

    $url_info = &$q_config['url_info'];

    if ( ! $q_config['disable_client_cookies'] && isset( $_COOKIE[ QTKQ_COOKIE_NAME_FRONT ] ) ) {
        $url_info['cookie_lang_front'] = $_COOKIE[ QTKQ_COOKIE_NAME_FRONT ];
    }
    if ( isset( $_COOKIE[ QTKQ_COOKIE_NAME_ADMIN ] ) ) {
        $url_info['cookie_lang_admin'] = $_COOKIE[ QTKQ_COOKIE_NAME_ADMIN ];
    }

    $url_info['cookie_front_or_admin_found'] =
        isset ( $url_info['cookie_lang_front'] ) ||
        isset( $url_info['cookie_lang_admin'] );

    $url_info['scheme'] = is_ssl() ? 'https' : 'http';
    $url_info['host']   = $_SERVER['HTTP_HOST'] ?? '';
    $url_info['path']   = strtok( $_SERVER['REQUEST_URI'], '?' );

    if ( ! empty ( $_SERVER['QUERY_STRING'] ) ) {
        $url_info['query'] = qtranxf_sanitize_url( $_SERVER['QUERY_STRING'] );
    }

    // ?? Language detection — in corrent moment (!!!)
    $url_info['language'] = qtranxf_detect_language( $url_info );

    $q_config['language'] = apply_filters(
        'qtranslate_language',
        $url_info['language'],
        $url_info
    );

    // REST
    require_once QTRANSLATE_DIR . '/src/rest_api.php';
    add_action( 'init', 'qtranxf_rest_api_register_rewrites', 11 );

    // widget
    require_once QTRANSLATE_DIR . '/src/widget.php';
    add_action( 'widgets_init', 'qtranxf_widget_init' );

    // HOOKS
    require_once QTRANSLATE_DIR . '/src/hooks.php';
    qtranxf_add_main_filters();

    // GETTEXT
    add_action( 'init', 'qtranxf_add_gettext_filters', 20 );

    // date/time
    require_once QTRANSLATE_DIR . '/src/date_time.php';
    qtranxf_add_date_time_filters();

    // textdomain
    add_action( 'init', 'qtranxf_load_plugin_textdomain' );


	do_action( 'qtranslate_load_front_admin', $url_info );

	if ( $q_config['url_info']['doing_front_end'] ) {

		require_once QTRANSLATE_DIR . '/src/frontend.php';
		qtranxf_add_front_filters();

	} else {

		global $pagenow;

/*
	// WY£¥CZANIE ADMINA qTRANSLATE NA PEWNYCH STRONACH (zostawiany tylko tam, gdzie potrzebny)
			$allowed_admin_pages = array(
			'post.php',
			'post-new.php',
			'widgets.php',
			'nav-menus.php',
			'options-general.php'
		);

		if (in_array($pagenow, $allowed_admin_pages)) {
			require_once QTRANSLATE_DIR . '/src/admin/admin.php';
			qtranxf_admin_load();
		}
*/

//	Alternatywa dla powy¿szego (dzia³a wszêdzie)
//	/*
    require_once QTRANSLATE_DIR . '/src/admin/admin.php';
    qtranxf_admin_load();
//	*/

	}

    QTKQ_Translator::get_translator();

    QTKQ_Module_Loader::load_active_modules();

    qtranxf_load_option_qtrans_compatibility();

    do_action( 'qtranslate_init_language', $url_info );
}


// ==============================
// Cache Invalidation
// ==============================

add_action( 'save_post', 'qtranxf_flush_translations_cache' );

function qtranxf_flush_translations_cache(): void {
    global $wpdb;

    // Removing only our transients
    $wpdb->query(
        "DELETE FROM {$wpdb->options}
         WHERE option_name LIKE '_transient_qtkq_%'
         OR option_name LIKE '_transient_timeout_qtkq_%'"
    );
}
