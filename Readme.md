# Game Reconciliation Engine

A deterministic event reconciliation backend built with Node.js and Express.js.

## Overview

This project processes game events, reconstructs game state, handles duplicate and out-of-order events, detects conflicts, and maintains an auditable record of decisions.

The system is designed to be:

- Deterministic
- Idempotent
- Replayable
- Auditable

## Tech Stack

- Node.js
- Express.js
- JavaScript
- Local JSON fixtures
- In-memory state
- Local audit logs

## Project Structure

```text
game-reconciliation/
│
├── demo/
│   └── replay-output.json
│
├── fixtures/
│   └── events.json
│
├── logs/
│   └── audit.log
│
├── src/
│   ├── auditLogger.js
│   ├── eventProcessor.js
│   ├── gameEngine.js
│   ├── replay.js
│   └── store.js
│
├── tests/
│   └── test.js
│
├── server.js
├── package.json
└── README.md 