// Zero-dependency Node self-test. Run with:
//   node ./helpers/__selftest__.mjs
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { expandLanguagePlaceholders } from './language-placeholders.js';
import {
    buildManageSections,
    resolveExpandedCommandIdAfterDelete,
    toggleExpandedCommandId,
} from './manage-page-view.js';
import { reorderCommandsByIds } from './reorder-commands.js';

// --- language-placeholders.js ---
assert.equal(expandLanguagePlaceholders('Reply in {{lang}}.', '正體中文'), 'Reply in 正體中文.');
assert.equal(expandLanguagePlaceholders('Answer in {{ lang }}.', 'English'), 'Answer in English.');
assert.equal(expandLanguagePlaceholders('Use {{LANG}} + {{lang}}.', 'xx'), 'Use xx + xx.');
assert.equal(expandLanguagePlaceholders('No tokens here.', 'en'), 'No tokens here.');
assert.equal(expandLanguagePlaceholders('', 'en'), '');
assert.equal(expandLanguagePlaceholders('{{lang}}', undefined), 'English');
assert.equal(expandLanguagePlaceholders(null, '中文'), '');
console.log('language-placeholders.js: 7 assertions passed');

// --- locales/*.json schema ---
const here = dirname(fileURLToPath(import.meta.url));
const localesDir = join(here, '..', 'locales');
const REQUIRED_UI_KEYS = [
    'list_empty','create_command','back_to_list',
    'delete_command','field_name_label','field_prompt_label',
    'error_name_required','error_prompt_required','picker_empty',
    'export_json','import_json','reset_defaults','more_menu',
    'status_imported','status_count','error_json_parse','import_json_file',
];
const REMOVED_UI_KEYS = [
    'settings_title',
    'settings_subtitle',
    'field_label_label',
    'field_label_placeholder',
    'save_changes',
    'status_saved',
    'error_nothing_to_save',
];
const REQUIRED_SEED_KEYS = ['explain','translate','summarize','code_explain'];

for (const locale of ['zh_TW','zh_CN','en']) {
    const raw = readFileSync(join(localesDir, `${locale}.json`), 'utf8');
    const map = JSON.parse(raw);
    assert.equal(typeof map.language_label, 'string', `${locale}: language_label must be string`);
    assert.ok(map.language_label.trim().length > 0, `${locale}: language_label must be non-empty`);
    for (const key of REQUIRED_UI_KEYS) {
        assert.equal(typeof map?.ui?.[key], 'string', `${locale}: ui.${key} must be string`);
    }
    for (const key of REMOVED_UI_KEYS) {
        assert.equal(map?.ui?.[key], undefined, `${locale}: ui.${key} must be removed`);
    }
    for (const seedKey of REQUIRED_SEED_KEYS) {
        const meta = map?.seed_commands?.[seedKey];
        assert.equal(typeof meta?.name, 'string', `${locale}: seed_commands.${seedKey}.name must be string`);
        assert.equal(typeof meta?.label, 'string', `${locale}: seed_commands.${seedKey}.label must be string`);
        assert.equal(typeof meta?.description, 'string', `${locale}: seed_commands.${seedKey}.description must be string`);
    }
    console.log(`locale ${locale}: schema OK`);
}

// --- seed-prompts.json schema ---
const seedPromptsPath = join(here, '..', 'seed-prompts.json');
const seedPrompts = JSON.parse(readFileSync(seedPromptsPath, 'utf8'));
for (const key of REQUIRED_SEED_KEYS) {
    assert.equal(typeof seedPrompts[key], 'string', `seed-prompts.json: ${key} must be string`);
    assert.ok(seedPrompts[key].includes('{{lang}}'), `seed-prompts.json: ${key} must contain {{lang}} token`);
}
console.log('seed-prompts.json: schema OK');

// --- manage-page-view.js ---
assert.equal(toggleExpandedCommandId('', 'cmd-1'), 'cmd-1');
assert.equal(toggleExpandedCommandId('cmd-1', 'cmd-1'), '');
assert.equal(toggleExpandedCommandId('cmd-1', 'cmd-2'), 'cmd-2');

const formatDate = (value) => `date:${value}`;
const translate = (key, values = []) => `${key}:${values.join('|')}`;
const commands = [
    {
        id: 'cmd-1',
        name: 'alpha',
        label: 'Alpha',
        description: 'First',
        prompt: 'Prompt A',
        aliases: [],
        createdAt: 1,
        updatedAt: 2,
    },
    {
        id: 'cmd-2',
        name: 'beta',
        label: '',
        description: '',
        prompt: 'Prompt B',
        aliases: [],
        createdAt: 3,
        updatedAt: 4,
    },
];

assert.equal(
    resolveExpandedCommandIdAfterDelete('', 'cmd-1', commands),
    '',
    'deleting from a collapsed list should keep the editor collapsed',
);
assert.equal(
    resolveExpandedCommandIdAfterDelete('cmd-1', 'cmd-1', commands.slice(1)),
    '',
    'deleting the expanded command should not expand a neighboring command',
);
assert.equal(
    resolveExpandedCommandIdAfterDelete('cmd-2', 'cmd-1', commands.slice(1)),
    'cmd-2',
    'deleting another command should preserve the currently expanded command',
);
assert.equal(
    resolveExpandedCommandIdAfterDelete('cmd-3', 'cmd-1', commands.slice(1)),
    '',
    'missing expanded command ids should collapse instead of selecting a fallback',
);

const manageSections = buildManageSections({
    topActions: [{ id: 'create-command', label: 'Create' }],
    commands,
    expandedCommandId: 'cmd-2',
    editorMode: 'edit',
    editorValues: {
        name: 'beta',
        label: '',
        aliases: '',
        description: '',
        prompt: 'Prompt B',
    },
    selectedCommand: commands[1],
    currentLocale: 'en',
    inlineBodySupported: true,
    formatTimestamp: formatDate,
    t: translate,
});
assert.equal(manageSections.length, 2, 'web-view layout should inline the editor inside the expanded row, not a sibling card');
assert.equal(manageSections[1].body.length, 1, 'list card should stay a single sortable list regardless of expanded state');
const listSection = manageSections[1].body[0];
assert.equal(listSection.kind, 'list', 'list card body should be a host list section');
assert.equal(listSection.sortable, true, 'manage list should stay sortable even when a row is expanded');
assert.equal(listSection.dragPreview, 'inline', 'manage list should opt into host inline drag feedback to avoid native drag-image snapback');
assert.equal(listSection.dragHandle, 'comfortable', 'manage list should request the larger host drag handle hit area');
assert.equal(listSection.sortingStyle, 'emphasized', 'manage list should request stronger host sorting emphasis during live reorder');
assert.equal(listSection.dropIndicator, 'none', 'manage list should suppress the legacy drop line when live reorder is already visible');
assert.equal(listSection.id, 'slash-commands', 'manage list id should stay stable for host reorder events');
assert.equal(listSection.items.length, 2, 'manage list should contain every command row');

const [collapsedRow, selectedRow] = listSection.items;
assert.equal(collapsedRow.actionId, 'toggle-command', 'command rows should use toggle-command');
assert.equal(collapsedRow.title, 'alpha', 'command rows should show only the command name');
assert.equal(collapsedRow.description, '', 'command rows should not duplicate command info as description');
assert.equal(collapsedRow.meta, '', 'command rows should not duplicate command info as meta');
assert.equal(collapsedRow.actions.length, 1, 'command rows should expose exactly one trailing action');
assert.equal(collapsedRow.actions[0].id, 'delete-command', 'trailing action should be the delete entry');
assert.equal(collapsedRow.actions[0].variant, 'danger', 'delete action should use the danger variant');
assert.equal(collapsedRow.actions[0].data?.commandId, 'cmd-1', 'delete action should carry the commandId in data');
assert.equal(collapsedRow.actions[0].confirm, undefined, 'delete action should not ship with a confirm prompt');
assert.equal(collapsedRow.body, undefined, 'non-expanded rows should stay body-less');
assert.equal(collapsedRow.selected, false, 'non-expanded rows should not be selected');
assert.equal(selectedRow.selected, true, 'expanded command row should flag itself as selected');
assert.ok(Array.isArray(selectedRow.body), 'expanded command row should carry an inline editor body');
assert.equal(selectedRow.body.length, 2, 'expanded row body should contain note + form only (no action buttons)');
assert.equal(selectedRow.body[0].kind, 'note', 'expanded row body first section should be the meta note');
assert.equal(selectedRow.body[1].kind, 'form', 'expanded row body second section should be the editor form');
assert.equal(selectedRow.body[1].columns, 1, 'expanded row editor form should use a single column');
assert.deepEqual(
    selectedRow.body[1].fields.map((field) => field.id),
    ['name', 'aliases', 'description', 'prompt'],
    'expanded row editor should keep only the four editor fields',
);
assert.equal(
    selectedRow.body.some((section) => section.kind === 'actions'),
    false,
    'expanded row body should no longer contain a save/delete action bar',
);

const extensionSections = buildManageSections({
    topActions: [{ id: 'create-command', label: 'Create' }],
    commands,
    expandedCommandId: 'cmd-2',
    editorMode: 'edit',
    editorValues: {
        name: 'beta',
        label: '',
        aliases: '',
        description: '',
        prompt: 'Prompt B',
    },
    selectedCommand: commands[1],
    currentLocale: 'en',
    inlineBodySupported: false,
    formatTimestamp: formatDate,
    t: translate,
});
assert.equal(extensionSections.length, 3, 'extension layout should fall back to a sibling editor card');
const extensionListSection = extensionSections[1].body[0];
assert.equal(extensionListSection.kind, 'list', 'extension layout should still expose the list');
assert.equal(extensionListSection.sortable, true, 'extension layout should keep the list sortable');
assert.equal(extensionListSection.dragPreview, 'inline', 'extension fallback list should keep the same host inline drag feedback');
assert.equal(extensionListSection.dragHandle, 'comfortable', 'extension fallback list should keep the larger host drag handle hit area');
assert.equal(extensionListSection.sortingStyle, 'emphasized', 'extension fallback list should keep the stronger host sorting emphasis');
assert.equal(extensionListSection.dropIndicator, 'none', 'extension fallback list should keep the drop line disabled');
assert.ok(
    extensionListSection.items.every((item) => item.body === undefined),
    'extension layout must not rely on inline row bodies (host item flex-direction is row)',
);
assert.ok(
    extensionListSection.items.find((item) => item.id === 'cmd-2')?.selected,
    'extension layout should still mark the expanded row as selected',
);
const extensionEditorCard = extensionSections[2];
assert.equal(extensionEditorCard.kind, 'card', 'extension layout should render the editor as a sibling card');
assert.equal(extensionEditorCard.body.length, 2, 'extension editor card should contain note + form');
assert.equal(extensionEditorCard.body[0].kind, 'note');
assert.equal(extensionEditorCard.body[1].kind, 'form');
assert.deepEqual(
    extensionEditorCard.body[1].fields.map((field) => field.id),
    ['name', 'aliases', 'description', 'prompt'],
    'extension layout editor should expose the same four fields',
);

const extensionWithoutInline = buildManageSections({
    topActions: [{ id: 'create-command', label: 'Create' }],
    commands,
    expandedCommandId: 'cmd-2',
    editorMode: 'edit',
    editorValues: {
        name: 'beta',
        label: '',
        aliases: '',
        description: '',
        prompt: 'Prompt B',
    },
    selectedCommand: commands[1],
    currentLocale: 'en',
    formatTimestamp: formatDate,
    t: translate,
});
assert.equal(
    extensionWithoutInline.length,
    3,
    'missing inlineBodySupported flag must default to the safer sibling-card layout (extension-safe)',
);

assert.deepEqual(
    reorderCommandsByIds(commands, ['cmd-2', 'cmd-1'])?.map((command) => command.id),
    ['cmd-2', 'cmd-1'],
    'reorderCommandsByIds should return commands in the ordered item sequence',
);
assert.equal(
    reorderCommandsByIds(commands, ['cmd-2']) ?? null,
    null,
    'reorderCommandsByIds should reject incomplete reorder payloads',
);

const draftSections = buildManageSections({
    topActions: [{ id: 'create-command', label: 'Create' }],
    commands: [],
    expandedCommandId: '',
    editorMode: 'create',
    editorValues: {
        name: '',
        label: '',
        aliases: '',
        description: '',
        prompt: '',
    },
    selectedCommand: null,
    currentLocale: 'en',
    formatTimestamp: formatDate,
    t: translate,
});
assert.equal(draftSections.length, 2, 'empty command collection should render top actions + placeholder editor card only');
assert.equal(draftSections[1].body.length, 2, 'empty state card should render note + form without an action row');
assert.equal(draftSections[1].body[0].kind, 'note', 'empty state first section should be the meta note');
assert.equal(draftSections[1].body[1].kind, 'form', 'empty state second section should be the editor form');
assert.deepEqual(
    draftSections[1].body[1].fields.map((field) => field.id),
    ['name', 'aliases', 'description', 'prompt'],
    'draft editor should keep only the four editor fields',
);
assert.equal(
    draftSections[1].body.some((section) => section.kind === 'actions'),
    false,
    'empty state body should no longer expose a save/delete action bar',
);

const collapsedSections = buildManageSections({
    topActions: [{ id: 'create-command', label: 'Create' }],
    commands,
    expandedCommandId: '',
    editorMode: 'edit',
    editorValues: {
        name: 'alpha',
        label: 'Alpha',
        aliases: '',
        description: 'First',
        prompt: 'Prompt A',
    },
    selectedCommand: commands[0],
    currentLocale: 'en',
    formatTimestamp: formatDate,
    t: translate,
});
assert.equal(collapsedSections.length, 2, 'collapsed state should have no trailing editor card');
assert.equal(collapsedSections[1].body.length, 1, 'collapsed state should keep a single sortable list');
assert.equal(collapsedSections[1].body[0].sortable, true, 'collapsed command stack should stay sortable');
assert.ok(
    collapsedSections[1].body[0].items.every((item) => item.body === undefined),
    'collapsed state rows should stay body-less (no expanded editor anywhere)',
);
assert.ok(
    collapsedSections[1].body[0].items.every(
        (item) => item.actions.length === 1 && item.actions[0].id === 'delete-command' && item.actions[0].confirm === undefined,
    ),
    'every row should expose an immediate (no-confirm) delete action',
);
console.log('manage-page-view.js: layout OK');

// --- shell.js contract checks ---
const shellJsPath = join(here, '..', 'shell.js');
const shellSource = readFileSync(shellJsPath, 'utf8');
const TOP_ACTION_ICON_PATTERNS = [
    /\{[^{}]*id:\s*'create-command'[^{}]*icon:\s*'\+'[^{}]*\}/,
    /\{[^{}]*id:\s*'reset-defaults'[^{}]*icon:\s*'↺'[^{}]*\}/,
    /\{[^{}]*id:\s*'open-import'[^{}]*icon:\s*'↓'[^{}]*\}/,
    /\{[^{}]*id:\s*'open-export'[^{}]*icon:\s*'↑'[^{}]*\}/,
];
for (const pattern of TOP_ACTION_ICON_PATTERNS) {
    assert.match(shellSource, pattern, `shell.js: missing management action icon pattern ${pattern}`);
}
assert.match(shellSource, /\{[^{}]*id:\s*'apply-import'[^{}]*icon:\s*'↓'[^{}]*label:\s*t\('ui\.import_action'\)[^{}]*\}/, 'shell.js: import action should use icon plus label');
assert.match(shellSource, /\{[^{}]*id:\s*'apply-import-file'[^{}]*icon:\s*'📎'[^{}]*label:\s*t\('ui\.import_json_file'\)[^{}]*\}/, 'shell.js: import file action should use paperclip icon and file label');
assert.match(shellSource, /\{[^{}]*id:\s*'back-manage'[^{}]*icon:\s*'←'[^{}]*label:\s*t\('ui\.back_to_list'\)[^{}]*\}/, 'shell.js: back action should use icon plus label');
assert.match(shellSource, /title:\s*runtimeState\.pageMode === 'import'[\s\S]*?:\s*t\('ui\.menu_label'\)/, 'shell.js: manage page title should fall back to ui.menu_label instead of an empty string');
assert.doesNotMatch(shellSource, /\{[^{}]*id:\s*'open-slash-commands'[^{}]*icon:\s*['"`/][^{}]*\}/, 'shell.js: top-level slash commands menu item should not render a text icon');
assert.doesNotMatch(shellSource, /\{[^{}]*id:\s*'open-slash-commands'[^{}]*iconSvg:\s*[^,}]+/, 'shell.js: top-level slash commands menu item should not render an SVG icon');
assert.doesNotMatch(shellSource, /const\s+MENU_ICON_SVG\s*=/, 'shell.js: unused slash menu SVG constant should be removed');
assert.doesNotMatch(shellSource, /function buildImportView\(\)\s*\{[\s\S]*?title:\s*t\('ui\.import_json'\)/, 'shell.js: import view card should not repeat the host page title');
assert.doesNotMatch(shellSource, /function buildImportView\(\)\s*\{[\s\S]*?description:\s*t\('ui\.import_note'\)/, 'shell.js: import view card should not repeat the host page subtitle');
assert.doesNotMatch(shellSource, /function buildExportView\(\)\s*\{[\s\S]*?title:\s*t\('ui\.export_json'\)/, 'shell.js: export view card should not repeat the host page title');
assert.doesNotMatch(shellSource, /function buildExportView\(\)\s*\{[\s\S]*?description:\s*t\('ui\.import_note'\)/, 'shell.js: export view card should not repeat the host page subtitle');
assert.match(shellSource, /function buildSlashCommandDescriptors\(commands = \[\]\) \{[\s\S]*?label:\s*command\.description \|\| ''/, 'shell.js: slash picker right-side label should reuse command.description');
assert.match(shellSource, /function buildSlashCommandDescriptors\(commands = \[\]\) \{[\s\S]*?description:\s*''/, 'shell.js: slash picker lower description line should stay empty');
assert.match(shellSource, /async function persistEditorDraft\(\) \{/, 'shell.js: persistEditorDraft helper should drive debounced autosave');
assert.match(shellSource, /function schedulePersistDraft\(\) \{/, 'shell.js: schedulePersistDraft helper should debounce editor change events');
assert.match(shellSource, /async function flushPendingDraft\(\) \{/, 'shell.js: flushPendingDraft helper should let action handlers force-drain the pending timer');
assert.match(shellSource, /inlineBodySupported:\s*true/, 'shell.js: manage view should always request inline row bodies from the host renderer');
assert.doesNotMatch(shellSource, /import Sortable from '\.\/vendor\/sortable\.esm\.js'/, 'shell.js: plugin should rely on host-native sortable lists instead of vendored SortableJS');
assert.doesNotMatch(shellSource, /function injectInlineBodyStyles\(\) \{/, 'shell.js: plugin should not inject host-page CSS for inline list bodies');
assert.doesNotMatch(shellSource, /function removeInlineBodyStyles\(\) \{/, 'shell.js: plugin should not manage injected host-page CSS anymore');
assert.doesNotMatch(shellSource, /function ensureSortable\(listEl\) \{/, 'shell.js: plugin should not bootstrap SortableJS manually');
assert.doesNotMatch(shellSource, /function handleSortableChoose\(evt\) \{/, 'shell.js: plugin should not collapse rows to work around guest drag limitations');
assert.doesNotMatch(shellSource, /async function handleSortableEnd\(evt\) \{/, 'shell.js: plugin should not persist SortableJS reorder events directly');
assert.doesNotMatch(shellSource, /function initListObserver\(\) \{/, 'shell.js: plugin should not need a MutationObserver for host re-renders');
assert.doesNotMatch(shellSource, /function teardownListObserver\(\) \{/, 'shell.js: plugin cleanup should not tear down guest-side drag helpers');
assert.doesNotMatch(shellSource, /function detectInlineBodySupport\(\) \{/, 'shell.js: plugin should not probe cross-frame host DOM availability');
assert.doesNotMatch(shellSource, /function getHostDocument\(\) \{/, 'shell.js: plugin should not walk host documents directly');
assert.doesNotMatch(shellSource, /function collectReachableDocuments\(\) \{/, 'shell.js: plugin should not enumerate reachable host documents');
assert.doesNotMatch(shellSource, /window\.self === window\.top/, 'shell.js: plugin should not branch on top-level vs guest window to enable inline bodies');
assert.match(shellSource, /if \(event\?\.type === 'reorder' && event\.listId === 'slash-commands'\)/, 'shell.js: manage page should handle host reorder events for slash-commands');
assert.match(shellSource, /await reorderCommands\(Array\.isArray\(event\.orderedItemIds\) \? event\.orderedItemIds : \[\], values\);/, 'shell.js: reorder handler should forward live form values so drafts survive drag sorting');
assert.match(shellSource, /const nextEnvelope = normalizeEnvelope\(\{[\s\S]*?commands: nextCommands,[\s\S]*?\}\s*,\s*\{[\s\S]*?fallbackInitializedAt:/, 'shell.js: reorderCommands should commit the next command order into runtime state before persistence');
assert.match(shellSource, /await renderCurrentPage\(\{ resetViewState: true \}\);\s*await writeStoredEnvelope\(nextEnvelope\);\s*await syncSlashCommands\(\);/, 'shell.js: reorderCommands should repaint before disk persistence so drag release cannot flash the stale order');
assert.doesNotMatch(shellSource, /async function saveCurrentCommand\b/, 'shell.js: manual save helper should be removed in favor of autosave');
assert.doesNotMatch(shellSource, /ui\.status_saved/, 'shell.js: saved toast reference should be removed');
assert.doesNotMatch(shellSource, /'save-command'/, 'shell.js: save-command action id should be removed');
assert.doesNotMatch(shellSource, /'delete-current'/, 'shell.js: delete-current action id should be removed');
assert.doesNotMatch(shellSource, /id:\s*'copy-export'/, 'shell.js: export copy action must be removed');
assert.doesNotMatch(shellSource, /t\('ui\.settings_title'\)/, 'shell.js: settings_title references must be removed');
assert.doesNotMatch(shellSource, /t\('ui\.settings_subtitle'\)/, 'shell.js: settings_subtitle references must be removed');
assert.doesNotMatch(shellSource, /t\('ui\.field_label_label'\)/, 'shell.js: display title label references must be removed');
assert.doesNotMatch(shellSource, /t\('ui\.field_label_placeholder'\)/, 'shell.js: display title placeholder references must be removed');
assert.doesNotMatch(shellSource, /status_reordered/, 'shell.js: reorder success toasts must be removed');
console.log('shell.js: contract OK');

console.log('\nAll self-tests passed ✓');
