// Dashboard modal listing today's logged activities
import React from "react";
import { useNavigate } from "react-router-dom";
import { ClipboardList } from "lucide-react";
import HabitatModal from "./HabitatModal";

const ActivitiesModal = ({ activities, onClose }) => {
  const navigate = useNavigate();

  return (
    <HabitatModal title="todays activities" icon={ClipboardList} onClose={onClose} className="hm-todays-activities">
      {activities.length > 0 ? (
        activities.map((act, index) => (
          <p key={index} className="hm-list-item">
            <strong className="hm-activity-type">{act.type}:</strong> {act.value}
            {act.time ? ` at ${act.time}` : ""}
          </p>
        ))
      ) : (
        <p className="hm-empty">No activities yet. Tap the + to get started!</p>
      )}

      <button type="button" className="hm-link-btn" onClick={() => navigate("/history")}>
        view full log →
      </button>
    </HabitatModal>
  );
};

export default ActivitiesModal;
