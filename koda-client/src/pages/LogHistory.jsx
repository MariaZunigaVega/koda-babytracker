import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { API_URL } from '../config';
import '../App.css';
import { getSelectedChildForUser } from '../utils/authStorage';

const LogHistory = () => {
  const [activities, setActivities] = useState({ feedings: [], sleeps: [], diapers: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const childName = getSelectedChildForUser()?.name || '';
        const res = await axios.get(`${API_URL}/api/activities?childName=${encodeURIComponent(childName)}`);
        setActivities(res.data);
      } catch (err) {
        console.error('Failed to load activities', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  const generatePDF = async (period) => {
    try {
      const childName = getSelectedChildForUser()?.name || '';
      const url = `${API_URL}/api/reports/pdf?childName=${encodeURIComponent(childName)}${period ? `&period=${period}` : ''}`;
      const resp = await axios.get(url, { responseType: 'blob' });
      const blob = new Blob([resp.data], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = `koda-logs-${childName || 'all'}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('Failed to generate PDF', err);
      alert('Failed to generate PDF. Check console for details.');
    }
  };

  return (
    <div className="dashboard-container" style={{ paddingTop: '120px' }}>
      <div className="glass-card first-card">
        <div className="card-header"><span>Activity History</span></div>
        {loading ? <p className="empty-msg-light">Loading...</p> : (
          <div>
            <h4>Feedings</h4>
            {activities.feedings.length === 0 && <p className="empty-msg-light">No feedings</p>}
            {activities.feedings.map((f, i) => (
              <p key={`f-${i}`} className="empty-msg-light">{new Date(f.timestamp).toLocaleString()} - {f.type} {f.amount ? `- ${f.amount} oz` : ''} {f.side && f.side !== 'N/A' ? `(${f.side})` : ''}</p>
            ))}

            <h4>Sleeps</h4>
            {activities.sleeps.length === 0 && <p className="empty-msg-light">No sleeps</p>}
            {activities.sleeps.map((s, i) => (
              <p key={`s-${i}`} className="empty-msg-light">{s.startTime ? `${new Date(s.startTime).toLocaleString()} - ${new Date(s.endTime).toLocaleString()}` : new Date(s.timestamp).toLocaleString()} {s.quality ? `(${s.quality})` : ''}</p>
            ))}

            <h4>Diapers</h4>
            {activities.diapers.length === 0 && <p className="empty-msg-light">No diapers</p>}
            {activities.diapers.map((d, i) => (
              <p key={`d-${i}`} className="empty-msg-light">{new Date(d.timestamp).toLocaleString()} - {d.type}</p>
            ))}
          </div>
        )}
      </div>

      {/* Bottom export controls */}
      <div style={{ position: 'fixed', bottom: 12, left: 12, right: 12, display: 'flex', justifyContent: 'center', gap: 12 }}>
        <button className="glass-card save-btn-card" onClick={() => generatePDF('daily')}>Export Daily PDF</button>
        <button className="glass-card save-btn-card" onClick={() => generatePDF('weekly')}>Export Weekly PDF</button>
        <button className="glass-card save-btn-card" onClick={() => generatePDF()}>Export Full PDF</button>
      </div>
    </div>
  );
};

export default LogHistory;
