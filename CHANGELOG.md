# Changelog

<!-- Modified for qTranslate-KQ; latest changes 2026-10-05. See MODIFICATIONS.md for details and attribution. -->

## 4.1.3 - Unreleased
- fixed front-language persistence so neutral requests no longer overwrite an explicit user language choice in `qtrans_front_language`; the front cookie is written only for an explicit language selection
- restored qTranslate-KQ's two-stage bootstrap: configuration on `plugins_loaded`, language-dependent runtime on `init`, with canonical redirects deferred to `template_redirect`
- restored deterministic front-end language priority without hard-coded language codes: explicit request language → remembered client cookie → browser language (when enabled) → configured default
- restored explicit `?lang=` preference persistence through qTranslate-KQ's existing secure client-cookie writer while retaining the 4.1.2 maintenance removals
- added Block Widgets compatibility for multilingual Legacy Widgets and an explicit set of native RichText attributes; qTranslate-KQ no longer forces Classic Widgets or Block Widgets and instead follows WordPress's resulting widgets-editor choice
- improved Legacy Widget previews (language-aware rendering of WordPress-generated Legacy previews): preview HTML is projected to the current qTranslate edit language, qTranslate markers are removed from the displayed preview, preview-only reCAPTCHA scripts that cause irrelevant admin-preview errors are stripped, and complete per-language `srcdoc` documents are cached for live language switching without an extra REST render
- added a Custom HTML / CodeMirror compatibility patch (workaround for the known WordPress/Gutenberg blank-until-click Legacy Widget bug): a hidden-initialized Custom HTML editor is refreshed and synchronized when revealed without rewriting its content or dirtying the editor; upstream issue: https://github.com/WordPress/gutenberg/issues/33479
- added lazy hydration for Legacy Widgets (workaround for the known WordPress/Gutenberg Legacy Widget performance cost): collapsed widget areas remain lightweight, an opened area hydrates each Legacy Widget once with one real `/encode`, the first preview reuses that response instead of issuing a separate initial `/render`, and reopening an already hydrated area performs no additional hydration REST work
- fixed a Legacy preview navigation race by treating the iframe's current `srcdoc` token as authoritative while a new preview document is loading, preventing a stale cached placeholder from replacing a freshly installed real preview
- preserved WordPress's native real `/encode` → `/render` path for genuine Legacy Widget edits, including Custom HTML edits and normal dirty-state handling
- limited the Legacy performance patch to `core/legacy-widget` on `wp-admin/widgets.php`; native/new block widgets, unrelated REST traffic, and frontend widget output are not altered, and no global REST throttling is introduced
- verified the new Legacy Widget path on a 37-widget fixture: with one three-widget area initially open, the observed fresh-screen load fell from roughly 45 s to roughly 7.4 s with 3 real startup `/encode` calls and 0 startup `/render` calls; this is a validation measurement, not a universal performance guarantee
- the Custom HTML / CodeMirror and Legacy Widget performance patches address upstream WordPress/Gutenberg behavior; they are not fixes for regressions introduced by qTranslate-KQ 4.1.2

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
