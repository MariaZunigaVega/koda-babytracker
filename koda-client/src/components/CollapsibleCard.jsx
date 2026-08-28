// universal collapsible card component used in the dashboard modals and elsewhere
import React, { useState } from "react";
import "../styling/components/collapsibleCard.css";

export const CollapsibleCard = ({ title, headerExtra, defaultOpen = true, children }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="glass-card collapsible-card">
      <div className="collapsible-card-header-row">
        <h3 className="history-section-title card-title-flush">{title}</h3>
        <div className="collapsible-card-header-actions">
          {headerExtra}
          <button type="button" className="collapsible-toggle-link" onClick={() => setIsOpen((prev) => !prev)}>
            {isOpen ? "show less" : "show more"}
          </button>
        </div>
      </div>
      {isOpen && <div className="collapsible-card-body">{children}</div>}
    </div>
  );
};

export const MiniCollapsibleCard = ({ title, defaultOpen = true, children }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="glass-card collapsible-card collapsible-card--mini">
      <div className="collapsible-card-header-row">
        <h3 className="collapsible-mini-title">{title}</h3>
        <button type="button" className="collapsible-toggle-link" onClick={() => setIsOpen((prev) => !prev)}>
          {isOpen ? "less" : "more"}
        </button>
      </div>
      {isOpen && <div className="collapsible-card-body collapsible-card-body--mini">{children}</div>}
    </div>
  );
};
