function normalizeId(value) {
    return String(value ?? '').trim();
}

function createEditorFields(editorValues, t) {
    return [
        {
            id: 'name',
            label: t('ui.field_name_label'),
            type: 'text',
            value: editorValues.name,
            placeholder: t('ui.field_name_placeholder'),
        },
        {
            id: 'aliases',
            label: t('ui.field_aliases_label'),
            type: 'textarea',
            value: editorValues.aliases,
            placeholder: t('ui.field_aliases_placeholder'),
            description: t('ui.field_aliases_note'),
            rows: 3,
        },
        {
            id: 'description',
            label: t('ui.field_description_label'),
            type: 'textarea',
            value: editorValues.description,
            placeholder: t('ui.field_description_placeholder'),
            rows: 3,
        },
        {
            id: 'prompt',
            label: t('ui.field_prompt_label'),
            type: 'textarea',
            value: editorValues.prompt,
            placeholder: t('ui.field_prompt_placeholder'),
            rows: 10,
            span: 2,
        },
    ];
}

function createEditorActions({ editorMode, canMoveUp, canMoveDown, t }) {
    return [
        {
            id: 'save-command',
            label: t('ui.save_changes'),
            variant: 'primary',
        },
        {
            id: 'move-up',
            label: t('ui.move_up'),
            disabled: editorMode !== 'edit' || !canMoveUp,
        },
        {
            id: 'move-down',
            label: t('ui.move_down'),
            disabled: editorMode !== 'edit' || !canMoveDown,
        },
        {
            id: 'delete-current',
            label: t('ui.delete_command'),
            variant: 'danger',
            disabled: editorMode !== 'edit',
            confirm: t('ui.delete_command'),
        },
    ];
}

function createExpandedEditorBody({
    command,
    editorMode,
    editorValues,
    currentLocale,
    formatTimestamp,
    canMoveUp,
    canMoveDown,
    t,
}) {
    const title = editorMode === 'create'
        ? t('ui.create_command')
        : (command?.label || command?.name || '');
    const text = editorMode === 'edit' && command
        ? t('ui.command_meta', [
            command.id,
            formatTimestamp(command.createdAt, currentLocale),
            formatTimestamp(command.updatedAt, currentLocale),
        ])
        : t('ui.list_empty');

    return [
        {
            kind: 'note',
            title,
            text,
            tone: 'muted',
        },
        {
            kind: 'form',
            fields: createEditorFields(editorValues, t),
        },
        {
            kind: 'actions',
            actions: createEditorActions({ editorMode, canMoveUp, canMoveDown, t }),
        },
    ];
}

function createCommandRowItem({ command, index, total, expandedCommandId, t }) {
    const slashName = `/${command.name}`;
    return {
        id: command.id,
        title: slashName,
        description: '',
        meta: '',
        selected: expandedCommandId === command.id,
        actionId: 'toggle-command',
        actions: [],
    };
}

export function toggleExpandedCommandId(currentExpandedCommandId, commandId) {
    const nextId = normalizeId(commandId);
    if (!nextId) {
        return '';
    }

    return normalizeId(currentExpandedCommandId) === nextId ? '' : nextId;
}

export function buildManageSections({
    topActions,
    commands,
    expandedCommandId,
    editorMode,
    editorValues,
    selectedCommand,
    currentLocale,
    formatTimestamp,
    t,
}) {
    const sections = [
        {
            kind: 'card',
            variant: 'subtle',
            description: t('ui.status_count', [commands.length]),
            body: [
                {
                    kind: 'actions',
                    actions: topActions,
                },
            ],
        },
    ];

    if (!commands.length) {
        sections.push({
            kind: 'card',
            body: createExpandedEditorBody({
                command: selectedCommand,
                editorMode,
                editorValues,
                currentLocale,
                formatTimestamp,
                canMoveUp: false,
                canMoveDown: false,
                t,
            }),
        });
        return sections;
    }

    const stackBody = [];
    commands.forEach((command, index) => {
        const expanded = expandedCommandId === command.id;
        stackBody.push({
            kind: 'list',
            items: [
                createCommandRowItem({
                    command,
                    index,
                    total: commands.length,
                    expandedCommandId,
                    t,
                }),
            ],
        });

        if (expanded) {
            stackBody.push(...createExpandedEditorBody({
                command,
                editorMode,
                editorValues,
                currentLocale,
                formatTimestamp,
                canMoveUp: index > 0,
                canMoveDown: index < commands.length - 1,
                t,
            }));
        }
    });

    sections.push({
        kind: 'card',
        body: stackBody,
    });

    return sections;
}
