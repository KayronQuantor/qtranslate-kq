# qTranslate-KQ — Modification Notice

This distribution is a modified fork of **qTranslate-XT**, licensed under the **GNU General Public License, version 2 or later (GPL-2.0-or-later)**. The original copyright, author and license notices are preserved.

## Dated modification notice

The qTranslate-KQ changes represented by this distribution were applied/documented beginning on **2026-09-15**, with the latest maintenance changes applied on **2026-10-05**. Version 4.1.3 remains unreleased at the time of this notice; its publication date will be recorded in the changelog when the release is published. The fork changes include renaming and namespacing, compatibility/refactoring work, WordPress compatibility maintenance, and fixes to multilingual handling of classic WordPress widgets.

The supplied comparison base for this notice is the customized `qtranslate-xt_FIX5` source tree from which qTranslate-KQ was derived. This file documents the qTranslate-KQ fork changes relative to that supplied base; it does not attempt to reconstruct modification dates for changes that already existed in that base before the qTranslate-KQ rename.

## License and attribution

- License: GPL-2.0-or-later (see `license.txt`).
- Original project: qTranslate-XT / qTranslate Community.
- Original author information remains in `qtranslate.php` and the existing project documentation.
- Historical qTranslate-X / qTranslate-XT references that identify prior projects, contributors, integrations or real upstream URLs are intentionally retained.

## 4.1.3 — Unreleased: controlled runtime and Block Widgets compatibility

Version 4.1.3 builds on the 4.1.2 maintenance baseline. It restores only the selected runtime behaviors that were required for correct language persistence and adds a targeted compatibility layer for the WordPress Block Widgets screen; it does not reintroduce the aggressive caching, request bypasses or site-specific runtime overrides removed in 4.1.2.

### Front-end language persistence and bootstrap

- restore the two-stage bootstrap: configuration on `plugins_loaded`, language-dependent runtime on `init`, and canonical redirects on `template_redirect`;
- restore deterministic front-end language priority: explicit request language → remembered client cookie → browser language (when enabled) → configured default;
- persist only an explicit `?lang=` user choice through qTranslate-KQ's existing secure client-cookie path, so neutral/background requests do not overwrite the remembered manual selection;
- keep the 4.1.2 removals of WP-Optimize-specific overrides, persistent translation-result transients, direct SQL invalidation, hard-coded plugin asset paths, post-object translation caching and broad REST/AJAX translation bypasses.

### Block Widgets compatibility

qTranslate-KQ adds an explicit Block Widgets compatibility path for multilingual Legacy Widgets and selected native RichText attributes. Native support is intentionally enumerated and currently covers `core/paragraph`, `core/heading`, `core/list-item`, `core/preformatted`, `core/verse`, `core/details`, `core/accordion-heading`, `core/file`, `core/pullquote`, `core/quote`, `core/image`, `core/video`, `core/audio`, `core/embed`, `core/gallery`, `core/table`, `core/code`, and `core/button`.

### Legacy Widget previews

Legacy Widget previews remain WordPress-generated preview documents, but qTranslate-KQ projects them to the currently selected qTranslate edit language before display while leaving canonical stored form values unchanged. The displayed preview is marker-free, verified preview-only Contact Form 7 / Google reCAPTCHA scripts are removed to avoid irrelevant admin-preview errors, and complete per-language `srcdoc` documents are cached so visible previews can switch language without a new Legacy REST render.

### Custom HTML / CodeMirror patch — upstream WordPress/Gutenberg defect

This patch addresses a documented WordPress/Gutenberg Legacy Widget bug, not a regression introduced by qTranslate-KQ. WordPress can initialize the Custom HTML CodeMirror editor while its Legacy Widget form is hidden, leaving a correct non-empty editor model with a blank viewport until the user clicks it; the upstream report is https://github.com/WordPress/gutenberg/issues/33479. qTranslate-KQ refreshes and synchronizes only the affected editor when revealed, without rewriting canonical content, generating a user-visible change, dirtying the widget area, or issuing unnecessary Legacy REST requests.

### Lazy Legacy Widget hydration / performance patch — upstream WordPress/Gutenberg cost

This patch likewise targets the WordPress/Gutenberg Legacy Widget compatibility path rather than a qTranslate-KQ 4.1.2 regression. WordPress/Gutenberg maintainers explicitly note the performance penalty of loading Legacy Widget assets in block editors (https://github.com/WordPress/gutenberg/discussions/35159). On `wp-admin/widgets.php`, existing `core/legacy-widget` blocks therefore bootstrap with lightweight placeholder form/preview responses; real hydration occurs only when the owning `core/widget-area` is expanded. Each still-lazy widget performs one real `/encode`, reuses that response's form and first preview, and avoids a separate initial `/render`. Collapsed areas stay lazy, and reopening an already hydrated area performs no second hydration batch.

The first preview is installed only after the returned forms and any required hidden Custom HTML editor state are ready. During a new `iframe.srcdoc` navigation, qTranslate-KQ treats the current `srcdoc` token as authoritative and uses `contentDocument` only as a fallback, preventing the previous preview document from restoring a stale placeholder over a newly installed real preview. Genuine user edits continue through WordPress's native real `/encode` → `/render` path.

The performance patch is deliberately limited to `core/legacy-widget` on `widgets.php`. It does not modify native/new block widgets, unrelated REST traffic or frontend Legacy Widget output, and it does not introduce global REST throttling.

### Widgets editor mode

The obsolete fork-level filters that forced `gutenberg_use_widgets_block_editor` and `use_widgets_block_editor` to `false` are removed. qTranslate-KQ no longer chooses Classic Widgets or Block Widgets for the site; it follows WordPress's resulting widgets-editor decision, including any external site/plugin policy.

### Validation scope

In the 37-Legacy-widget validation fixture, the previous native initial lifecycle produced one Legacy `/encode` plus one `/render` per widget and an observed end-to-end load of roughly 45 seconds. With the 4.1.3 lazy path and one three-widget area initially open, the measured fresh-screen load was roughly 7.4 seconds with 3 real startup `/encode` calls and 0 startup `/render` calls. This is a fixture measurement rather than a universal performance guarantee.

The compatibility patches above address WordPress/Gutenberg Legacy Widget behavior and known upstream defects/limitations; they are not fixes for regressions introduced by qTranslate-KQ 4.1.2.

## 2026-09-16 — 4.1.2 maintenance changes

Version 4.1.2 removes legacy site-specific and aggressive runtime customizations inherited from the supplied `qtranslate-xt_FIX5` base where they could change language detection, redirects, request handling or translated output. It restores qTranslate-XT 3.15.3-compatible behavior for bootstrap timing, activation/deactivation hook registration, URL conversion, standard front-end translation filters and request handling while retaining qTranslate-KQ namespace separation and the tested Classic Widgets / Custom HTML fixes.

Files changed for this maintenance release include `qtranslate.php`, `src/init.php`, `src/hooks.php`, `src/frontend.php`, `src/language_blocks.php`, `src/language_detect.php`, `src/url.php`, `src/utils.php`, release documentation and package metadata.

## Files modified or renamed in qTranslate-KQ relative to the supplied qTranslate-XT base

- `.github/ISSUE_TEMPLATE/bug_report.md`
- `.github/ISSUE_TEMPLATE/feature_request.md`
- `CHANGELOG.md`
- `README.md`
- `changelog-qtranslate-kq.md`
- `composer.json`
- `dist/block-editor.js`
- `dist/main.js`
- `dist/modules/acf.js`
- `dist/options.js`
- `i18n-config.json`
- `i18n-config/plugins/imaginem-builder-r2/i18n-config.json`
- `i18n-config/plugins/imaginem-builder-r2/qtkq-admin.js`
- `i18n-config/plugins/imaginem-builder-r2/qtkq-admin.min.js`
- `i18n-config/themes/ta-pluton/i18n-config.json`
- `i18n-config/themes/ta-pluton/qtkq-admin.js`
- `js/acf/index.js`
- `js/acf/qtranslatekq.js`
- `js/acf/switch.js`
- `js/block-editor.js`
- `js/block-widgets/legacy-widget-lazy.js`
- `js/block-widgets/native-blocks.js`
- `js/block-widgets/native-rich-text.js`
- `js/core/index.js`
- `js/core/qtranslatekq.js`
- `js/core/store.js`
- `js/main.js`
- `js/options.js`
- `js/pages/edit-tags.js`
- `js/pages/nav-menus.js`
- `js/pages/post.js`
- `js/pages/widget-environment.js`
- `js/pages/widgets.js`
- `lang/qtranslate-fr_FR.mo`
- `lang/qtranslate-hu_HU.mo`
- `lang/qtranslate-it_IT.mo`
- `lang/qtranslate-nl_NL_formal.mo`
- `lang/qtranslate-zh_CN.mo`
- `lang/qtranslate-fr_FR.po`
- `lang/qtranslate-hu_HU.po`
- `lang/qtranslate-it_IT.po`
- `lang/qtranslate-nl_NL_formal.po`
- `lang/qtranslate-zh_CN.po`
- `package-lock.json`
- `package.json`
- `qtranslate.php`
- `readme.txt`
- `src/admin/activation_hook.php`
- `src/admin/admin.php`
- `src/admin/admin_options.php`
- `src/admin/admin_options_update.php`
- `src/admin/admin_settings.php`
- `src/admin/admin_settings_language_list.php`
- `src/admin/admin_utils.php`
- `src/admin/admin_utils_db.php`
- `src/admin/block_editor.php`
- `src/admin/import_export.php`
- `src/admin/user_options.php`
- `src/class_translator.php`
- `src/date_time.php`
- `src/deprecated.php`
- `src/frontend.php`
- `src/hooks.php`
- `src/init.php`
- `src/language_blocks.php`
- `src/language_config.php`
- `src/language_detect.php`
- `src/modules/README.md`
- `src/modules/acf/README.md`
- `src/modules/acf/admin.php`
- `src/modules/acf/extended.php`
- `src/modules/acf/fields/file.php`
- `src/modules/acf/fields/image.php`
- `src/modules/acf/fields/post_object.php`
- `src/modules/acf/fields/text.php`
- `src/modules/acf/fields/textarea.php`
- `src/modules/acf/fields/url.php`
- `src/modules/acf/fields/wysiwyg.php`
- `src/modules/acf/loader.php`
- `src/modules/admin_module.php`
- `src/modules/admin_module_manager.php`
- `src/modules/admin_module_settings.php`
- `src/modules/events-made-easy/README.md`
- `src/modules/gravity-forms/loader.php`
- `src/modules/jetpack/loader.php`
- `src/modules/module_loader.php`
- `src/modules/module_state.php`
- `src/modules/slugs/README.md`
- `src/modules/slugs/admin.php`
- `src/modules/slugs/admin_migrate_qts.php`
- `src/modules/slugs/admin_settings.php`
- `src/modules/slugs/loader.php`
- `src/modules/slugs/slugs.php`
- `src/modules/woo-commerce/admin.php`
- `src/modules/woo-commerce/loader.php`
- `src/options.php`
- `src/rest_api.php`
- `src/translator_interface.php`
- `src/url.php`
- `src/utils.php`
- `src/widget.php`
- `webpack.config.js`

## Files renamed by the qTranslate-KQ fork

- `changelog-qtranslate-x.md` → `changelog-qtranslate-kq.md`
- `i18n-config/plugins/imaginem-builder-r2/qtx-admin.js` → `i18n-config/plugins/imaginem-builder-r2/qtkq-admin.js`
- `i18n-config/plugins/imaginem-builder-r2/qtx-admin.min.js` → `i18n-config/plugins/imaginem-builder-r2/qtkq-admin.min.js`
- `i18n-config/themes/ta-pluton/qtx-admin.js` → `i18n-config/themes/ta-pluton/qtkq-admin.js`
- `js/acf/qtranslatex.js` → `js/acf/qtranslatekq.js`
- `js/core/qtranslatex.js` → `js/core/qtranslatekq.js`


## Obsolete backup/build artifacts removed from the distribution

- `dist/main.js_OLD1`
- `js/core/qtranslatex.js_BAK`
- `js/pages/widgets.js_ORIG`


## Generated source companions for modified translation catalogs

The five modified GNU MO catalogs listed above now have corresponding `.po` source companions in `lang/`.
The `.po` files were reconstructed from the distributed `.mo` catalogs on **2026-09-15**, preserving the compiled message IDs, translations and catalog header metadata. Translator comments and source references that are not stored in MO binaries cannot be reconstructed and are explicitly noted in each generated `.po` file.

## Inline-notice policy

Source/text files that support comments safely carry an inline qTranslate-KQ modification notice identifying the latest date on which that file was modified by the fork and referring to this document. The dated notices in this file record the release-level modification history; individual source comments are not intended to duplicate the full per-release changelog.

The following changed machine-readable or binary files are deliberately **not** given inline comments because doing so would invalidate the file format or risk changing runtime behavior. Their dated modification notice is recorded here by exact path instead:

For the modified `.mo` catalogs, corresponding `.po` source companions are included in `lang/`.

- `composer.json`
- `i18n-config.json`
- `i18n-config/plugins/imaginem-builder-r2/i18n-config.json`
- `i18n-config/themes/ta-pluton/i18n-config.json`
- `lang/qtranslate-fr_FR.mo`
- `lang/qtranslate-hu_HU.mo`
- `lang/qtranslate-it_IT.mo`
- `lang/qtranslate-nl_NL_formal.mo`
- `lang/qtranslate-zh_CN.mo`
- `package-lock.json`
- `package.json`

This notice supplements, and does not replace, the original GPL and attribution notices.
