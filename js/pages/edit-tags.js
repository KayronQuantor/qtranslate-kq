/*! Modified for qTranslate-KQ on 2026-09-15. See MODIFICATIONS.md for details and attribution. */
/* executed for 
 /wp-admin/edit-tags.php (without action=edit)
*/
'use strict';
const $ = jQuery;

$(document).on('qtkqLoadAdmin:edit-tags', (event, qtkq) => {
    const addDisplayHook = function (i, e) {
        qtkq.addDisplayHook(e);
    };

    const updateRow = function (row) {
        const $row = $(row);
        $row.find('.row-title, .description').each(addDisplayHook);
        $row.find('td.name span.inline').css('display', 'none');
    };

    const theList = document.getElementById('the-list');
    if (theList) {
        const observer = new MutationObserver(function (mutations) {
            mutations.forEach(function (mutation) {
                mutation.addedNodes.forEach(function (node) {
                    if (node.nodeType === Node.ELEMENT_NODE && node.matches('tr')) {
                        updateRow(node);
                    }
                    if (node.querySelectorAll) {
                        node.querySelectorAll('tr').forEach(updateRow);
                    }
                });
            });
        });
        observer.observe(theList, {childList: true});
    }

    // remove "Quick Edit" links for now
    $('#the-list > tr > td.name span.inline').css('display', 'none');
});
