const games = new Map();

function getGame(gameId) {
    if (!games.has(gameId)) {
        games.set(gameId, {
            gameId,
            events: new Map(),
            state: null
        });
    }

    return games.get(gameId);
}

function addEvent(event) {
    const game = getGame(event.gameId);

    if (game.events.has(event.sequenceId)) {
        return {
            duplicate: true,
            game
        };
    }

    game.events.set(event.sequenceId, event);

    return {
        duplicate: false,
        game
    };
}

function getEvents(gameId) {
    const game = getGame(gameId);

    return Array.from(game.events.values());
}

function setState(gameId, state) {
    const game = getGame(gameId);
    game.state = state;
}

function getState(gameId) {
    return getGame(gameId).state;
}

function clearStore() {
    games.clear();
}

module.exports = {
    getGame,
    addEvent,
    getEvents,
    setState,
    getState,
    clearStore
}; 