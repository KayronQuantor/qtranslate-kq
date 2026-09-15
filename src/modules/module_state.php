<?php

/*
 * Modified for qTranslate-KQ on 2026-09-15.
 * See MODIFICATIONS.md for the modification history and original-project attribution.
 */
/**
 * Internal module state, stored in DB options.
 * A module is blocked when incompatible plugins are active.
 */
const QTKQ_MODULE_STATE_UNDEFINED = 0;
const QTKQ_MODULE_STATE_ACTIVE    = 1;
const QTKQ_MODULE_STATE_INACTIVE  = 2;
const QTKQ_MODULE_STATE_BLOCKED   = 3;
