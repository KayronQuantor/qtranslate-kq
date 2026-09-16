# Changelog

<!-- Modified for qTranslate-KQ; latest changes 2026-09-16. See MODIFICATIONS.md for details and attribution. -->

## 4.1.2 - 2026-09-16
- removed a legacy site-specific PL/EN language-priority override that could cause canonical redirect loops on installations using other language codes
- restored qTranslate-XT-compatible plugin initialization timing and activation/deactivation hook registration
- removed WP-Optimize-specific runtime overrides and duplicate manual `?lang=` cookie handling
- removed hardcoded qTranslate-KQ CSS-path handling from URL conversion
- removed persistent transient translation-result caching and its direct SQL invalidation routine; retained only the lightweight in-request multilingual block parser cache
- removed post-object translation caching and broad REST/AJAX / pre-`wp` translation bypasses that could change translated output
- restored the standard `the_content`, gettext and front-end option-filtering behavior
- clarified the qTranslate-XT → qTranslate-KQ migration procedure and warning against deleting qTranslate-XT through wp-admin

## 4.1.1 - 2026-09-15
- publication metadata: aligned npm package metadata to 4.1.1 and canonical `GPL-2.0-or-later` SPDX form
- distribution: added `.po` source companions for the five modified compiled translation catalogs
- project links: generic active bug-report links now point to the qTranslate-KQ repository while historical upstream issue/wiki references are preserved
- release status: documented 4.1.1 as a testing release for legacy installations pending broader Gutenberg / Block Widgets validation
- improved compatibility with current WordPress admin screens by replacing legacy DOM mutation events with `MutationObserver` and legacy jQuery `bind`/`unbind` calls with `on`/`off`
- declared explicit JavaScript dependencies for qTranslate-KQ admin and block-editor bundles
- removed unconditional widget-save debug logging and hardened request-derived post-type sanitization
- replaced deprecated `FILTER_SANITIZE_STRING` usage in the dormant ACF helper with WordPress sanitization APIs
- fixed initialization of the visible title field in WordPress Custom HTML widgets so the multilingual UI marker is present immediately after opening a widget, before the first language switch

## 4.1.0 - 2026-09-15
- standardized current internal namespace from QKQ/qkq to QTKQ/qtkq and renamed active qTranslateX/qtranslatex source identifiers to qTranslateKQ/qtranslatekq (no functional changes)
- fixed multilingual title editing for WordPress Custom HTML widgets by synchronizing the visible title field with qTranslate-KQ's translated sync field when switching languages

## 4.0.0 - 2026-09-15
- bootstrap refactor (plugins_loaded → init split)
- added transient caching layer for translation results
- reduced gettext overhead
- REST/AJAX execution isolation
- improved PHP 8 compatibility
- internal code cleanup and safety improvements
- renamed plugin-specific qTranslate-XT/QTX/qtx identifiers, slugs and asset filenames to qTranslate-KQ/QKQ/qkq equivalents (no functional changes)
