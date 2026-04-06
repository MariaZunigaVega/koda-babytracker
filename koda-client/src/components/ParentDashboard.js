import React, { useEffect, useState } from 'react';
import { 
  Bell, ClipboardList, User, Home, 
  PlusSquare, BarChart2, MessageCircle, Settings,
  ChevronDown 
} from 'lucide-react'; 
import '../App.css';

const ParentDashboard = () => {
  //placeholder for now, basically empty
  const [activities, setActivities] = useState({ feedings: [], sleeps: [], diapers: [] }); 
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('http://localhost:5000/api/activities')
      .then(res => res.json())
      .then(data => {
        setActivities(data);
        setLoading(false);
      });
  }, []);

  const addActivity = async (type, details) => {
    const res = fetch(`http://localhost:5000/api/${type}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(details)
    });
    const newLog = await res.json();

    setActivities(prev => ({ 
      ...prev, ['${type}s']: [newLog, ...prev['${type}s']] 
    }));
  };

  const [caregivers] = useState([]);

  return (
    <div className="dashboard-container" style={{ backgroundImage: `url('/lightmode.jpg')` }}>
      
      <header className="dashboard-header">
        <img src="/koda-logo.png" alt="Koda" className="koda-logo" />
        
        {/* Child Name Dropdown Button */}
        <button className="name-dropdown-btn">
          Gracie <ChevronDown size={20} strokeWidth={2.5} />
        </button>

        <Bell size={28} strokeWidth={1.5} className="nav-icon" />
      </header>

      <div className="glass-card first-card">
        <div className="card-header">
          <ClipboardList size={24} strokeWidth={2} />
          <span>todays activities</span>
        </div>
        
        <div className="activities-list">
          {loading ? <p>Loading...</p> : (
            <>
              {activities.feedings.map(f => <div key={f._id}>🍼Fed {f.amount}oz</div>)}
              {activities.sleeps.map(s => <div key={s._id}>😴 Slept for {s.duration} mins</div>)}
              {activities.diapers.map(d => <div key={d._id}>💩 Diaper: {d.type}</div>)}
            </>
          )}
      </div>
      </div>
      <div className="glass-card">
        <div className="card-header">
          <User size={24} strokeWidth={2} />
          <span>caregivers</span>
        </div>
        
        <p className="empty-msg-light">No caregivers yet. Add a caregiver to share the load!</p>
      </div>

      <img src="/bear-character.png" alt="Koda Bear" className="bear-character" />

      <nav className="bottom-nav">
        <Home size={28} strokeWidth={1.5} className="nav-icon" />
        <PlusSquare size={36} strokeWidth={1.5} className="nav-icon plus-btn" />
        <BarChart2 size={28} strokeWidth={1.5} className="nav-icon" />
        <MessageCircle size={28} strokeWidth={1.5} className="nav-icon" />
        <Settings size={28} strokeWidth={1.5} className="nav-icon" />
      </nav>
    </div>
  );
};

export default ParentDashboard;
