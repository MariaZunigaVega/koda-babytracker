// non-interactive habitat background for the avatar selection page 
import React, { useEffect, useRef, useState } from "react";
import { HABITAT_COMPONENTS } from "./habitats/habitatRegistry";
import { getAvatarById } from "../constants/avatars";
import "../styling/components/avatarHabitatBackdrop.css";

const FADE_MS = 500;

const HabitatLayer = ({ avatarId, visible }) => {
  const avatar = getAvatarById(avatarId);
  const HabitatComponent = HABITAT_COMPONENTS[avatar?.customHabitat];
  if (!avatar || !HabitatComponent) return null;

  return (
    <div className={`avatar-habitat-layer ${visible ? "avatar-habitat-layer--visible" : ""}`}>
      <HabitatComponent showCharacter={false} />
    </div>
  );
};

const AvatarHabitatBackdrop = ({ avatarId }) => {
  const [visibleId, setVisibleId] = useState(avatarId);
  const [enteringId, setEnteringId] = useState(null);
  const [entered, setEntered] = useState(false);
  const settleTimeoutRef = useRef(null);

  useEffect(() => {
    if (avatarId === visibleId || avatarId === enteringId) return;

    clearTimeout(settleTimeoutRef.current);
    setEnteringId(avatarId);
    setEntered(false);

    const raf = requestAnimationFrame(() => setEntered(true));
    settleTimeoutRef.current = setTimeout(() => {
      setVisibleId(avatarId);
      setEnteringId(null);
    }, FADE_MS);

    return () => cancelAnimationFrame(raf);
  }, [avatarId, visibleId, enteringId]);

  useEffect(() => () => clearTimeout(settleTimeoutRef.current), []);

  return (
    <div className="avatar-habitat-backdrop">
      <HabitatLayer avatarId={visibleId} visible />
      {enteringId && <HabitatLayer key={enteringId} avatarId={enteringId} visible={entered} />}
      <div className="avatar-habitat-scrim" />
    </div>
  );
};

export default AvatarHabitatBackdrop;
