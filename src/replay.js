const fs = require("fs");
const path = require("path");

const { rebuildState } = require("./gameEngine");

const fixturePath = path.join(
    __dirname,
    "..",
    "fixtures",
    "events.json"
);

const events = JSON.parse(
    fs.readFileSync(fixturePath, "utf8")
);

console.log("\n===== GAME REPLAY =====\n");

console.log(`Events loaded: ${events.length}`);

const state = rebuildState(events);

console.log("\n===== FINAL STATE =====\n");

console.log(JSON.stringify(state, null, 2));

console.log("\n===== REPLAY COMPLETE =====\n");  