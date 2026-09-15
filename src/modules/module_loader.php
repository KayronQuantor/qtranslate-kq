<?php

/*
 * Modified for qTranslate-KQ on 2026-09-15.
 * See MODIFICATIONS.md for the modification history and original-project attribution.
 */
require_once QTRANSLATE_DIR . '/src/modules/module_state.php';

/**
 * Provide the ability to load the modules and check the stored state, with a minimal overhead for the front-side.
 *
 * @see QTKQ_Admin_Module_Manager::update_modules_state() for state updates. No state change is done here.
 */
class QTKQ_Module_Loader {
    /**
     * Check if a module is active, by reading the state from the options.
     *
     * @param string $module_id
     *
     * @return bool true if module active.
     */
    public static function is_module_active( string $module_id ): bool {
        $modules_state = get_option( QTKQ_OPTIONS_MODULES_STATE, array() );

        return isset( $modules_state[ $module_id ] ) && $modules_state[ $module_id ] === QTKQ_MODULE_STATE_ACTIVE;
    }

    /**
     * Loads modules previously activated in the options.
     *
     * Attention! This assumes the current states stored in the options are valid.
     * This doesn't perform any check, neither on the plugin conditions nor the folder structure.
     * In the worst case the state can be refreshed by reactivating the plugin.
     *
     * Note also the modules should be loaded before "qtranslate_init_language" is triggered.
     */
    public static function load_active_modules(): void {
        $modules_state = get_option( QTKQ_OPTIONS_MODULES_STATE, array() );

        foreach ( $modules_state as $module_id => $state ) {
            if ( $state === QTKQ_MODULE_STATE_ACTIVE ) {
                require_once QTRANSLATE_DIR . '/src/modules/' . $module_id . '/' . 'loader.php';
            }
        }
    }
}
