<?php

/*
 * Modified for qTranslate-KQ; latest changes 2026-09-16.
 * See MODIFICATIONS.md for the modification history and original-project attribution.
 */
/**
 * Plugin Name: qTranslate-KQ
 * Plugin URI: https://github.com/KayronQuantor/qtranslate-kq
 * Description: Maintained fork of qTranslate-XT for legacy multilingual sites using the qTranslate content format.
 * Version: 4.1.2
 * Requires at least: 5.0
 * Requires PHP: 7.4
 * Tested up to: 6.5
 * Author: qTranslate Community + Contributors
 * Author URI: https://github.com/qtranslate/
 * Tags: multilingual, translation, qtranslate, legacy
 * Text Domain: qtranslate
 * Domain Path: /lang/
 * License: GPLv2 or later
 * License URI: https://www.gnu.org/licenses/gpl-2.0.txt
 * Original Author: John Clause and Qian Qin (https://www.qianqin.de mail@qianqin.de)
 *
 * Fork notice:
 * This version contains maintenance, compatibility and multilingual widget fixes
 * beyond the original qTranslate-XT project.
 * qTranslate-KQ fork modifications are explicitly documented as of 2026-09-15.
 * See MODIFICATIONS.md for dated modification notices and the affected-file list.
 */
/*
	Copyright 2019-2023 qTranslate Community

	The statement below within this comment block is relevant to
	this file as well as to all files in this folder and to all files
	in all sub-folders of this folder recursively.

	This program is free software; you can redistribute it and/or modify
	it under the terms of the GNU General Public License as published by
	the Free Software Foundation; either version 2 of the License, or
	(at your option) any later version.

	This program is distributed in the hope that it will be useful,
	but WITHOUT ANY WARRANTY; without even the implied warranty of
	MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.See the
	GNU General Public License for more details.

	You should have received a copy of the GNU General Public License
	along with this program; if not, write to the Free Software
	Foundation, Inc., 51 Franklin St, Fifth Floor, Boston, MA 02110-1301 USA
*/
/*
 * Search for 'Designed as interface for other plugin integration' in comments to functions
 * to find out which functions are safe to use in the 3rd-party integration.
 * Avoid accessing internal variables directly, as they are subject to be re-designed at any time.
*/

/*
	Plugin has been updateg and adapted for WordPress 6.x and PHP 8 in Marth 2026.
*/

if ( ! function_exists( 'add_filter' ) ) {
    header( 'Status: 403 Forbidden' );
    header( 'HTTP/1.1 403 Forbidden' );
    exit();
}
/**
 * The constants defined below are designed as interface for other plugin integration.
 * @see https://github.com/qtranslate/qtranslate-xt/wiki/Integration-Guide/
 */
const QTKQ_VERSION = '4.1.2';

if ( ! defined( 'QTRANSLATE_FILE' ) ) {
    define( 'QTRANSLATE_FILE', __FILE__ );
    define( 'QTRANSLATE_DIR', __DIR__ );
}

require_once QTRANSLATE_DIR . '/src/init.php';
add_action( 'plugins_loaded', 'qtranxf_init_language', 2 ); // User is not authenticated yet, high priority needed.

if ( is_admin() || defined( 'WP_CLI' ) ) {
    require_once QTRANSLATE_DIR . '/src/admin/activation_hook.php';
    qtranxf_register_activation_hooks();
}
