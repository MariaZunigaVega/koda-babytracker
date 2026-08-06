import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { FileText, Download } from 'lucide-react';
import '../App.css';
import { getSelectedChildForUser } from '../utils/authStorage';
import { API_URL } from '../config';

const HistoryPage = () => {
  const [historyItems, setHistoryItems] = useState([]);
  const [range, setRange] = useState('day');
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const childName = getSelectedChildForUser()?.name || 'Gracie';
        const response = await axios.get(`${API_URL}/api/activities?childName=${encodeURIComponent(childName)}`);
        const { feedings = [], sleeps = [], diapers = [] } = response.data;

        const merged = [
          ...feedings.map((item) => ({
            id: `feeding-${item._id || Math.random()}`,
            type: 'feeding',
            label: `feeding • ${item.type || 'N/A'}`,
            detail: item.amount ? `${item.amount} oz` : item.side && item.side !== 'N/A' ? item.side : 'logged',
            timestamp: item.timestamp,
          })),
          ...sleeps.map((item) => ({
            id: `sleep-${item._id || Math.random()}`,
            type: 'sleep',
            label: 'sleep',
            detail: `${item.quality || 'N/A'} • ${item.duration || 0} min`,
            timestamp: item.timestamp || item.endTime || item.startTime,
          })),
          ...diapers.map((item) => ({
            id: `diaper-${item._id || Math.random()}`,
            type: 'diaper',
            label: 'diaper',
            detail: item.type || 'logged',
            timestamp: item.timestamp,
          })),
        ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        setHistoryItems(merged);
      } catch (error) {
        console.error('Could not load history', error);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  const aiSummary = useMemo(() => {
    const feedingCount = historyItems.filter((item) => item.type === 'feeding').length;
    const sleepCount = historyItems.filter((item) => item.type === 'sleep').length;
    const diaperCount = historyItems.filter((item) => item.type === 'diaper').length;

    if (!historyItems.length) {
      return 'No activity history yet. Start logging entries to build the report.';
    }

    return `AI-guided review: ${feedingCount} feedings, ${sleepCount} sleep records, and ${diaperCount} diaper updates captured. The history shows a steady routine with recent entries ready for export.`;
  }, [historyItems]);

  const handleExport = async () => {
    try {
      setExporting(true);
      const childName = getSelectedChildForUser()?.name || 'Gracie';
      const token = localStorage.getItem('token');

      const response = await axios.post(
        `${API_URL}/api/reports/generate`,
        { childName, range },
        {
          headers: { 'x-auth-token': token },
          responseType: 'blob',
        }
      );

      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.download = `${childName}-${range}-report.pdf`;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Could not export report', error);
      alert('Unable to create the PDF right now. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  const pageStyle = {
    backgroundImage: `url(${process.env.PUBLIC_URL}/lightmode.jpg)`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundAttachment: 'fixed',
  };

  return (
    <div className="history-page" style={pageStyle}>
      <div className="history-shell">
        <div className="history-card">
          <div className="card-header">
            <FileText size={24} strokeWidth={2} />
            <span>activity history</span>
          </div>
          <p className="empty-msg-light" style={{ marginTop: '10px' }}>{aiSummary}</p>
        </div>

        <div className="history-card">
          <div className="history-controls">
            <h3 className="history-section-title">log history</h3>
            <select className="history-select" value={range} onChange={(event) => setRange(event.target.value)}>
              <option value="day">daily report</option>
              <option value="week">weekly report</option>
            </select>
          </div>

          {loading ? (
            <p className="empty-msg-light">loading history…</p>
          ) : historyItems.length > 0 ? (
            <div className="history-list">
              {historyItems.map((item) => (
                <div key={item.id} className="history-item">
                  <strong>{item.label}</strong>
                  <div className="empty-msg-light">{item.detail}</div>
                  <div className="empty-msg-light">{new Date(item.timestamp).toLocaleString()}</div>
                </div>
              ))}
            </div>
          ) : (
            <p className="empty-msg-light">No history yet. Add entries and export a report from here.</p>
          )}
        </div>

        <div className="footer-export">
          <button type="button" className="export-btn" onClick={handleExport} disabled={exporting}>
            <Download size={18} style={{ marginRight: '8px' }} />
            {exporting ? 'creating pdf…' : 'export pdf'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default HistoryPage;
