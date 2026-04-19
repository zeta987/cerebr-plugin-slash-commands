// Zero-dependency Node self-test. Run with:
//   node ./helpers/__selftest__.mjs
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { expandLanguagePlaceholders } from './language-placeholders.js';
import { buildManageSections, toggleExpandedCommandId } from './manage-page-view.js';
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
    'save_changes','delete_command','field_name_label','field_prompt_label',
    'status_saved','error_name_required','error_prompt_required','picker_empty',
    'export_json','import_json','reset_defaults','more_menu',
    'status_imported','status_count','error_json_parse','import_json_file',
];
const REMOVED_UI_KEYS = [
    'settings_title',
    'settings_subtitle',
    'field_label_label',
    'field_label_placeholder',
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
    formatTimestamp: formatDate,
    t: translate,
});
assert.equal(manageSections.length, 2, 'manage sections should include top actions plus one sortable command list card');
assert.equal(manageSections[1].body.length, 5, 'expanded command stack should insert the editor directly after the selected row');
assert.equal(manageSections[1].body[0].kind, 'list', 'first command row should still render as a host list block');
assert.equal(manageSections[1].body[1].kind, 'list', 'selected command row should stay in its own list block');
assert.equal(manageSections[1].body[1].items[0].actionId, 'toggle-command', 'command rows should use toggle-command');
assert.equal(manageSections[1].body[0].items[0].token ?? '', '', 'command rows should not render a separate slash token');
assert.equal(manageSections[1].body[0].items[0].title, 'alpha', 'command rows should show only the command name without the slash prefix');
assert.equal(manageSections[1].body[0].items[0].description, '', 'command rows should not duplicate the command with extra description text');
assert.equal(manageSections[1].body[0].items[0].meta, '', 'command rows should not repeat the slash name as meta');
assert.equal(manageSections[1].body[0].items[0].actions.length, 0, 'command rows should stay compact without inline action columns');
assert.equal(manageSections[1].body[1].items[0].body?.length ?? 0, 0, 'expanded rows should not inline body content that gets pushed into a right-side column');
assert.equal(manageSections[1].body[2].kind, 'note', 'expanded editor note should render directly after the selected row');
assert.equal(manageSections[1].body[3].kind, 'form', 'expanded editor form should render directly after the selected row');
assert.equal(manageSections[1].body[4].kind, 'actions', 'expanded editor actions should render directly after the selected row');
assert.equal(manageSections[1].body[3].columns, 1, 'expanded editor form should use a single column so it expands downward');
assert.deepEqual(
    manageSections[1].body[3].fields.map((field) => field.id),
    ['name', 'aliases', 'description', 'prompt'],
    'expanded editor should hide the display title field and keep only four editor fields',
);
assert.equal(
    manageSections[1].body[4].actions.some((action) => action.id === 'delete-current'),
    true,
    'expanded card should expose delete-current',
);
assert.equal(
    manageSections[1].body[4].actions.some((action) => action.id === 'move-down'),
    false,
    'expanded editor should no longer expose move-down',
);
assert.equal(
    manageSections[1].body[4].actions.some((action) => action.id === 'move-up'),
    false,
    'expanded editor should no longer expose move-up',
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
assert.equal(draftSections.length, 2, 'empty command collection should still render a stack card');
assert.equal(draftSections[1].body[0].kind, 'note', 'draft card should stay inside the command stack');
assert.deepEqual(
    draftSections[1].body[1].fields.map((field) => field.id),
    ['name', 'aliases', 'description', 'prompt'],
    'draft editor should hide the display title field and keep only four editor fields',
);
assert.equal(draftSections[1].body[2].kind, 'actions', 'draft card should render inline actions without a shared editor');

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
assert.equal(collapsedSections[1].body.length, 1, 'collapsed state should keep a single sortable list');
assert.equal(collapsedSections[1].body[0].sortable, true, 'collapsed command stack should stay sortable');
console.log('manage-page-view.js: layout OK');

// --- management page action icons ---
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
assert.match(shellSource, /async function saveCurrentCommand\(values\) \{[\s\S]*?beginEditCommand\(nextCommand\.id\);\s*collapseEditor\(\);/, 'shell.js: saving a command should collapse the editor after selecting the saved command');
assert.match(shellSource, /if \(event\?\.type === 'reorder' && event\.listId === 'slash-commands'\)/, 'shell.js: manage page should handle host reorder events for slash-commands');
assert.match(shellSource, /await reorderCommands\(Array\.isArray\(event\.orderedItemIds\) \? event\.orderedItemIds : \[\], values\);/, 'shell.js: reorder handler should forward live form values so drafts survive drag sorting');
assert.doesNotMatch(shellSource, /id:\s*'copy-export'/, 'shell.js: export copy action must be removed');
assert.doesNotMatch(shellSource, /t\('ui\.settings_title'\)/, 'shell.js: settings_title references must be removed');
assert.doesNotMatch(shellSource, /t\('ui\.settings_subtitle'\)/, 'shell.js: settings_subtitle references must be removed');
assert.doesNotMatch(shellSource, /t\('ui\.field_label_label'\)/, 'shell.js: display title label references must be removed');
assert.doesNotMatch(shellSource, /t\('ui\.field_label_placeholder'\)/, 'shell.js: display title placeholder references must be removed');
assert.doesNotMatch(shellSource, /status_reordered/, 'shell.js: reorder success toasts must be removed');
console.log('shell.js: top action icons OK');

console.log('\nAll self-tests passed ✓');
