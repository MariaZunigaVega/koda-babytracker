// Moon/sun toggle button for switching between light and dark mode (visual only, no theme wiring yet).

import React from "react";
import "../styling/darkModeToggle.css";

const RAY_ANGLES = [45, 90, 135, 180, 225, 270, 315, 360];
const CRATER_COUNT = 3;

const DarkModeToggle = ({ isDarkMode, onToggle, className = "" }) => (
  <button
    type="button"
    onClick={onToggle}
    aria-label={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
    className={`dm-toggle ${className}`}
  >
    <span className="dm-toggle-inner">
      <span className={`dm-toggle-disc ${isDarkMode ? "dark" : ""}`} />

      {Array.from({ length: CRATER_COUNT }).map((_, i) => (
        <span key={i} className={`dm-toggle-crater dm-toggle-crater-${i + 1} ${isDarkMode ? "dark" : ""}`} />
      ))}

      {RAY_ANGLES.map((angle) => (
        <span
          key={angle}
          className={`dm-toggle-ray ${isDarkMode ? "dark" : ""}`}
          style={{ "--ray-angle": `${angle}deg` }}
        />
      ))}
    </span>
  </button>
);

export default DarkModeToggle;
