import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { FileText, Download, Moon, Milk, Baby } from 'lucide-react';
import '../App.css';
import { getSelectedChildForUser } from '../utils/authStorage';
import { API_URL } from '../config';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
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

  const filteredHistoryItems = useMemo(() => {
    const now = new Date();
    const start = new Date(now);

    if (range === 'week') {
      start.setDate(now.getDate() - 6);
      start.setHours(0, 0, 0, 0);
    } else {
      start.setHours(0, 0, 0, 0);
    }

    return historyItems.filter((item) => {
      const itemDate = new Date(item.timestamp);
      return itemDate >= start && itemDate <= now;
    });
  }, [historyItems, range]);

  const aiSummary = useMemo(() => {
    const feedingCount = filteredHistoryItems.filter((item) => item.type === 'feeding').length;
    const sleepCount = filteredHistoryItems.filter((item) => item.type === 'sleep').length;
    const diaperCount = filteredHistoryItems.filter((item) => item.type === 'diaper').length;

    if (!filteredHistoryItems.length) {
      return 'No activity history yet. Start logging entries to build the report.';
    }

    return `AI-guided review: ${feedingCount} feedings, ${sleepCount} sleep records, and ${diaperCount} diaper updates captured. The history shows a steady routine with recent entries ready for export.`;
  }, [filteredHistoryItems]);

  const quickStats = useMemo(() => {
    const sleepItems = filteredHistoryItems.filter(
      (item) => item.type === 'sleep'
    );

    const feedingItems = filteredHistoryItems.filter(
      (item) => item.type === 'feeding'
    );

    const diaperItems = filteredHistoryItems.filter(
      (item) => item.type === 'diaper'
    );

    const totalSleepMinutes = sleepItems.reduce((total, item) => {
      const match = item.detail.match(/(\d+)\s*min/);
      const duration = match ? Number(match[1]) : 0;
      return total + duration;
    }, 0);

    return {
      totalSleepMinutes,
      sleepCount: sleepItems.length,
      feedingCount: feedingItems.length,
      diaperCount: diaperItems.length
    };
  }, [filteredHistoryItems]);

  const sleepChartData = useMemo(() => {
    const sleepItems = filteredHistoryItems.filter(
      (item) => item.type === 'sleep'
    );

    if (range === 'day') {
      return sleepItems.map((item, index) => {
        const match = item.detail.match(/(\d+)\s*min/);
        const duration = match ? Number(match[1]) : 0;

        return {
          label: `Sleep ${index + 1}`,
          minutes: duration
        };
      });
    }

    const dailySleep = {};

    sleepItems.forEach((item) => {
      const date = new Date(item.timestamp);

      const day = date.toLocaleDateString('en-US', {
        weekday: 'short'
      });

      const match = item.detail.match(/(\d+)\s*min/);
      const duration = match ? Number(match[1]) : 0;

      dailySleep[day] = (dailySleep[day] || 0) + duration;
    });

    return Object.entries(dailySleep).map(([day, minutes]) => ({
      label: day,
      minutes
    }));
  }, [filteredHistoryItems, range]);

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
  const formatMinutes = (minutes) => {
    if (minutes < 60) {
      return `${minutes} min`;
    }

    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    if (remainingMinutes === 0) {
      return `${hours} hr`;
    }

    return `${hours} hr ${remainingMinutes} min`;
  };

  return (
    <div className="history-page" style={pageStyle}>
      <div className="history-shell">
        <div className="history-report-header">
          <h2>log history</h2>

          <select
            className="history-select"
            value={range}
            onChange={(event) => setRange(event.target.value)}
          >
            <option value="day">daily report</option>
            <option value="week">weekly report</option>
          </select>
        </div>
        <div className="history-card">
          <div className="card-header">
            <FileText size={24} strokeWidth={2} />
            <span>activity history</span>
          </div>
          <p className="empty-msg-light" style={{ marginTop: '10px' }}>{aiSummary}</p>
        </div>

        <div className="history-card">
          <h3 className="history-section-title">quick stats</h3>

          <div className="quick-stats-grid">

            <div className="quick-stat-card">
              <Moon size={24} />
              <strong>{formatMinutes(quickStats.totalSleepMinutes)}</strong>
              <span>total sleep</span>
            </div>

            <div className="quick-stat-card">
              <Moon size={24} />
              <strong>{quickStats.sleepCount}</strong>
              <span>sleep sessions</span>
            </div>

            <div className="quick-stat-card">
              <Milk size={24} />
              <strong>{quickStats.feedingCount}</strong>
              <span>feedings</span>
            </div>

            <div className="quick-stat-card">
              <Baby size={24} />
              <strong>{quickStats.diaperCount}</strong>
              <span>diaper changes</span>
            </div>

          </div>
        </div>

        <div className="history-card">
          <h3 className="history-section-title">
            sleep duration by day
          </h3>

          {sleepChartData.length > 0 ? (
            <div className="history-chart">
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={sleepChartData}>
                  <XAxis dataKey="label" />
                  <YAxis />
                  <Tooltip
                    formatter={(value) => [formatMinutes(value), 'Sleep duration']}
                  />
                  <Bar
                    dataKey="minutes"
                    radius={[8, 8, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="empty-msg-light">
              No sleep data for this period.
            </p>
          )}
        </div>

        <div className="history-card">
          <div className="history-controls">
            <h3 className="history-section-title">log history</h3>
          </div>

          {loading ? (
            <p className="empty-msg-light">loading history…</p>
          ) : filteredHistoryItems.length > 0 ? (
            <div className="history-list">
              {filteredHistoryItems.map((item) => (
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
