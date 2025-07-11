const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 5001;

app.use(cors());
app.use(bodyParser.json());

const eventsPath = path.join(__dirname, 'data', 'events.json');
const alertsPath = path.join(__dirname, 'data', 'alerts.json');

// Helper to read/write JSON
function readJSON(file) {
    if (!fs.existsSync(file)) return [];
    return JSON.parse(fs.readFileSync(file));
}
function writeJSON(file, data) {
    fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

// Get events
app.get('/api/events', (req, res) => {
    res.json(readJSON(eventsPath));
});

// Get alerts
app.get('/api/alerts', (req, res) => {
    res.json(readJSON(alertsPath));
});

// Add event (simulate anomaly detection)
app.post('/api/events', (req, res) => {
    const events = readJSON(eventsPath);
    const alerts = readJSON(alertsPath);
    const event = req.body;
    event.id = Date.now().toString();
    events.push(event);

    // Simple anomaly: if departments never collaborated before, trigger alert
    const pair = `${event.sourceDept}-${event.targetDept}`;
    const seen = events.filter(e => `${e.sourceDept}-${e.targetDept}` === pair).length;
    if (seen === 1) {
        alerts.push({
            id: Date.now().toString(),
            timestamp: new Date(),
            departments: [event.sourceDept, event.targetDept],
            eventType: event.type,
            description: `Unusual collaboration between ${event.sourceDept} and ${event.targetDept}`,
            severity: 'high',
        });
        writeJSON(alertsPath, alerts);
    }
    writeJSON(eventsPath, events);
    res.status(201).json(event);
});

// Get department pairs matrix
app.get('/api/pairs', (req, res) => {
    const events = readJSON(eventsPath);
    const matrix = {};
    events.forEach(e => {
        const key = `${e.sourceDept}→${e.targetDept}`;
        matrix[key] = (matrix[key] || 0) + 1;
    });
    res.json(matrix);
});

app.listen(PORT, () => console.log(`Backend running on http://localhost:${PORT}`));
