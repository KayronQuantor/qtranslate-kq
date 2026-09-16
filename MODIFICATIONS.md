# qTranslate-KQ — Modification Notice

This distribution is a modified fork of **qTranslate-XT**, licensed under the **GNU General Public License, version 2 or later (GPL-2.0-or-later)**. The original copyright, author and license notices are preserved.

## Dated modification notice

The qTranslate-KQ changes represented by this distribution were applied/documented on **2026-09-15**, with the latest maintenance changes applied on **2026-09-16**. The fork changes include renaming and namespacing, compatibility/refactoring work, WordPress compatibility maintenance, and fixes to multilingual handling of classic WordPress widgets.

The supplied comparison base for this notice is the customized `qtranslate-xt_FIX5` source tree from which qTranslate-KQ was derived. This file documents the qTranslate-KQ fork changes relative to that supplied base; it does not attempt to reconstruct modification dates for changes that already existed in that base before the qTranslate-KQ rename.

## License and attribution

- License: GPL-2.0-or-later (see `license.txt`).
- Original project: qTranslate-XT / qTranslate Community.
- Original author information remains in `qtranslate.php` and the existing project documentation.
- Historical qTranslate-X / qTranslate-XT references that identify prior projects, contributors, integrations or real upstream URLs are intentionally retained.


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
- `js/core/index.js`
- `js/core/qtranslatekq.js`
- `js/core/store.js`
- `js/main.js`
- `js/options.js`
- `js/pages/edit-tags.js`
- `js/pages/nav-menus.js`
- `js/pages/post.js`
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

Source/text files that support comments safely carry an inline qTranslate-KQ modification notice and refer to this document. Files changed again for 4.1.2 identify **2026-09-16** as their latest change date.

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
