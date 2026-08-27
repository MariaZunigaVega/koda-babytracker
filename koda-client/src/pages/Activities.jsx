import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

import { ChevronDown, X, Save, Milk, Moon, Baby, Puzzle, Smile, ChevronRight, Clock, Calendar } from 'lucide-react';
import '../App.css';
import '../styling/App.css';
import '../styling/activities.css';

import { getSelectedChildForUser } from '../utils/authStorage';
import { API_URL } from "../config";
import Layout from '../components/Layout';

const ACTIVITY_OPTIONS = [
  { type: 'feeding', label: 'feeding' },
  { type: 'sleep', label: 'sleeping' },
  { type: 'diaper', label: 'diaper change' },
  { type: 'playtime', label: 'playtime' },
  { type: 'mood', label: 'mood' },
];

const DAYS_OF_WEEK = [
  { key: 'Sunday', short: 'Su' },
  { key: 'Monday', short: 'Mo' },
  { key: 'Tuesday', short: 'Tu' },
  { key: 'Wednesday', short: 'We' },
  { key: 'Thursday', short: 'Th' },
  { key: 'Friday', short: 'Fr' },
  { key: 'Saturday', short: 'Sa' },
];

const Activities = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [type, setType] = useState('');
  const [mode, setMode] = useState('');

  const [value, setValue] = useState('');
  const [feedingAmount, setFeedingAmount] = useState('');
  const [feedingType, setFeedingType] = useState('');
  const [feedingSide, setFeedingSide] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [quality, setQuality] = useState('');
  const [diaperType, setDiaperType] = useState('');

  const [repeat, setRepeat] = useState('once');
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');
  const [repeatDays, setRepeatDays] = useState([]);

  const toggleRepeatDay = (day) => {
    setRepeatDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const handleBack = () => {
    if (step === 3) {
      setStep(2);
    } else if (step === 2) {
      setStep(1);
      setType('');
      setMode('');
    }
  };

  const buildActivityDetails = () => {
    if (type === 'sleep') {
      return { startTime, endTime, quality };
    }
    if (type === 'feeding') {
      return {
        type: feedingType,
        amount: feedingAmount ? Number(feedingAmount) : undefined,
        side: feedingSide || 'N/A',
      };
    }
    if (type === 'diaper') {
      return { type: diaperType };
    }
    return { value };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const childName = getSelectedChildForUser()?.name || "Gracie";

      if (mode === 'schedule') {
        await axios.post(`${API_URL}/api/schedule`, {
          childName,
          activityType: type,
          repeat,
          time: scheduleTime,
          ...(repeat === 'once' ? { date: scheduleDate } : {}),
          ...(repeat === 'weekly' ? { daysOfWeek: repeatDays } : {}),
          details: buildActivityDetails(),
        });
      } else if (type === 'sleep') {
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

  const typeLabel = ACTIVITY_OPTIONS.find((o) => o.type === type)?.label || '';

  return (
    <Layout>
      <div className="activities-content">

        <form onSubmit={handleSubmit} className="activities-form">

          {step === 1 && (
            <div className="activities-option-list">
              {ACTIVITY_OPTIONS.map(({ type: optionType, label }) => (
                <button
                  key={optionType}
                  type="button"
                  className="activity-menu-btn activities-option-row"
                  onClick={() => {
                    setType(optionType);
                    setStep(2);
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          )}

          {step === 2 && (
            <>
              <div className="glass-card activities-glass-card">
                <div className="log-form-title">
                  <span>how would you like to log this?</span>
                </div>
                <p className="log-form-subtitle">
                  you can log this {typeLabel} now, or set it up as a recurring schedule.
                </p>

                <div className="mode-select-list">
                  <button
                    type="button"
                    className="activity-menu-btn activities-option-row"
                    onClick={() => {
                      setMode('now');
                      setStep(3);
                    }}
                  >
                    log activity
                  </button>
                  <button
                    type="button"
                    className="activity-menu-btn activities-option-row"
                    onClick={() => {
                      setMode('schedule');
                      setStep(3);
                    }}
                  >
                    schedule activity
                  </button>
                </div>
              </div>

              <button type="button" className="activities-cancel-btn" onClick={handleBack}>
                cancel
              </button>
            </>
          )}

          {step === 3 && (
            <>
              <div className="glass-card activities-glass-card">

                {type === 'sleep' ? (
                  <div className="log-form-container">
                    <div className="log-form-title">
                      <Moon size={28} color="#4a3a26" />
                      <span>{mode === 'schedule' ? 'schedule sleep' : 'sleep'}</span>
                    </div>
                    <p className="log-form-subtitle">track your baby's sleep</p>

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
                            className={`log-option-btn ${quality === option ? 'selected' : ''}`}
                            onClick={() => setQuality(option)}
                          >
                            {option}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : type === 'feeding' ? (
                  <div className="log-form-container">
                    <div className="log-form-title">
                      <Milk size={28} color="#4a3a26" />
                      <span>{mode === 'schedule' ? 'schedule feeding' : 'feeding'}</span>
                    </div>
                    <p className="log-form-subtitle">track your baby's feeding</p>

                    <div className="log-field-group">
                      <label className="log-label">feeding type</label>
                      <div className="log-option-row">
                        {['Breast', 'Bottle', 'Solids'].map((option) => (
                          <button
                            key={option}
                            type="button"
                            className={`log-option-btn ${feedingType === option ? 'selected' : ''}`}
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
                        <Milk size={20} color="#5a4635" />
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
                            className={`log-option-btn ${feedingSide === option ? 'selected' : ''}`}
                            onClick={() => setFeedingSide(option)}
                          >
                            {option}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : type === 'diaper' ? (
                  <div className="log-form-container">
                    <div className="log-form-title">
                      <Baby size={28} color="#4a3a26" />
                      <span>{mode === 'schedule' ? 'schedule diaper change' : 'diaper change'}</span>
                    </div>
                    <p className="log-form-subtitle">track your baby's diaper change</p>

                    <div className="log-field-group">
                      <label className="log-label">diaper type</label>
                      <div className="log-option-row">
                        {['Wet', 'Dirty', 'Mixed'].map((option) => (
                          <button
                            key={option}
                            type="button"
                            className={`log-option-btn ${diaperType === option ? 'selected' : ''}`}
                            onClick={() => setDiaperType(option)}
                          >
                            {option}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="log-form-container">
                    <div className="log-form-title">
                      <span>
                        {mode === 'schedule'
                          ? (type === 'mood' ? 'schedule mood logging' : `schedule ${typeLabel}`)
                          : typeLabel}
                      </span>
                    </div>
                    <input
                      type="text"
                      className="empty-msg-light activity-input"
                      placeholder="Enter details"
                      value={value}
                      onChange={(e) => setValue(e.target.value)}
                      required
                    />
                  </div>
                )}

                {mode === 'schedule' && (
                  <div className="log-form-container">
                    <div className="log-form-title">
                      <Calendar size={26} color="#4a3a26" />
                      <span>schedule</span>
                    </div>
                    <p className="log-form-subtitle">set when this should repeat</p>

                    <div className="log-field-group">
                      <label className="log-label">repeat</label>
                      <div className="log-option-row">
                        {[
                          { key: 'once', label: 'once' },
                          { key: 'daily', label: 'daily' },
                          { key: 'weekly', label: 'weekly' },
                        ].map(({ key, label }) => (
                          <button
                            key={key}
                            type="button"
                            className={`log-option-btn ${repeat === key ? 'selected' : ''}`}
                            onClick={() => setRepeat(key)}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {repeat === 'once' && (
                      <div className="log-field-group">
                        <label className="log-label">date</label>
                        <div className="log-input-wrapper">
                          <input
                            type="date"
                            value={scheduleDate}
                            onChange={(e) => setScheduleDate(e.target.value)}
                            className="log-input"
                            required
                          />
                        </div>
                      </div>
                    )}

                    {repeat === 'weekly' && (
                      <div className="log-field-group">
                        <label className="log-label">days</label>
                        <div className="schedule-days-row">
                          {DAYS_OF_WEEK.map(({ key, short }) => (
                            <button
                              key={key}
                              type="button"
                              className={`schedule-day-btn ${repeatDays.includes(key) ? 'selected' : ''}`}
                              onClick={() => toggleRepeatDay(key)}
                            >
                              {short}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="log-field-group">
                      <label className="log-label">time</label>
                      <div className="log-input-wrapper">
                        <Clock size={20} color="#5a4635" />
                        <input
                          type="time"
                          value={scheduleTime}
                          onChange={(e) => setScheduleTime(e.target.value)}
                          className="log-input"
                          required
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <button type="submit" className="glass-card save-btn-card save-btn-card--activities">
                <Save size={20} />
                <span>{mode === 'schedule' ? 'save schedule' : 'save entry'}</span>
              </button>

              <button type="button" className="activities-cancel-btn" onClick={handleBack}>
                cancel
              </button>
            </>
          )}

        </form>
      </div>
    </Layout>
  );
};

export default Activities;
