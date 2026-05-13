import { useState, useRef, useEffect } from "react";
import { C, FONT_BODY, FONT_MONO } from "../theme";

export function ProfileSwitcher({ profiles, activeProfile, onSwitch, onCreateNew, dirty }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => {
    function handleClick(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  if (!activeProfile) return null;

  const switchTo = (id) => {
    if (dirty && !confirm("You have unsaved changes. Switch profiles anyway?")) return;
    onSwitch(id);
    setOpen(false);
  };

  const create = () => {
    if (dirty && !confirm("You have unsaved changes. Create a new profile anyway?")) return;
    onCreateNew();
    setOpen(false);
  };

  return (
    <div ref={wrapRef} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          fontFamily: FONT_BODY,
          fontSize: 11,
          fontWeight: 600,
          padding: "8px 12px",
          borderRadius: 4,
          border: `1px solid ${C.brd}`,
          background: C.s2,
          color: C.tx,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: 8,
          minWidth: 140,
          justifyContent: "space-between",
        }}
      >
        <span style={{ color: C.txB }}>{activeProfile.name}</span>
        <span style={{ fontSize: 9, color: C.txD }}>{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div style={{
          position: "absolute",
          top: "calc(100% + 4px)",
          left: 0,
          minWidth: 220,
          background: C.s1,
          border: `1px solid ${C.brd}`,
          borderRadius: 4,
          boxShadow: "0 6px 20px rgba(0,0,0,0.5)",
          zIndex: 100,
          overflow: "hidden",
        }}>
          {profiles.map(p => (
            <button
              key={p.id}
              onClick={() => switchTo(p.id)}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
                gap: 2,
                width: "100%",
                padding: "8px 12px",
                background: p.id === activeProfile.id ? `${C.gold}22` : "transparent",
                border: "none",
                borderBottom: `1px solid ${C.brd}`,
                cursor: "pointer",
                textAlign: "left",
              }}
            >
              <span style={{
                fontFamily: FONT_BODY,
                fontSize: 12,
                fontWeight: 600,
                color: p.id === activeProfile.id ? C.gold : C.txB,
              }}>
                {p.name}
              </span>
              <span style={{ fontFamily: FONT_MONO, fontSize: 10, color: C.txD }}>
                #{p.kingshotPlayerId}
              </span>
            </button>
          ))}
          <button
            onClick={create}
            style={{
              width: "100%",
              padding: "8px 12px",
              background: "transparent",
              border: "none",
              cursor: "pointer",
              textAlign: "left",
              fontFamily: FONT_BODY,
              fontSize: 11,
              color: C.gold,
              fontWeight: 600,
            }}
          >
            + Create new profile
          </button>
        </div>
      )}
    </div>
  );
}
