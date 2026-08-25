import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ChevronDown, X, Save, Milk, Moon, Baby, Puzzle, Smile, ChevronRight } from 'lucide-react';
import '../App.css';
import { getSelectedChildForUser } from '../utils/authStorage';
import { API_URL } from "../config";

const Activities = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [type, setType] = useState('');
  const [value, setValue] = useState('');
  const [feedingAmount, setFeedingAmount] = useState('');
  const [feedingType, setFeedingType] = useState('');
  const [feedingSide, setFeedingSide] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [quality, setQuality] = useState('');
  const [diaperType, setDiaperType] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const childName = getSelectedChildForUser()?.name || "Gracie";
      console.log("SELECTED CHILD:", childName);

      if (type === 'sleep') {
        console.log("SENDING SLEEP:", { childName, startTime, endTime, quality });
        const today = new Date().toISOString().split('T')[0];

        const sleepStart = new Date(`${today}T${startTime}`);
        const sleepEnd = new Date(`${today}T${endTime}`);

        const duration = Math.round((sleepEnd - sleepStart) / (1000 * 60));

        await axios.post(`${API_URL}/api/sleep`, {
          childName,
          startTime: sleepStart,
          endTime: sleepEnd,
          duration,
          quality,
          timestamp: new Date(),
        });
      } else if (type === 'feeding') {
        await axios.post(`${API_URL}/api/feeding`, {
          childName,
          type: feedingType,
          amount: feedingAmount ? Number(feedingAmount) : undefined,
          side: feedingSide || 'N/A',
          timestamp: new Date(),
        });

      } else if (type === 'diaper') {
        await axios.post(`${API_URL}/api/diaper`, {
          childName,
          type: diaperType,
          timestamp: new Date(),
        });
      }

      navigate('/ParentDashboard');
    } catch (err) {
      console.error("Error saving activity:", err);
    }
  };

  const backgroundStyle = {
    backgroundImage: `url(${process.env.PUBLIC_URL + "/lightmode.jpg"})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    minHeight: '100vh',
    width: '100vw',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    paddingTop: '80px'
  };

  return (
    <div className="dashboard-container" style={backgroundStyle}>

      {/* Header with Close Button */}
      <header className="dashboard-header">
        <img src="/koda-logo.png" alt="Koda" className="koda-logo" />
        <h2 style={{ fontFamily: 'Londrina Solid', fontSize: '28px', margin: 0 }}>log activity</h2>
        <X
          size={28}
          className="nav-icon"
          onClick={() => {
            if (step === 2) {
              setStep(1);
              setType('');
            } else {
              navigate('/parentDashboard');
            }
          }}
        />
      </header>

      <form onSubmit={handleSubmit} style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>

        {/* Dropdown Card */}
        {step === 1 && (
          <div className="glass-card first-card activity-picker-card">
            <div className="card-header activity-picker-header">
              <span>activity log</span>
            </div>

            <p className="activity-picker-subtitle">
              what would you like to log?
            </p>

            <div className="activity-grid">
              <button
                type="button"
                className="activity-tile"
                onClick={() => {
                  setType('feeding');
                  setStep(2);
                }}
              >
                <Milk size={30} />
                <span>feeding</span>
                <ChevronRight size={20} />
              </button>

              <button
                type="button"
                className="activity-tile"
                onClick={() => {
                  setType('sleep');
                  setStep(2);
                }}
              >
                <Moon size={30} />
                <span>sleeping</span>
                <ChevronRight size={20} />
              </button>

              <button
                type="button"
                className="activity-tile"
                onClick={() => {
                  setType('diaper');
                  setStep(2);
                }}
              >
                <Baby size={30} />
                <span>diaper change</span>
                <ChevronRight size={20} />
              </button>

              <button
                type="button"
                className="activity-tile"
                onClick={() => {
                  setType('playtime');
                  setStep(2);
                }}
              >
                <Puzzle size={30} />
                <span>playtime</span>
                <ChevronRight size={20} />
              </button>

              <button
                type="button"
                className="activity-tile activity-tile-wide"
                onClick={() => {
                  setType('mood');
                  setStep(2);
                }}
              >
                <Smile size={30} />
                <span>mood</span>
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <>
            {/* Details Input Card */}

            <div className="glass-card" style={{ marginTop: '24px' }}>
              
              {type === 'sleep' ? (
                // Sleep fields
                <div className="log-form-container">

                  <div className="log-form-title">
                    <Moon size={26} />
                    <span>sleep</span>
                  </div>

                  <p className="log-form-subtitle">
                    track your baby's sleep
                  </p>

                  <div className="log-field-group">
                    <label className="log-label">start time</label>

                    <div className="log-input-wrapper">
                      <input
                        type="time"
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                        className="log-input"
                        required
                      />
                    </div>
                  </div>

                  <div className="log-field-group">
                    <label className="log-label">end time</label>

                    <div className="log-input-wrapper">
                      <input
                        type="time"
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                        className="log-input"
                        required
                      />
                    </div>
                  </div>

                  <div className="log-field-group">
                    <label className="log-label">quality</label>

                    <div className="log-option-row">
                      {['Good', 'Fair', 'Poor'].map((option) => (
                        <button
                          key={option}
                          type="button"
                          className={`log-option-btn ${quality === option ? 'selected' : ''
                            }`}
                          onClick={() => setQuality(option)}
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  </div>

                </div>

              ) : type === 'feeding' ? (
                // Feeding fields
                <div className="log-form-container">

                  <div className="log-form-title">
                    <Milk size={26} />
                    <span>feeding</span>
                  </div>

                  <p className="log-form-subtitle">
                    track your baby's feeding
                  </p>

                  <div className="log-field-group">
                    <label className="log-label">feeding type</label>

                    <div className="log-option-row">
                      {['Breast', 'Bottle', 'Solids'].map((option) => (
                        <button
                          key={option}
                          type="button"
                          className={`log-option-btn ${feedingType === option ? 'selected' : ''
                            }`}
                          onClick={() => setFeedingType(option)}
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="log-field-group">
                    <label className="log-label">amount (oz)</label>

                    <div className="log-input-wrapper">
                      <Milk size={18} />
                      <input
                        type="number"
                        value={feedingAmount}
                        onChange={(e) => setFeedingAmount(e.target.value)}
                        className="log-input"
                        placeholder="e.g. 4"
                        min="0"
                      />
                    </div>
                  </div>

                  <div className="log-field-group">
                    <label className="log-label">side</label>

                    <div className="log-option-row">
                      {['Left', 'Right', 'N/A'].map((option) => (
                        <button
                          key={option}
                          type="button"
                          className={`log-option-btn ${feedingSide === option ? 'selected' : ''
                            }`}
                          onClick={() => setFeedingSide(option)}
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  </div>

                </div>
              ) : type === 'diaper' ? (
                // Diaper fields
                <div className="log-form-container">

                  <div className="log-form-title">
                    <Baby size={26} />
                    <span>diaper change</span>
                  </div>

                  <p className="log-form-subtitle">
                    track your baby's diaper change
                  </p>

                  <div className="log-field-group">
                    <label className="log-label">diaper type</label>

                    <div className="log-option-row">
                      {['Wet', 'Dirty', 'Mixed'].map((option) => (
                        <button
                          key={option}
                          type="button"
                          className={`log-option-btn ${diaperType === option ? 'selected' : ''
                            }`}
                          onClick={() => setDiaperType(option)}
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  </div>

                </div>
              ) : (
                <input
                  type="text"
                  className="empty-msg-light activity-input"
                  placeholder="Enter details"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  required
                />
              )}
            </div>

            {/* Save Button Styled like a Glass Card */}
            <button type="submit" className="glass-card save-btn-card">
              <Save size={24} />
              <span>save entry</span>
            </button>
          </>
        )}

      </form>
    </div>
  );
};

export default Activities;