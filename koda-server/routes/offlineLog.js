//PAUSED
const express = require('express');
const router = express.Router();
const Log = require('../models/log');

router.post('/offline-log', async (req, res) => {
    const { logs } = req.body;

    if (!Array.isArray(logs)) {
        return res.status(400).json({ error: 'Logs should be an array' });
    }

    try {
        const logEntries = logs.map(log => ({
            logId: log.logId,
            timestamp: log.timestamp,
            level: log.level,
            message: log.message,
            context: log.context || {}
