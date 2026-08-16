const fs = require("fs");
const path = require("path");

const logDirectory = path.join(__dirname, "..", "logs");
const logFile = path.join(logDirectory, "audit.log");

function ensureLogFile() {
    if (!fs.existsSync(logDirectory)) {
        fs.mkdirSync(logDirectory, { recursive: true });
    }

    if (!fs.existsSync(logFile)) {
        fs.writeFileSync(logFile, "");
    }
}

function logAudit(entry) {
    ensureLogFile();

    const record = {
        timestamp: new Date().toISOString(),
        ...entry
    };

    fs.appendFileSync(
        logFile,
        JSON.stringify(record) + "\n"
    );
}

module.exports = {
    logAudit
}; 