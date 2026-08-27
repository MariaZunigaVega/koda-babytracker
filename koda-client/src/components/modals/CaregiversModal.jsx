// Dashboard modal listing caregivers
import React from "react";
import { useNavigate } from "react-router-dom";
import { Users, Pencil } from "lucide-react";
import HabitatModal from "./HabitatModal";

const CaregiversModal = ({ caregivers, onClose }) => {
  const navigate = useNavigate();

  return (
    <HabitatModal title="caregivers" icon={Users} onClose={onClose} className="hm-caregivers">
      {caregivers.length > 0 ? (
        <>
          {caregivers.map((cg, index) => (
            <p key={index} className="hm-list-item">{cg.name}</p>
          ))}

          <button
            type="button"
            className="hm-link-btn hm-link-btn-icon"
            onClick={() => navigate("/caregivers")}
          >
            <Pencil size={14} strokeWidth={2} />
            view all caregivers
          </button>
        </>
      ) : (
        <p className="hm-empty">
          No caregivers yet.{" "}
          <button
            type="button"
            className="hm-inline-link"
            onClick={() => navigate("/caregivers")}
          >
            add a caregiver
          </button>{" "}
          to share the load!
        </p>
      )}
    </HabitatModal>
  );
};

export default CaregiversModal;
