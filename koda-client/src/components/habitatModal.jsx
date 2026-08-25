import React, { useEffect } from "react";
import { X } from "lucide-react";
import "../styling/habitatModal.css";

const HabitatModal = ({ title, icon: Icon, onClose, children }) => {
  // esc to close
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose?.();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="hm-overlay" onClick={onClose}>
      <div className="hm-panel" onClick={(e) => e.stopPropagation()}>
        <div className="hm-header">
          <div className="hm-title-group">
            {Icon && <Icon size={20} strokeWidth={2} />}
            <h2 className="hm-title">{title}</h2>
          </div>
          <button
            type="button"
            className="hm-close-btn"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={20} strokeWidth={2} />
          </button>
        </div>

        <div className="hm-body">{children}</div>
      </div>
    </div>
  );
};

export default HabitatModal;
