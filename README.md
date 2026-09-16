# qTranslate-KQ (v4.1.1)

<!-- Modified for qTranslate-KQ on 2026-09-15. See MODIFICATIONS.md for details and attribution. -->

Performance-refactored version of the classic **qTranslate-XT** plugin.

This fork is designed primarily for **legacy WordPress sites** that still rely on the qTranslate multilingual content format and have not migrated to modern alternatives.

---

## ⚠️ Important Context

This plugin is **not a modern multilingual solution**.

It is intended for:

- existing sites using qTranslate / qTranslate-X / qTranslate-XT
- projects where migration is not feasible (cost, risk, complexity)
- maintaining and stabilizing legacy multilingual content

---

## 🚀 Major Changes Introduced in 4.0

This version introduces **significant internal refactoring and performance improvements**:

### 🔧 Architecture
- bootstrap split (`plugins_loaded` → `init`)
- reduced early execution overhead
- better separation of runtime vs admin logic

### ⚡ Performance
- L1 (in-memory) + L2 (transient) caching layer
- reduced repeated parsing of multilingual blocks
- minimized unnecessary filters execution

### 🧠 Smarter Execution
- REST / AJAX isolation (no unnecessary translation processing)
- conditional gettext filtering
- optimized post/object translation flow

### 🛠 Compatibility
- improved PHP 7.4+ and PHP 8.x compatibility
- reduced deprecated behavior
- safer property handling

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
5. Remove the qTranslate-XT plugin directory manually from the server (`wp-content/plugins/qtranslate-xt`), for example via FTP, SSH, or your hosting file manager.
6. Clear cache (if any)

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

Refactor & performance improvements:
- Contributors (this fork)

---

## 🧪 Status

**Testing release for legacy usage.**

The Classic Editor + Classic Widgets workflow has been tested in production-like use. Gutenberg / Block Editor and Block Widgets / Site Editor support has not yet been fully validated. Test on a staging copy first and keep a current backup before deployment.

---

## 💬 Final Note

This is a **maintenance-focused fork**, not a reinvention.

Its goal is simple:
> Keep legacy multilingual sites running — faster, safer, and compatible with modern PHP.
