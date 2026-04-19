export function reorderCommandsByIds(commands = [], orderedItemIds = []) {
    if (!Array.isArray(commands) || !Array.isArray(orderedItemIds)) {
        return null;
    }

    if (orderedItemIds.length !== commands.length) {
        return null;
    }

    const commandById = new Map(commands.map((command) => [command?.id, command]));
    const nextCommands = [];

    for (const commandId of orderedItemIds) {
        if (!commandById.has(commandId)) {
            return null;
        }

        nextCommands.push(commandById.get(commandId));
        commandById.delete(commandId);
    }

    if (commandById.size > 0) {
        return null;
    }

    return nextCommands;
}
