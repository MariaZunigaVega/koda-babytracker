import React from "react";
import { useNavigate } from "react-router-dom";
import { ClipboardList } from "lucide-react";
import HabitatModal from "./habitatModal";

const ActivitiesModal = ({ activities, onClose }) => {
  const navigate = useNavigate();

  return (
    <HabitatModal title="todays activities" icon={ClipboardList} onClose={onClose}>
      {activities.length > 0 ? (
        activities.map((act, index) => (
          <p key={index} className="hm-list-item">
            <strong style={{ textTransform: "capitalize" }}>{act.type}:</strong> {act.value}
            {act.time ? ` at ${act.time}` : ""}
          </p>
        ))
      ) : (
        <p className="hm-empty">No activities yet. Tap the + to get started!</p>
      )}
      <button type="button" className="hm-action-btn" onClick={() => navigate("/add-activity")}>
        log an activity
      </button>
    </HabitatModal>
  );
};

export default ActivitiesModal;
