// Dashboard modal listing caregivers
import React, { useState } from "react";
import { Users, UserPlus, Mail } from "lucide-react";
import HabitatModal from "./HabitatModal";

const CaregiversModal = ({ caregivers, onClose, onAddCaregiver }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    setStatus("");
    const result = await onAddCaregiver(email);
    if (result?.ok) {
      setEmail("");
      setIsAdding(false);
    } else {
      setStatus(result?.message || "Could not link that caregiver.");
    }
  };

  return (
    <HabitatModal title="caregivers" icon={Users} onClose={onClose} className="hm-caregivers">
      {caregivers.length > 0 ? (
        <>
          {caregivers.map((cg, index) => (
            <p key={index} className="hm-list-item">{cg.username || cg.email}</p>
          ))}

          <button
            type="button"
            className="hm-link-btn hm-link-btn-icon"
            onClick={() => setIsAdding(true)}
          >
            <UserPlus size={14} strokeWidth={2} />
            add a caregiver
          </button>
        </>
      ) : (
        <p className="hm-empty">
          No caregivers yet.{" "}
          <button
            type="button"
            className="hm-inline-link"
            onClick={() => setIsAdding(true)}
          >
            add a caregiver
          </button>{" "}
          to share the load!
        </p>
      )}
      {isAdding && (
        <form className="hm-caregiver-form" onSubmit={handleSubmit}>
          <label htmlFor="caregiver-email"><Mail size={15} /> caregiver email</label>
          <input
            id="caregiver-email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="caregiver@email.com"
            required
            autoFocus
          />
          {status && <p className="hm-form-status">{status}</p>}
          <div className="hm-form-actions">
            <button type="button" className="hm-secondary-btn" onClick={() => setIsAdding(false)}>cancel</button>
            <button type="submit" className="hm-submit-btn">link profile</button>
          </div>
        </form>
      )}
    </HabitatModal>
  );
};

export default CaregiversModal;
