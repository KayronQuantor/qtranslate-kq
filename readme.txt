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

## 🚀 What’s New in 4.0

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

1. Replace plugin files
2. Keep database unchanged
3. Clear cache (if any)

No content migration required.

---

## ⚠️ Compatibility Notes

- Works with existing qTranslate multilingual format: [:en]English[:pl]Polski[:]

- Does NOT convert content to other multilingual plugins

---

## ❗ Limitations

- Not suitable for new projects
- Not compatible with block-based multilingual systems
- Still relies on legacy content encoding

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

The Classic Editor + Classic Widgets workflow has been tested in production-like use. Gutenberg / Block Widgets support has not yet been fully validated. Test on a staging copy first and keep a current backup before deployment.

---

## 💬 Final Note

This is a **maintenance-focused fork**, not a reinvention.

Its goal is simple:
> Keep legacy multilingual sites running — faster, safer, and compatible with modern PHP.
