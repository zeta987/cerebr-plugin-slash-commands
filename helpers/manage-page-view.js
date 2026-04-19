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

function createEditorActions({ editorMode, t }) {
    return [
        {
            id: 'save-command',
            label: t('ui.save_changes'),
            variant: 'primary',
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
        {
            kind: 'actions',
            actions: createEditorActions({ editorMode, t }),
        },
    ];
}

function createCommandRowItem({
    command,
    expandedCommandId,
}) {
    const expanded = expandedCommandId === command.id;
    return {
        id: command.id,
        title: command.name,
        description: '',
        meta: '',
        selected: expanded,
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
                t,
            }),
        });
        return sections;
    }

    if (expandedCommandId) {
        const stackBody = [];
        commands.forEach((command) => {
            stackBody.push({
                kind: 'list',
                items: [
                    createCommandRowItem({
                        command,
                        expandedCommandId,
                    }),
                ],
            });

            if (command.id === expandedCommandId) {
                stackBody.push(...createExpandedEditorBody({
                    command: selectedCommand,
                    editorMode,
                    editorValues,
                    currentLocale,
                    formatTimestamp,
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

    sections.push({
        kind: 'card',
        body: [
            {
                kind: 'list',
                id: 'slash-commands',
                sortable: true,
                items: commands.map((command) => createCommandRowItem({
                    command,
                    expandedCommandId,
                })),
            },
        ],
    });

    return sections;
}
