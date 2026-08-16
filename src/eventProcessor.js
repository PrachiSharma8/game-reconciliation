const store = require("./store");
const { rebuildState } = require("./gameEngine");
const { logAudit } = require("./auditLogger");

function validateEvent(event) {
    if (!event || typeof event !== "object") {
        return "Event must be an object";
    }

    const requiredFields = [
        "gameId",
        "playerId",
        "action",
        "timestamp",
        "sequenceId"
    ];

    for (const field of requiredFields) {
        if (
            event[field] === undefined ||
            event[field] === null ||
            event[field] === ""
        ) {
            return `Missing required field: ${field}`;
        }
    }

    if (!["move", "restart"].includes(event.action)) {
        return "action must be move or restart";
    }

    if (event.action === "move" && !event.move) {
        return "move is required for move action";
    }

    if (Number.isNaN(new Date(event.timestamp).getTime())) {
        return "timestamp must be a valid ISO 8601 timestamp";
    }

    return null;
}

function processEvent(event) {
    const validationError = validateEvent(event);

    if (validationError) {
        return {
            statusCode: 400,
            body: {
                success: false,
                error: validationError
            }
        };
    }

    const result = store.addEvent(event);

    if (result.duplicate) {
        logAudit({
            gameId: event.gameId,
            sequenceId: event.sequenceId,
            decision: "duplicate event ignored"
        });

        return {
            statusCode: 200,
            body: {
                success: true,
                duplicate: true,
                message: "Duplicate event ignored",
                state: result.game.state
            }
        };
    }

    const events = store.getEvents(event.gameId);

    const previousState = store.getState(event.gameId);

    const newState = rebuildState(events);

    store.setState(event.gameId, newState);

    logAudit({
        gameId: event.gameId,
        sequenceId: event.sequenceId,
        inputEvent: event,
        decision: "event processed",
        state: newState
    });

    return {
        statusCode: 200,
        body: {
            success: true,
            duplicate: false,
            message: "Event processed",
            state: newState,
            previousState
        }
    };
}

module.exports = {
    processEvent,
    validateEvent
}; 