function sortEvents(events) {
    return [...events].sort((a, b) => {
        const timeA = new Date(a.timestamp).getTime();
        const timeB = new Date(b.timestamp).getTime();

        if (timeA !== timeB) {
            return timeA - timeB;
        }

        return a.sequenceId.localeCompare(b.sequenceId);
    });
}

function createInitialState() {
    return {
        currentTurn: null,
        board: Array(9).fill(null),
        scores: {},
        status: "ongoing",
        winner: null,
        processedEvents: [],
        decisions: []
    };
}

function checkWinner(board) {
    const winningLines = [
        [0, 1, 2],
        [3, 4, 5],
        [6, 7, 8],
        [0, 3, 6],
        [1, 4, 7],
        [2, 5, 8],
        [0, 4, 8],
        [2, 4, 6]
    ];

    for (const [a, b, c] of winningLines) {
        if (
            board[a] &&
            board[a] === board[b] &&
            board[a] === board[c]
        ) {
            return board[a];
        }
    }

    return null;
}

function isBoardFull(board) {
    return board.every(cell => cell !== null);
}

function getMoveIndex(move) {
    const index = Number(move);

    if (!Number.isInteger(index) || index < 0 || index > 8) {
        return -1;
    }

    return index;
}

function processTicTacToeEvent(state, event) {
    if (event.action === "restart") {
        state.board = Array(9).fill(null);
        state.status = "restarted";
        state.winner = null;
        state.currentTurn = event.playerId;

        state.decisions.push({
            sequenceId: event.sequenceId,
            decision: "restart accepted"
        });

        return true;
    }

    if (event.action !== "move") {
        state.decisions.push({
            sequenceId: event.sequenceId,
            decision: "rejected: invalid action"
        });

        return false;
    }

    const index = getMoveIndex(event.move);

    if (index === -1) {
        state.decisions.push({
            sequenceId: event.sequenceId,
            decision: "rejected: invalid board position"
        });

        return false;
    }

    if (state.status === "completed") {
        state.decisions.push({
            sequenceId: event.sequenceId,
            decision: "rejected: game already completed"
        });

        return false;
    }

    if (state.currentTurn === null) {
        state.currentTurn = event.playerId;
    }

    if (event.playerId !== state.currentTurn) {
        state.decisions.push({
            sequenceId: event.sequenceId,
            decision: "rejected: wrong turn"
        });

        return false;
    }

    if (state.board[index] !== null) {
        state.decisions.push({
            sequenceId: event.sequenceId,
            decision: "rejected: cell already occupied"
        });

        return false;
    }

    const symbol =
        event.move === "X" || event.move === "O"
            ? event.move
            : (state.board.filter(Boolean).length % 2 === 0 ? "X" : "O");

    state.board[index] = symbol;

    state.decisions.push({
        sequenceId: event.sequenceId,
        decision: `move accepted at position ${index}`
    });

    if (!state.scores[event.playerId]) {
        state.scores[event.playerId] = 0;
    }

    const winnerSymbol = checkWinner(state.board);

    if (winnerSymbol) {
        state.status = "completed";
        state.winner = event.playerId;
        state.scores[event.playerId] += 1;

        state.decisions.push({
            sequenceId: event.sequenceId,
            decision: `game completed, winner: ${event.playerId}`
        });

        return true;
    }

    if (isBoardFull(state.board)) {
        state.status = "completed";
        state.winner = "draw";

        state.decisions.push({
            sequenceId: event.sequenceId,
            decision: "game completed, draw"
        });

        return true;
    }

    state.currentTurn = null;

    return true;
}

function processRpsEvent(state, event) {
    if (!state.roundMoves) {
        state.roundMoves = {};
    }

    if (event.action === "restart") {
        state.roundMoves = {};
        state.status = "restarted";
        state.winner = null;

        state.decisions.push({
            sequenceId: event.sequenceId,
            decision: "restart accepted"
        });

        return true;
    }

    const validMoves = ["rock", "paper", "scissors"];

    if (!validMoves.includes(event.move)) {
        state.decisions.push({
            sequenceId: event.sequenceId,
            decision: "rejected: invalid RPS move"
        });

        return false;
    }

    if (state.roundMoves[event.playerId]) {
        state.decisions.push({
            sequenceId: event.sequenceId,
            decision: "rejected: player already moved this round"
        });

        return false;
    }

    state.roundMoves[event.playerId] = event.move;

    const players = Object.keys(state.roundMoves);

    if (players.length >= 2) {
        const [p1, p2] = players;
        const m1 = state.roundMoves[p1];
        const m2 = state.roundMoves[p2];

        if (m1 !== m2) {
            const p1Wins =
                (m1 === "rock" && m2 === "scissors") ||
                (m1 === "paper" && m2 === "rock") ||
                (m1 === "scissors" && m2 === "paper");

            const winner = p1Wins ? p1 : p2;

            if (!state.scores[p1]) state.scores[p1] = 0;
            if (!state.scores[p2]) state.scores[p2] = 0;

            state.scores[winner] += 1;
            state.winner = winner;

            state.decisions.push({
                sequenceId: event.sequenceId,
                decision: `round winner: ${winner}`
            });
        } else {
            state.winner = "draw";
        }

        state.roundMoves = {};
    }

    return true;
}

function rebuildState(events) {
    const sortedEvents = sortEvents(events);

    let state = createInitialState();

    // Track sequence IDs so duplicate events are ignored
    const seenSequenceIds = new Set();

    for (const event of sortedEvents) {

        // Ignore duplicate events
        if (seenSequenceIds.has(event.sequenceId)) {
            state.decisions.push({
                sequenceId: event.sequenceId,
                decision: "duplicate event ignored during reconstruction"
            });

            continue;
        }

        seenSequenceIds.add(event.sequenceId);

        const previousState = JSON.stringify(state);

        const isRps = [
            "rock",
            "paper",
            "scissors"
        ].includes(event.move);

        let accepted;

        if (isRps) {
            accepted = processRpsEvent(state, event);
        } else {
            accepted = processTicTacToeEvent(state, event);
        }

        if (accepted) {
            state.processedEvents.push(event.sequenceId);
        }

        if (JSON.stringify(state) !== previousState) {
            state.decisions.push({
                sequenceId: event.sequenceId,
                decision: "state reconstructed"
            });
        }
    }

    return state;
} 

module.exports = {
    sortEvents,
    rebuildState
}; 