// Reports and PDF generation (HIPAA: ensure BAA with AI provider before sending PHI)
const express = require('express');
const router = express.Router();
const Feeding = require('../model/feeding');
const Sleep = require('../model/sleep');
const Diaper = require('../model/diaper');
const PDFDocument = require('pdfkit');
const axios = require('axios');

// Helper: build filter by date range
function buildDateFilter(startDate, endDate) {
  const filter = {};
  if (startDate || endDate) {
    filter.timestamp = {};
    if (startDate) filter.timestamp.$gte = new Date(startDate);
    if (endDate) filter.timestamp.$lte = new Date(endDate);
  }
  return filter;
}

// Local simple summarizer (fallback when AI provider not configured)
function localSummarize({ feedings, sleeps, diapers }) {
  const feedingCount = feedings.length;
  const diaperCount = diapers.length;
  const sleepCount = sleeps.length;
  let totalSleepMin = 0;
  sleeps.forEach(s => {
    if (s.duration) totalSleepMin += s.duration;
    else if (s.startTime && s.endTime) totalSleepMin += (new Date(s.endTime) - new Date(s.startTime)) / (1000 * 60);
  });
  return {
    feedingCount,
    diaperCount,
    sleepCount,
    totalSleepMin: Math.round(totalSleepMin),
    note: 'This summary was generated locally. Configure a HIPAA-compliant AI provider (with a signed BAA) to enable richer analysis.'
  };
}

// GET /pdf?childName=...&startDate=...&endDate=...&period=daily|weekly|all
router.get('/pdf', async (req, res) => {
  try {
    const { childName, startDate: qStart, endDate: qEnd, period } = req.query;

    // compute date range from period if provided
    let startDate = qStart;
    let endDate = qEnd;
    if (period === 'daily') {
      const d = new Date();
      startDate = new Date(d.getFullYear(), d.getMonth(), d.getDate()).toISOString();
      endDate = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59).toISOString();
    } else if (period === 'weekly') {
      const now = new Date();
      const first = new Date(now.setDate(now.getDate() - now.getDay())); // sunday
      startDate = new Date(first.getFullYear(), first.getMonth(), first.getDate()).toISOString();
      const last = new Date(startDate);
      last.setDate(last.getDate() + 6);
      endDate = new Date(last.getFullYear(), last.getMonth(), last.getDate(), 23, 59, 59).toISOString();
    }

    const childFilter = childName ? { childName } : {};
    const dateFilter = buildDateFilter(startDate, endDate);
    // merge filters
    const feedFilter = { ...childFilter, ...dateFilter };
    const sleepFilter = { ...childFilter, ...dateFilter };
    const diaperFilter = { ...childFilter, ...dateFilter };

    const [feedings, sleeps, diapers] = await Promise.all([
      Feeding.find(feedFilter).sort({ timestamp: -1 }).lean(),
      Sleep.find(sleepFilter).sort({ timestamp: -1 }).lean(),
      Diaper.find(diaperFilter).sort({ timestamp: -1 }).lean(),
    ]);

    // Prepare structured activities for analysis
    const activities = {
      feedings: feedings.map(f => ({ type: f.type, amount: f.amount, side: f.side, timestamp: f.timestamp })),
      sleeps: sleeps.map(s => ({ startTime: s.startTime, endTime: s.endTime, duration: s.duration, quality: s.quality, timestamp: s.timestamp })),
      diapers: diapers.map(d => ({ type: d.type, timestamp: d.timestamp })),
    };

    let analysis = null;

    // If AI provider configured, send minimal necessary data for analysis. WARNING: ensure the provider is HIPAA-compliant and you have a signed BAA.
    if (process.env.AI_API_URL && process.env.AI_API_KEY && process.env.AI_PROVIDER_HIPAA_COMPLIANT === 'true') {
      try {
        // Send only the activity records; omit explicit patient identifiers when possible.
        const aiPayload = {
          prompt: `Provide a concise, clinically neutral summary and observations for the following infant care activities. Output JSON with sections: key_findings, recommendations, highlights. Return plain JSON.`,
          data: activities,
        };
        const aiResp = await axios.post(process.env.AI_API_URL, aiPayload, {
          headers: {
            'Authorization': `Bearer ${process.env.AI_API_KEY}`,
            'Content-Type': 'application/json'
          },
          timeout: 20000
        });
        analysis = aiResp.data;
      } catch (aiErr) {
        console.error('AI analysis failed or timed out:', aiErr.message);
        analysis = { error: 'AI analysis failed; showing local summary instead.' };
      }
    }

    if (!analysis) {
      analysis = localSummarize(activities);
    }

    // Build PDF
    res.setHeader('Content-Type', 'application/pdf');
    const filename = `koda-logs-${childName ? childName.replace(/\s+/g, '-') : 'all'}-${new Date().toISOString().slice(0,10)}.pdf`;
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    const doc = new PDFDocument({ margin: 50 });
    doc.pipe(res);

    // Header
    doc.fontSize(20).text('Koda - Activity Report', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Child: ${childName || 'All'}    Generated: ${new Date().toLocaleString()}`);
    if (startDate || endDate) doc.text(`Range: ${startDate || '...'} - ${endDate || '...'}`);
    doc.moveDown();

    // AI Analysis / Summary
    doc.fontSize(14).text('Summary & Analysis', { underline: true });
    doc.moveDown(0.5);
    if (typeof analysis === 'string') {
      doc.fontSize(12).text(analysis);
    } else if (analysis.error) {
      doc.fontSize(12).text(analysis.error);
    } else if (analysis.key_findings || analysis.feedingCount) {
      // If AI returned structured JSON
      if (analysis.key_findings) {
        doc.fontSize(12).text('Key findings:', { continued: false });
        doc.fontSize(10).text(JSON.stringify(analysis.key_findings, null, 2));
        doc.moveDown();
      } else {
        // local summary shape
        doc.fontSize(12).text(`Feedings: ${analysis.feedingCount}`);
        doc.fontSize(12).text(`Diaper changes: ${analysis.diaperCount}`);
        doc.fontSize(12).text(`Sleep entries: ${analysis.sleepCount} (Total minutes: ${analysis.totalSleepMin})`);
        doc.moveDown();
        if (analysis.note) doc.fontSize(10).text(analysis.note);
      }
    } else {
      doc.fontSize(12).text(JSON.stringify(analysis, null, 2));
    }

    doc.addPage();
    doc.fontSize(14).text('Detailed Activity Log', { underline: true });
    doc.moveDown(0.5);

    // Helper to render lists
    function renderList(title, items, renderItem) {
      doc.fontSize(12).text(title, { continued: false });
      doc.moveDown(0.2);
      if (!items || items.length === 0) {
        doc.fontSize(10).text('No entries.');
        doc.moveDown(0.5);
        return;
      }
      items.forEach(it => {
        renderItem(it);
        doc.moveDown(0.2);
      });
      doc.moveDown(0.4);
    }

    renderList('Feedings', feedings, f => {
      const t = f.timestamp ? new Date(f.timestamp).toLocaleString() : '';
      doc.fontSize(11).text(`- ${t}  |  ${f.type || ''}${f.amount ? ` - ${f.amount} oz` : ''}${f.side && f.side !== 'N/A' ? ` (${f.side})` : ''}`);
    });

    renderList('Sleeps', sleeps, s => {
      const st = s.startTime ? new Date(s.startTime).toLocaleString() : '';
      const et = s.endTime ? new Date(s.endTime).toLocaleString() : '';
      doc.fontSize(11).text(`- ${st} - ${et}  |  quality: ${s.quality || 'N/A'}  | duration: ${s.duration || ''} mins`);
    });

    renderList('Diaper Changes', diapers, d => {
      const t = d.timestamp ? new Date(d.timestamp).toLocaleString() : '';
      doc.fontSize(11).text(`- ${t}  |  ${d.type || 'N/A'}`);
    });

    doc.end();

  } catch (err) {
    console.error('Report generation failed:', err);
    res.status(500).json({ error: 'Report generation failed.' });
  }
});

module.exports = router;
