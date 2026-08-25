import React from "react";
import { User } from "lucide-react";
import HabitatModal from "./habitatModal";

const CaregiversModal = ({ caregivers, onClose }) => {
  return (
    <HabitatModal title="caregivers" icon={User} onClose={onClose}>
      {caregivers.length > 0 ? (
        caregivers.map((cg, index) => (
          <p key={index} className="hm-list-item">{cg.name}</p>
        ))
      ) : (
        <p className="hm-empty">No caregivers yet. Add a caregiver to share the load!</p>
      )}
      <button type="button" className="hm-action-btn secondary">
        add a caregiver
      </button>
    </HabitatModal>
  );
};

export default CaregiversModal;
