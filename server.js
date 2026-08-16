const express = require("express");
const { processEvent } = require("./src/eventProcessor");
const store = require("./src/store");

const app = express();
const PORT = 3000;

app.use(express.json());

app.get("/", (req, res) => {
    res.json({
        message: "Game Reconciliation Server is running!",
        endpoints: [
            "POST /events",
            "GET /games/:gameId"
        ]
    });
});

app.post("/events", (req, res) => {
    const result = processEvent(req.body);

    res.status(result.statusCode).json(result.body);
});

app.get("/games/:gameId", (req, res) => {
    const state = store.getState(req.params.gameId);

    if (!state) {
        return res.status(404).json({
            error: "Game not found"
        });
    }

    res.json({
        gameId: req.params.gameId,
        state
    });
}); 

app.post("/replay", (req, res) => {
    const events = req.body.events;

    if (!Array.isArray(events)) {
        return res.status(400).json({
            error: "events must be an array"
        });
    }

    const results = [];

    for (const event of events) {
        results.push(processEvent(event).body);
    }

    res.json({
        message: "Replay completed",
        results
    });
}); 

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
}); 