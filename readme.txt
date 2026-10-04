# qTranslate-KQ (v4.1.3)

<!-- Modified for qTranslate-KQ; latest changes 2026-10-04. See MODIFICATIONS.md for details and attribution. -->

Maintenance-focused fork of the classic **qTranslate-XT** plugin.

This fork is designed primarily for **legacy WordPress sites** that still rely on the qTranslate multilingual content format and have not migrated to modern alternatives.

---

## ⚠️ Important Context

This plugin is **not a modern multilingual solution**.

It is intended for:

- existing sites using qTranslate / qTranslate-X / qTranslate-XT
- projects where migration is not feasible (cost, risk, complexity)
- maintaining and stabilizing legacy multilingual content

---

## 🔧 Changes in 4.1.3

Version 4.1.3 builds on the 4.1.2 maintenance baseline. It restores selected runtime behavior required for correct language persistence and adds targeted compatibility for the WordPress Block Widgets screen.

The restored front-end language priority is configuration-driven rather than hard-coded to particular languages: explicit request language → remembered client cookie → browser language (when enabled) → configured default language. An explicit `?lang=` choice is persisted, while neutral requests do not overwrite the user's remembered manual selection.

Version 4.1.3 does **not** reintroduce the persistent translation-result transients, direct SQL cache invalidation, WP-Optimize-specific runtime overrides, hard-coded plugin asset URLs, post-object translation caching, or broad REST/AJAX translation bypasses removed in 4.1.2.

For Block Widgets, 4.1.3 adds:

- **Legacy Widget previews** (language-aware rendering of WordPress-generated Legacy previews): canonical stored widget values remain unchanged while the displayed preview follows the selected qTranslate edit language, removes qTranslate markers, strips verified preview-only reCAPTCHA scripts, and can switch cached complete preview documents without a new Legacy REST render.
- **Custom HTML / CodeMirror patch** (workaround for a known WordPress/Gutenberg blank-until-click Legacy Widget bug): when WordPress initializes a Custom HTML editor while its form is hidden, qTranslate-KQ refreshes and synchronizes that editor when revealed without rewriting its content or dirtying the widget area. Upstream issue: https://github.com/WordPress/gutenberg/issues/33479
- **Lazy Legacy Widget hydration / performance patch** (workaround for a known WordPress/Gutenberg Legacy Widget performance cost): collapsed widget areas stay lightweight and each Legacy Widget is loaded only when its containing area is expanded, using one real `/encode` and reusing that response for the first preview instead of issuing a separate initial `/render`. WordPress/Gutenberg context: https://github.com/WordPress/gutenberg/discussions/35159
- **Selected native RichText support** for explicitly enumerated block attributes in the Block Widgets editor.

The Custom HTML / CodeMirror and Legacy Widget performance patches address upstream WordPress/Gutenberg behavior; they are **not** fixes for regressions introduced by qTranslate-KQ 4.1.2.

---

## ✅ Requirements

- WordPress: **5.0+**
- PHP: **7.4+** (recommended 8.0+)

---

## 🔄 Migration / Upgrade

If you are already using qTranslate-XT:

1. Extract the `qtranslate-kq` folder into your WordPress plugins directory (`wp-content/plugins/`).
2. Log in to the WordPress administration panel and go to **Plugins**.
3. Deactivate **qTranslate-XT**.
4. Activate **qTranslate-KQ**.
5. Remove the qTranslate-XT plugin directory manually from the server, for example via FTP, SSH, or your hosting file manager.

> **Important:** Do not use the **Delete** option for qTranslate-XT in the WordPress administration panel. Its uninstall routine may remove qTranslate settings and data that are also used by qTranslate-KQ.

No content or database migration is required.

---

## ⚠️ Compatibility Notes

- Works with the existing qTranslate multilingual format: `[:en]English[:pl]Polski[:]`.
- Does **not** convert content to other multilingual plugins.
- qTranslate-KQ does not force Classic Widgets or Block Widgets; it follows WordPress's resulting widgets-editor choice, including site/plugin filters.
- The Block Widgets compatibility layer is scoped to `wp-admin/widgets.php`. Legacy Widget multilingual editing/preview behavior, lazy per-widget-area hydration, and selected native RichText attributes are supported; native/new block widgets are not modified by the Legacy Widget performance patch.
- Genuine Legacy Widget edits continue through WordPress's native real `/encode` → `/render` path.
- The Legacy Widget performance patch does not add global REST throttling and does not change frontend widget output.

---

## ❗ Limitations

- **Classic Editor remains the primary production-tested post editor.** The Block Widgets work does not imply blanket Gutenberg post-editor compatibility.
- Site Editor / Full Site Editing compatibility is not implied by the tested `widgets.php` work.
- qTranslate-KQ still relies on the legacy qTranslate multilingual content encoding format.
- Intended primarily for maintaining existing qTranslate-based sites rather than new projects.

---

## 📌 When to Use This

Use this plugin if:

- you maintain a legacy site using qTranslate
- migration to WPML / Polylang / etc. is not viable
- performance or PHP compatibility became an issue

---

## ❌ When NOT to Use

Do NOT use this plugin if:

- you are building a new website
- you plan long-term scalability
- you want modern multilingual architecture

---

## 🛠 Roadmap / TODO

- [ ] Continue broader Gutenberg / Block Editor compatibility testing beyond the explicitly supported Block Widgets RichText paths.
- [ ] Evaluate Site Editor / Full Site Editing separately.
- [ ] Extend testing across current WordPress, PHP, themes and third-party plugins.

---

## 📜 License

GPLv2 or later

Dated fork modification history: see `MODIFICATIONS.md`.

This project is a fork of:
https://github.com/qtranslate/qtranslate-xt

---

## 🙌 Credits

Original authors:
- John Clause
- Qian Qin
- qTranslate Community

qTranslate-KQ maintenance and compatibility work:
- Contributors (this fork)

---

## 🧪 Status

**Maintenance release for legacy usage.**

Version 4.1.3 retains the 4.1.2 maintenance removals while restoring the required language-persistence/runtime path and adding the scoped Block Widgets compatibility described above. In the 37-Legacy-widget validation fixture, the lazy-hydration path reduced the observed fresh-screen load from roughly 45 seconds to roughly 7.4 seconds when one three-widget area started open; this is an environment-specific validation measurement, not a universal performance guarantee. Broader Gutenberg post-editor and Site Editor / Full Site Editing compatibility are not declared complete. Test on a staging copy first and keep a current backup before deployment.

---

## 💬 Final Note

This is a **maintenance-focused fork**, not a reinvention.

Its goal is simple:
> Keep legacy multilingual sites running safely and compatibly on current WordPress/PHP versions.
