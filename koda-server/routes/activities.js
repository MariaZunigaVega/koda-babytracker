//mdz0019
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const PDFDocument = require('pdfkit');
const Feeding = require('../model/feeding');
const Sleep = require('../model/sleep');
const Diaper = require('../model/diaper');

const authMiddleware = (req, res, next) => {
    const token = req.header('x-auth-token');
    if (!token) {
        return res.status(401).json({ msg: 'No token, authorization denied' });
    }

    try {
        req.user = jwt.verify(token, process.env.JWT_SECRET);
        next();
    } catch (err) {
        return res.status(401).json({ msg: 'Token is not valid' });
    }
};

const getRangeWindow = (range) => {
    const now = new Date();
    const start = new Date(now);

    if (range === 'week') {
        start.setDate(now.getDate() - 6);
        start.setHours(0, 0, 0, 0);
    } else {
        start.setHours(0, 0, 0, 0);
    }

    return { start, end: now };
};

const filterByRange = (items, range) => {
    const { start, end } = getRangeWindow(range);
    return items.filter((item) => {
        const timestamp = new Date(item.timestamp || item.startTime || item.endTime || item.createdAt || Date.now());
        return timestamp >= start && timestamp <= end;
    });
};
// Calculates sleep duration statistics for AI report analysis
const calculateSleepDuration = (sleeps) => {
    if (!sleeps || sleeps.length === 0) {
        return {
            totalMinutes: 0,
            averageMinutes: 0,
            longestMinutes: 0,
            shortestMinutes: 0
        };
    }

    const durations = sleeps
        .map((sleep) => Number(sleep.duration))
        .filter((duration) => !isNaN(duration) && duration >= 0);

    if (durations.length === 0) {
        return {
            totalMinutes: 0,
            averageMinutes: 0,
            longestMinutes: 0,
            shortestMinutes: 0
        };
    }

    const totalMinutes = durations.reduce(
        (total, duration) => total + duration,
        0
    );

    return {
        totalMinutes,
        averageMinutes: Math.round(totalMinutes / durations.length),
        longestMinutes: Math.max(...durations),
        shortestMinutes: Math.min(...durations)
    };
};
// Calculates how often feeding, sleep, and diaper activities occur
const calculateActivityFrequency = ({ feedings, sleeps, diapers, range }) => {
    const daysInRange = range === 'week' ? 7 : 1;

    const feedingCount = feedings.length;
    const sleepCount = sleeps.length;
    const diaperCount = diapers.length;

    return {
        feedingCount,
        sleepCount,
        diaperCount,

        totalActivities:
            feedingCount + sleepCount + diaperCount,

        feedingPerDay:
            Number((feedingCount / daysInRange).toFixed(1)),

        sleepPerDay:
            Number((sleepCount / daysInRange).toFixed(1)),

        diaperPerDay:
            Number((diaperCount / daysInRange).toFixed(1))
    };
};
const buildAiAnalysis = ({ feedings, sleeps, diapers, range, childName }) => {
    const lines = [];
    lines.push(`AI-guided summary for ${childName}`);
    lines.push(`This ${range === 'week' ? 'weekly' : 'daily'} report highlights the latest routine patterns.`);

    if (feedings.length === 0 && sleeps.length === 0 && diapers.length === 0) {
        lines.push('No activity entries were recorded in the selected period, so there is not enough data to infer a meaningful routine yet.');
        return lines.join('\n');
    }
    const frequencyStats = calculateActivityFrequency({
        feedings,
        sleeps,
        diapers,
        range
    });

    lines.push('Activity frequency:');

    if (range === 'week') {
        lines.push(
            `Feeding: ${frequencyStats.feedingCount} entries, averaging ${frequencyStats.feedingPerDay} per day.`
        );

        lines.push(
            `Sleep: ${frequencyStats.sleepCount} entries, averaging ${frequencyStats.sleepPerDay} per day.`
        );

        lines.push(
            `Diaper changes: ${frequencyStats.diaperCount} entries, averaging ${frequencyStats.diaperPerDay} per day.`
        );
    } else {
        lines.push(
            `Feeding: ${frequencyStats.feedingCount} entries today.`
        );

        lines.push(
            `Sleep: ${frequencyStats.sleepCount} entries today.`
        );

        lines.push(
            `Diaper changes: ${frequencyStats.diaperCount} entries today.`
        );
    }

    lines.push(
        `Total activities recorded: ${frequencyStats.totalActivities}.`
    );
    if (feedings.length > 0) {
        const latestAmount = feedings[0].amount || 'N/A';
        const feedingTrend = feedings.length >= 3 ? 'consistent' : 'light';
        lines.push(`Feeding activity looks ${feedingTrend}. The most recent entry was ${feedings[0].type || 'N/A'}${latestAmount !== 'N/A' ? ` with ${latestAmount}` : ''}.`);
    }

    if (sleeps.length > 0) {
        const sleepStats = calculateSleepDuration(sleeps);

        lines.push(
            `Sleep duration: ${sleepStats.totalMinutes} total minutes recorded across ${sleeps.length} sleep entries.`
        );

        lines.push(
            `The average sleep session was ${sleepStats.averageMinutes} minutes, with the longest session lasting ${sleepStats.longestMinutes} minutes and the shortest lasting ${sleepStats.shortestMinutes} minutes.`
        );
    }

    if (diapers.length > 0) {
        const diaperSummary = diapers.slice(0, 3).map((item) => item.type).join(', ');
        lines.push(`Diaper updates recorded: ${diaperSummary}.`);
    }

    lines.push('This summary is designed to help a parent quickly understand the child\'s recent routine without needing to read every raw log entry.');
    return lines.join('\n');
};

const buildReportText = ({ feedings, sleeps, diapers, range, childName }) => {
    const lines = [];
    lines.push(`Koda Activity Report`);
    lines.push(`Child: ${childName}`);
    lines.push(`Range: ${range}`);
    lines.push('');
    lines.push(`Feeding entries: ${feedings.length}`);
    lines.push(`Sleep entries: ${sleeps.length}`);
    lines.push(`Diaper entries: ${diapers.length}`);
    lines.push('');
    lines.push('AI-guided summary:');
    lines.push(buildAiAnalysis({ feedings, sleeps, diapers, range, childName }));
    lines.push('');
    lines.push('Highlights:');

    if (feedings.length > 0) {
        const latest = feedings[0];
        lines.push(`- Latest feeding: ${latest.type || 'N/A'}${latest.amount ? ` (${latest.amount})` : ''}`);
    }

    if (sleeps.length > 0) {
        const latest = sleeps[0];
        lines.push(`- Latest sleep: ${latest.quality || 'N/A'}${latest.duration ? ` (${latest.duration} min)` : ''}`);
    }

    if (diapers.length > 0) {
        const latest = diapers[0];
        lines.push(`- Latest diaper: ${latest.type || 'N/A'}`);
    }

    lines.push('');
    lines.push('Recent history:');
    feedings.slice(0, 3).forEach((item) => {
        lines.push(`- Feeding: ${item.type || 'N/A'} at ${new Date(item.timestamp).toLocaleString()}`);
    });
    sleeps.slice(0, 3).forEach((item) => {
        lines.push(`- Sleep: ${item.quality || 'N/A'} at ${new Date(item.timestamp).toLocaleString()}`);
    });
    diapers.slice(0, 3).forEach((item) => {
        lines.push(`- Diaper: ${item.type || 'N/A'} at ${new Date(item.timestamp).toLocaleString()}`);
    });

    return lines.join('\n');
};

//Feeding routes
router.post('/feeding', async (req, res) => {
    try {
        const feeding = new Feeding(req.body);
        await feeding.save();
        res.status(201).json(feeding);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

//Sleep routes
router.post('/sleep', async (req, res) => {
    try {
        const sleep = new Sleep(req.body);
        await sleep.save();
        res.status(201).json(sleep);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

//Diaper routes
router.post('/diaper', async (req, res) => {
    try {
        const diaper = new Diaper(req.body);
        await diaper.save();
        res.status(201).json(diaper);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

//GET all activities
router.get('/activities', async (req, res) => {
    try {
        const childName = req.query.childName;
        const filter = childName ? { childName } : {};

        const feedings = await Feeding.find(filter).sort({ timestamp: -1 });
        const sleeps = await Sleep.find(filter).sort({ timestamp: -1 });
        const diapers = await Diaper.find(filter).sort({ timestamp: -1 });

        res.json({ feedings, sleeps, diapers });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/reports/generate', authMiddleware, async (req, res) => {
    try {
        const childName = req.body.childName || 'Baby';
        const range = req.body.range || 'day';
        const filter = childName ? { childName } : {};

        const feedings = await Feeding.find(filter).sort({ timestamp: -1 });
        const sleeps = await Sleep.find(filter).sort({ timestamp: -1 });
        const diapers = await Diaper.find(filter).sort({ timestamp: -1 });

        const scopedFeedings = filterByRange(feedings, range);
        const scopedSleeps = filterByRange(sleeps, range);
        const scopedDiapers = filterByRange(diapers, range);

        const doc = new PDFDocument({ margin: 36 });
        const reportText = buildReportText({ feedings: scopedFeedings, sleeps: scopedSleeps, diapers: scopedDiapers, range, childName });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${childName}-${range}-report.pdf"`);

        doc.pipe(res);
        doc.fontSize(20).text('Koda Activity Report', { underline: true });
        doc.moveDown();
        doc.fontSize(12).text(reportText);
        doc.end();
    } catch (err) {
        console.error('Report generation error:', err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;

