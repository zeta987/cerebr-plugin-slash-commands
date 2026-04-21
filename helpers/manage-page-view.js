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

function createExpandedEditorBody({
    command,
    editorMode,
    editorValues,
    currentLocale,
    formatTimestamp,
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
            columns: 1,
            fields: createEditorFields(editorValues, t),
        },
    ];
}

function createCommandRowItem({
    command,
    expandedCommandId,
    editorMode,
    editorValues,
    selectedCommand,
    currentLocale,
    inlineBodySupported,
    formatTimestamp,
    t,
}) {
    const expanded = expandedCommandId === command.id;
    const item = {
        id: command.id,
        title: command.name,
        description: '',
        meta: '',
        selected: expanded,
        actionId: 'toggle-command',
        actions: [
            {
                id: 'delete-command',
                icon: '🗑',
                title: t('ui.delete_command'),
                variant: 'danger',
                data: { commandId: command.id },
            },
        ],
    };

    if (inlineBodySupported && expanded && selectedCommand && selectedCommand.id === command.id) {
        item.body = createExpandedEditorBody({
            command: selectedCommand,
            editorMode,
            editorValues,
            currentLocale,
            formatTimestamp,
            t,
        });
    }

    return item;
}

export function toggleExpandedCommandId(currentExpandedCommandId, commandId) {
    const nextId = normalizeId(commandId);
    if (!nextId) {
        return '';
    }

    return normalizeId(currentExpandedCommandId) === nextId ? '' : nextId;
}

export function resolveExpandedCommandIdAfterDelete(
    currentExpandedCommandId,
    deletedCommandId,
    commandsAfterDelete = [],
) {
    const expandedId = normalizeId(currentExpandedCommandId);
    if (!expandedId || expandedId === normalizeId(deletedCommandId)) {
        return '';
    }

    return commandsAfterDelete.some((command) => normalizeId(command?.id) === expandedId)
        ? expandedId
        : '';
}

export function buildManageSections({
    topActions,
    commands,
    expandedCommandId,
    editorMode,
    editorValues,
    selectedCommand,
    currentLocale,
    inlineBodySupported = false,
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
                t,
            }),
        });
        return sections;
    }

    sections.push({
        kind: 'card',
        body: [
            {
                kind: 'list',
                id: 'slash-commands',
                sortable: true,
                dragPreview: 'inline',
                dragHandle: 'comfortable',
                sortingStyle: 'emphasized',
                dropIndicator: 'none',
                items: commands.map((command) => createCommandRowItem({
                    command,
                    expandedCommandId,
                    editorMode,
                    editorValues,
                    selectedCommand,
                    currentLocale,
                    inlineBodySupported,
                    formatTimestamp,
                    t,
                })),
            },
        ],
    });

    if (!inlineBodySupported && expandedCommandId && selectedCommand) {
        sections.push({
            kind: 'card',
            body: createExpandedEditorBody({
                command: selectedCommand,
                editorMode,
                editorValues,
                currentLocale,
                formatTimestamp,
                t,
            }),
        });
    }

    return sections;
}
