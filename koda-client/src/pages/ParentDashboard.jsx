import React, { useEffect, useState } from "react";
import axios from "axios";
import { useGLTF } from "@react-three/drei";
import { ClipboardList, User } from "lucide-react";
import "../styling/App.css";
import "../styling/habitats.css";
import { getSelectedChildForUser } from "../utils/authStorage";
import { API_URL } from "../config";
import { getAvatarById, DEFAULT_MODEL } from "../constants/avatars";
import FoxHabitat3D from "../components/habitats/FoxHabitat3D";
import FrogHabitat3D from "../components/habitats/FrogHabitat3D";
import BunnyHabitat3D from "../components/habitats/BunnyHabitat3D";
import ActivitiesModal from "../components/activitiesModal";
import CaregiversModal from "../components/caregiversModal";

useGLTF.preload(DEFAULT_MODEL);
useGLTF.preload("/models/feeding.glb");
useGLTF.preload("/models/sleep.glb");

const CornerButton = ({ icon: Icon, onClick, style }) => (
  <button
    type="button"
    onClick={onClick}
    style={{
      position: "absolute",
      width: "44px",
      height: "44px",
      borderRadius: "50%",
      border: "none",
      background: "rgba(255, 253, 247, 0.8)",
      backdropFilter: "blur(8px)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      boxShadow: "0 4px 14px rgba(15, 23, 42, 0.2)",
      cursor: "pointer",
      zIndex: 5,
      ...style,
    }}
  >
    <Icon size={20} strokeWidth={2} color="#2c2c2c" />
  </button>
);

const CornerSlot = ({ icon, top, right, isOpen, onToggle, children }) => {
  if (!isOpen) {
    return (
      <CornerButton
        icon={icon}
        onClick={onToggle}
        style={{ top: `${top}px`, right: `${right}px` }}
      />
    );
  }
  return children({ top: `${top}px`, right: `${right}px` });
};

const ParentDashboard = () => {
  const [activities, setActivities] = useState([]);
  const [caregivers, setCaregivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openPanel, setOpenPanel] = useState(null);

  const selectedChild = getSelectedChildForUser();
  const character = getAvatarById(selectedChild?.avatar);
  const characterModel = character?.model || DEFAULT_MODEL;

  const togglePanel = (name) =>
    setOpenPanel((current) => (current === name ? null : name));

  useEffect(() => {
    useGLTF.preload(characterModel);
  }, [characterModel]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const childName = selectedChild?.name || "Gracie";
        const actRes = await axios.get(`${API_URL}/api/activities?childName=${encodeURIComponent(childName)}`);

        const { feedings = [], sleeps = [], diapers = [] } = actRes.data;

        const formatTime = (value) => {
          if (!value) return "";
          return new Date(value).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
        };

        const latestFeeding = feedings.length > 0 ? {
          type: "feeding",
          value: `${feedings[0].type || "feeding"}${feedings[0].amount ? ` - ${feedings[0].amount} oz` : ""}${feedings[0].side && feedings[0].side !== "N/A" ? ` (${feedings[0].side})` : ""}`,
          time: formatTime(feedings[0].timestamp),
          rawTime: feedings[0].timestamp,
        } : null;

        const latestSleep = sleeps.length > 0 ? {
          type: "sleep",
          value: `${formatTime(sleeps[0].startTime)} - ${formatTime(sleeps[0].endTime)}${sleeps[0].quality ? ` (${sleeps[0].quality})` : ""}`,
          time: "",
          rawTime: sleeps[0].timestamp || sleeps[0].endTime || sleeps[0].startTime,
        } : null;

        const latestDiaper = diapers.length > 0 ? {
          type: "diaper",
          value: diapers[0].type || "diaper change",
          time: formatTime(diapers[0].timestamp),
          rawTime: diapers[0].timestamp,
        } : null;

        const recentActivities = [latestFeeding, latestSleep, latestDiaper]
          .filter(Boolean)
          .sort((a, b) => new Date(b.rawTime) - new Date(a.rawTime));

        setActivities(recentActivities);
        setLoading(false);
      } catch (err) {
        console.error("Link to backend failed:", err);
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedChild?.name]);

  return (
    <div
      className="dashboard-container"
      style={{
        height: "100vh",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div style={{ position: "absolute", inset: 0 }}>
        {character?.customHabitat === "fox" ? (
          <FoxHabitat3D characterModel={characterModel} />
        ) : character?.customHabitat === "frog" ? (
          <FrogHabitat3D characterModel={characterModel} />
        ) : character?.customHabitat === "bunny" ? (
          <BunnyHabitat3D characterModel={characterModel} />
        ) : (
          <div
            style={{
              position: "absolute",
              inset: 0,
              backgroundImage: `url(${process.env.PUBLIC_URL + "/lightmode.jpg"})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          />
        )}
      </div>
      <CornerSlot
        icon={ClipboardList}
        top={100}
        right={16}
        isOpen={openPanel === "activities"}
        onToggle={() => togglePanel("activities")}
      >
        {(anchorStyle) => (
          <ActivitiesModal
            activities={activities}
            onClose={() => setOpenPanel(null)}
            variant="popover"
            anchorStyle={anchorStyle}
          />
        )}
      </CornerSlot>

      {/* caregivers corner slot */}
      <CornerSlot
        icon={User}
        top={154}
        right={16}
        isOpen={openPanel === "caregivers"}
        onToggle={() => togglePanel("caregivers")}
      >
        {(anchorStyle) => (
          <CaregiversModal
            caregivers={caregivers}
            onClose={() => setOpenPanel(null)}
            variant="popover"
            anchorStyle={anchorStyle}
          />
        )}
      </CornerSlot>
    </div>
  );
};

export default ParentDashboard;