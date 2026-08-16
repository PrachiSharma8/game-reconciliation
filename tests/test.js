const assert = require("assert");

const {
    rebuildState,
    sortEvents
} = require("../src/gameEngine");

const {
    validateEvent
} = require("../src/eventProcessor");

console.log("Running tests...\n");

// Test 1: valid event
const validEvent = {
    gameId: "test",
    playerId: "p1",
    action: "move",
    move: "0",
    timestamp: "2026-08-16T10:00:01Z",
    sequenceId: "e1"
};

assert.strictEqual(
    validateEvent(validEvent),
    null
);

console.log("✓ Valid event");

// Test 2: missing field
const invalidEvent = {
    gameId: "test",
    playerId: "p1",
    action: "move",
    move: "0",
    timestamp: "2026-08-16T10:00:01Z"
};

assert.notStrictEqual(
    validateEvent(invalidEvent),
    null
);

console.log("✓ Missing field rejected");

// Test 3: event ordering
const events = [
    {
        ...validEvent,
        sequenceId: "e3",
        timestamp: "2026-08-16T10:00:03Z"
    },
    {
        ...validEvent,
        sequenceId: "e1",
        timestamp: "2026-08-16T10:00:01Z"
    },
    {
        ...validEvent,
        sequenceId: "e2",
        timestamp: "2026-08-16T10:00:02Z"
    }
];

const sorted = sortEvents(events);

assert.deepStrictEqual(
    sorted.map(e => e.sequenceId),
    ["e1", "e2", "e3"]
);

console.log("✓ Out-of-order events sorted");

// Test 4: duplicate sequence IDs
const duplicateEvents = [
    validEvent,
    validEvent
];

const state = rebuildState(duplicateEvents);

assert.strictEqual(
    state.processedEvents.length,
    1 
);

console.log("✓ Reconciliation engine deterministic");

// Test 5: completed game
const winningEvents = [
    {
        gameId: "win",
        playerId: "p1",
        action: "move",
        move: "0",
        timestamp: "2026-08-16T10:00:01Z",
        sequenceId: "w1"
    },
    {
        gameId: "win",
        playerId: "p2",
        action: "move",
        move: "1",
        timestamp: "2026-08-16T10:00:02Z",
        sequenceId: "w2"
    },
    {
        gameId: "win",
        playerId: "p1",
        action: "move",
        move: "3",
        timestamp: "2026-08-16T10:00:03Z",
        sequenceId: "w3"
    },
    {
        gameId: "win",
        playerId: "p2",
        action: "move",
        move: "4",
        timestamp: "2026-08-16T10:00:04Z",
        sequenceId: "w4"
    },
    {
        gameId: "win",
        playerId: "p1",
        action: "move",
        move: "6",
        timestamp: "2026-08-16T10:00:05Z",
        sequenceId: "w5"
    }
];

const winningState = rebuildState(winningEvents);

assert.strictEqual(
    winningState.status,
    "completed"
);

console.log("✓ Completed game detected");

console.log("\nALL TESTS PASSED ✓"); 