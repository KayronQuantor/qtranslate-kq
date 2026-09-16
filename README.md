# qTranslate-KQ (v4.1.2)

<!-- Modified for qTranslate-KQ; latest changes 2026-09-16. See MODIFICATIONS.md for details and attribution. -->

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

## 🔧 Maintenance approach in 4.1.2

Version 4.1.2 deliberately returns several aggressive 4.0 runtime optimizations to qTranslate-XT-compatible behavior where they could alter language detection, request handling or translated output.

It keeps the qTranslate-KQ namespace separation, current WordPress compatibility work, the multilingual Classic Widgets / Custom HTML fixes, and the lightweight in-request cache for parsed multilingual blocks.

The priority is compatibility and predictable behavior on existing qTranslate installations rather than speculative performance optimization.

Version 4.1.2 deliberately returns several aggressive 4.0 runtime optimizations to qTranslate-XT-compatible behavior where they could alter language detection, request handling or translated output.

It keeps the qTranslate-KQ namespace separation, current WordPress compatibility work, the multilingual Classic Widgets / Custom HTML fixes, and the lightweight in-request cache for parsed multilingual blocks.

The priority is compatibility and predictable behavior on existing qTranslate installations rather than speculative performance optimization.

---

## ✅ Requirements

- WordPress: **5.0+** (it seems to work on 7.1)
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

- Works with existing qTranslate multilingual format: [:en]English[:pl]Polski[:]

- Does NOT convert content to other multilingual plugins

---

## ❗ Limitations

- qTranslate-KQ currently **forces the Classic Widgets interface**. Block Widgets / Site Editor support is not yet implemented and tested.
- **Classic Editor is the currently tested editing environment.** Gutenberg / Block Editor is not part of the current production workflow and has not yet been fully validated.
- Still relies on the legacy qTranslate multilingual content encoding format.
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

- [ ] Test and improve Gutenberg / Block Editor compatibility.
- [ ] Add and test Block Widgets / Site Editor support.
- [ ] Remove the forced Classic Widgets mode once Block Widgets support is ready.
- [ ] Extend testing across current WordPress, PHP, themes and third-party plugins.

For now, qTranslate-KQ intentionally uses Classic Widgets, and Classic Editor is the tested editing environment.

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

**Testing release for legacy usage.**

The Classic Editor + Classic Widgets workflow has been tested in production-like use. Gutenberg / Block Editor and Block Widgets / Site Editor support has not yet been fully validated. Test on a staging copy first and keep a current backup before deployment.

---

## 💬 Final Note

This is a **maintenance-focused fork**, not a reinvention.

Its goal is simple:
> Keep legacy multilingual sites running safely and compatibly on current WordPress/PHP versions.

Support for the Block Editor, Block Widgets, and Site Editor will be added as time permits; however, due to a lack of available time, progress will be slow.

---

.: **To the qTranslate-XT team** :.

If you wish to use my work to develop your fork, please feel free to do so!
