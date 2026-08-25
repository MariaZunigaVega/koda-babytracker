import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  Home,
  PlusSquare,
  BarChart2,
  MessageCircle,
  Settings as SettingsIcon,
  ChevronDown,
} from "lucide-react";
import { getSelectedChildForUser } from "../utils/authStorage";
import HabitatModal from "./habitatModal";
import "../styling/App.css";

const CIRCLE_BTN_STYLE = {
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
  padding: 0,
};

const TRANSPARENT_BAR_STYLE = {
  background: "transparent",
  backdropFilter: "none",
  boxShadow: "none",
  border: "none",
};

const NavIconButton = ({ icon: Icon, size = 22, strokeWidth = 1.8, onClick, ...rest }) => (
  <button type="button" style={CIRCLE_BTN_STYLE} onClick={onClick} {...rest}>
    <Icon size={size} strokeWidth={strokeWidth} color="#2c2c2c" />
  </button>
);

const Layout = ({ children }) => {
  const navigate = useNavigate();
  const [selectedChild, setSelectedChild] = useState(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  useEffect(() => {
    const savedChild = getSelectedChildForUser();
    if (savedChild) setSelectedChild(savedChild);
  }, []);

  return (
    <div className="mobile-frame">
      {/* UNIVERSAL HEADER — transparent bar, buttons keep their chrome */}
      <header className="dashboard-header" style={TRANSPARENT_BAR_STYLE}>
        <img
          src="/koda-logo.png"
          alt="Koda"
          className="koda-logo"
          onError={(e) => { e.target.style.visibility = "hidden"; }}
        />
        <button
          className="name-dropdown-btn"
          onClick={() => console.log("Open Child Switcher")}
          style={{
            background: "rgba(255, 253, 247, 0.8)",
            backdropFilter: "blur(8px)",
            boxShadow: "0 4px 14px rgba(15, 23, 42, 0.2)",
          }}
        >
          {selectedChild?.name || "Gracie"}
          <ChevronDown size={18} strokeWidth={2.5} />
        </button>
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <NavIconButton icon={Bell} size={20} strokeWidth={1.6} onClick={() => { }} />
        </div>
      </header>

      {children}

      <nav
        className="bottom-nav"
        style={{
          ...TRANSPARENT_BAR_STYLE,
          display: "flex",
          justifyContent: "space-around",
          alignItems: "center",
        }}
      >
        <NavIconButton icon={Home} onClick={() => navigate("/ParentDashboard")} />
        <NavIconButton icon={PlusSquare} onClick={() => navigate("/add-activity")} />
        <NavIconButton icon={BarChart2} strokeWidth={2} onClick={() => navigate("/history")} />
        <NavIconButton icon={MessageCircle} onClick={() => navigate("/chat")} />
        <NavIconButton
          icon={SettingsIcon}
          onClick={() => setIsSettingsOpen(true)}
          aria-haspopup="dialog"
          aria-expanded={isSettingsOpen}
        />
      </nav>

      {isSettingsOpen && (
        <HabitatModal
          title="settings"
          icon={SettingsIcon}
          onClose={() => setIsSettingsOpen(false)}
        >
          <button
            type="button"
            className="hm-action-btn secondary"
            onClick={() => {
              setIsSettingsOpen(false);
              navigate("/babysettings");
            }}
          >
            {selectedChild?.name || "Gracie"}'s settings
          </button>
          <button
            type="button"
            className="hm-action-btn secondary"
            onClick={() => {
              setIsSettingsOpen(false);
              navigate("/account");
            }}
          >
            account settings
          </button>
        </HabitatModal>
      )}
    </div>
  );
};

export default Layout;