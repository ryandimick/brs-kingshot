import { useMemo, useState } from "react";
import { TROOP_TYPES } from "../data/constants";
import { GOV_GEAR_SLOTS, GOV_GEAR_TIERS, CHARM_LEVELS, getSetBonus } from "../data/gear-tables";
import { HERO_DB } from "../data/hero-catalog";
import { C, troopColor, FONT_DISPLAY, FONT_BODY, FONT_MONO, tierColorFromLabel } from "../theme";
import { GEAR_PIECE_STAT, heroGearPieceStat } from "../data/hero-tables";
import { serverDay, maxGenForServerDay } from "../lib/cycle";

// In-game bonus screen order: ATK, DEF, Leth, HP.
const BONUS_STAT_ORDER = ["ATK", "DEF", "Leth", "HP"];

const TROOP_ORDER = ["Infantry", "Cavalry", "Archer"];
const PIECE_NAMES = { helm: "Helm", boots: "Boots", chest: "Chest", gloves: "Gloves" };
const PIECE_ICONS = { helm: "\u{1F3A9}", boots: "\u{1F462}", chest: "\u{1F6E1}", gloves: "\u{1F9E4}" };

// Star picker (whole + half-steps to 5.0)
const STAR_OPTIONS = [];
for (let star = 0; star <= 4; star++) {
  for (let step = 0; step <= 5; step++) STAR_OPTIONS.push(star + step * 0.1);
}
STAR_OPTIONS.push(5.0);
function formatStars(v) {
  const star = Math.floor(v);
  const step = Math.round((v - star) * 10);
  if (star === 0 && step === 0) return "0";
  const stars = star > 0 ? "★".repeat(star) : "0★";
  return step > 0 ? `${stars} +${step}` : stars;
}

export function CharacterSheetTab({
  cs, update, numUp, updateRoster, removeRoster,
}) {
  const currentMaxGen = useMemo(() => maxGenForServerDay(serverDay()), []);

  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
      gap: 12,
      alignItems: "start",
    }}>
      {/* ── Gear row ──────────────────────────── */}
      <GovGearCharmsCard cs={cs} update={update} />
      {TROOP_ORDER.map(t => (
        <HeroGearAndHeroesCard
          key={t} troop={t} cs={cs}
          numUp={numUp} updateRoster={updateRoster} removeRoster={removeRoster}
          maxGen={currentMaxGen}
        />
      ))}

      {/* ── Bonus Overview row ────────────────── */}
      <BonusOverviewCard scope="squads" cs={cs} numUp={numUp} />
      {TROOP_ORDER.map(t => (
        <BonusOverviewCard key={t} scope={t} cs={cs} numUp={numUp} />
      ))}
    </div>
  );
}

// ─── Shared card chrome ───────────────────────────────────────────────────

function Card({ title, accent, children }) {
  return (
    <div style={{
      background: C.s1, border: `1px solid ${C.brd}`, borderRadius: 6,
      padding: 10, minWidth: 0, display: "flex", flexDirection: "column", gap: 8,
    }}>
      <div style={{
        fontFamily: FONT_DISPLAY, fontSize: 10, fontWeight: 800, letterSpacing: "1px",
        color: accent || C.gold, paddingBottom: 6, borderBottom: `1px solid ${C.brd}`,
      }}>
        {title}
      </div>
      {children}
    </div>
  );
}

// ─── Gov Gear + Charms ────────────────────────────────────────────────────

function GovGearCharmsCard({ cs, update }) {
  const slots = cs.govGearSlots || {};
  const sb = getSetBonus(slots);

  return (
    <Card title="GOV GEAR & CHARMS">
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 6 }}>
        {GOV_GEAR_SLOTS.map(slot => {
          const tierIdx = slots[slot.id] || 0;
          const tier = GOV_GEAR_TIERS[tierIdx];
          const tierColor = tierColorFromLabel(tier.label);
          return (
            <div key={slot.id} style={{
              background: C.bg, border: `1px solid ${tierIdx > 0 ? tierColor + "44" : C.brd}`,
              borderRadius: 4, padding: 6, textAlign: "center", minWidth: 0,
            }}>
              <div style={{ fontSize: 14, marginBottom: 2 }}>{slot.icon}</div>
              <div style={{ fontSize: 9, color: C.txD, marginBottom: 3 }}>{slot.name}</div>
              <select
                value={tierIdx}
                onChange={e => update(`govGearSlots.${slot.id}`, Number(e.target.value))}
                style={{ width: "100%", fontSize: 9, padding: "2px", color: tierColor, minWidth: 0 }}
              >
                {GOV_GEAR_TIERS.map((t, i) => (
                  <option key={i} value={i}>{t.label}</option>
                ))}
              </select>
              <div style={{ marginTop: 4, display: "flex", gap: 2 }}>
                {[0, 1, 2].map(ci => (
                  <select
                    key={ci}
                    value={(cs.charmLevels?.Infantry?.[slot.id]?.[ci]) || 0}
                    onChange={e => {
                      const val = Number(e.target.value);
                      for (const tt of TROOP_TYPES) {
                        const arr = [...(cs.charmLevels?.[tt]?.[slot.id] || [0, 0, 0])];
                        arr[ci] = val;
                        update(`charmLevels.${tt}.${slot.id}`, arr);
                      }
                    }}
                    style={{ flex: 1, fontSize: 8, padding: "1px", minWidth: 0 }}
                  >
                    {CHARM_LEVELS.map((cl, i) => (
                      <option key={i} value={i}>{cl.label}</option>
                    ))}
                  </select>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {(sb.atk3 > 0 || sb.def3 > 0) && (
        <div style={{
          padding: "6px 8px", background: C.s2,
          border: `1px solid ${C.gold}33`, borderRadius: 4,
          display: "flex", gap: 10, fontSize: 10, fontFamily: FONT_MONO,
        }}>
          {sb.def3 > 0 && <span style={{ color: C.blu }}>3pc +{sb.def3}% DEF</span>}
          {sb.atk3 > 0 && <span style={{ color: C.grn }}>6pc +{sb.atk3}% ATK</span>}
        </div>
      )}
    </Card>
  );
}

// ─── Hero Gear + Heroes (one combined card per troop) ────────────────────

function HeroGearAndHeroesCard({ troop, cs, numUp, updateRoster, removeRoster, maxGen }) {
  return (
    <Card title={`${troop.toUpperCase()}`} accent={troopColor[troop]}>
      <GearPieceGrid troop={troop} cs={cs} numUp={numUp} />
      <HeroList
        troop={troop} cs={cs} maxGen={maxGen}
        updateRoster={updateRoster} removeRoster={removeRoster}
      />
    </Card>
  );
}

function GearPieceGrid({ troop, cs, numUp }) {
  const gearSet = cs.heroGear?.[troop] || {};
  let lethTotal = 0, hpTotal = 0;
  for (const [pid, stat] of Object.entries(GEAR_PIECE_STAT)) {
    const p = gearSet[pid] || { enh: 0, mast: 0 };
    const val = heroGearPieceStat(p.enh || 0, p.mast || 0);
    if (stat === "Leth") lethTotal += val;
    else hpTotal += val;
  }
  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 6 }}>
        {Object.entries(GEAR_PIECE_STAT).map(([pieceId, stat]) => {
          const piece = gearSet[pieceId] || { enh: 0, mast: 0 };
          const statColor = stat === "Leth" ? C.grn : C.blu;
          return (
            <div key={pieceId} style={{
              position: "relative",
              background: C.bg, border: `1px solid ${C.brd}`,
              borderRadius: 4, padding: 6, minWidth: 0, minHeight: 92,
            }}>
              <div style={{ textAlign: "center", marginTop: 14 }}>
                <div style={{ fontSize: 18 }}>{PIECE_ICONS[pieceId]}</div>
                <div style={{ fontSize: 9, color: C.txD, marginTop: 2 }}>
                  {PIECE_NAMES[pieceId]}
                </div>
                <div style={{ fontSize: 8, color: statColor, fontWeight: 700, marginTop: 1, letterSpacing: "0.5px" }}>
                  {stat.toUpperCase()}
                </div>
              </div>
              <div style={{ position: "absolute", top: 4, right: 4, textAlign: "center" }}>
                <div style={{ fontSize: 7, color: C.txD, letterSpacing: "0.5px" }}>ENH</div>
                <input
                  type="number" min={0} max={200}
                  value={piece.enh}
                  onChange={e => numUp(`heroGear.${troop}.${pieceId}.enh`, e.target.value)}
                  style={{ width: 38, fontSize: 10, padding: "1px 2px", textAlign: "center", fontFamily: FONT_MONO }}
                />
              </div>
              <div style={{ position: "absolute", bottom: 4, right: 4, textAlign: "center" }}>
                <div style={{ fontSize: 7, color: C.txD, letterSpacing: "0.5px" }}>MAST</div>
                <input
                  type="number" min={0} max={20}
                  value={piece.mast}
                  onChange={e => numUp(`heroGear.${troop}.${pieceId}.mast`, e.target.value)}
                  style={{ width: 38, fontSize: 10, padding: "1px 2px", textAlign: "center", fontFamily: FONT_MONO }}
                />
              </div>
            </div>
          );
        })}
      </div>
      <div style={{
        padding: "5px 8px", background: C.bg, borderRadius: 4,
        display: "flex", justifyContent: "space-around", fontFamily: FONT_MONO, fontSize: 10,
      }}>
        <span style={{ color: C.grn }}>Leth {lethTotal.toFixed(1)}%</span>
        <span style={{ color: C.blu }}>HP {hpTotal.toFixed(1)}%</span>
      </div>
    </>
  );
}

function HeroList({ troop, cs, maxGen, updateRoster, removeRoster }) {
  const [addHero, setAddHero] = useState("");
  const roster = cs.heroRoster || {};
  const rosterNames = Object.keys(roster);
  const available = HERO_DB.filter(
    h => h.type === troop && h.gen <= maxGen && !rosterNames.includes(h.name)
  );
  const ownedForTroop = rosterNames
    .map(name => {
      const db = HERO_DB.find(h => h.name === name);
      return { name, db, entry: roster[name] };
    })
    .filter(x => x.db?.type === troop);

  const handleAdd = () => {
    if (!addHero) return;
    updateRoster(addHero, null, null);
    setAddHero("");
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5, paddingTop: 4, borderTop: `1px solid ${C.brd}` }}>
      <div style={{
        fontFamily: FONT_DISPLAY, fontSize: 9, fontWeight: 700,
        color: C.txD, letterSpacing: "1px", marginTop: 2,
      }}>
        HEROES
      </div>
      <div style={{ display: "flex", gap: 4 }}>
        <select
          value={addHero}
          onChange={e => setAddHero(e.target.value)}
          style={{ flex: 1, fontSize: 10, minWidth: 0 }}
        >
          <option value="">+ add…</option>
          {available.map(h => (
            <option key={h.name} value={h.name}>{h.name}</option>
          ))}
        </select>
        <button
          onClick={handleAdd}
          disabled={!addHero}
          style={{
            fontFamily: FONT_DISPLAY, fontSize: 9, fontWeight: 700, padding: "3px 10px",
            borderRadius: 3, border: "none", cursor: addHero ? "pointer" : "default",
            background: addHero ? C.gold : C.s2, color: addHero ? C.bg : C.txD,
          }}
        >
          ADD
        </button>
      </div>
      {ownedForTroop.length === 0 && (
        <div style={{ padding: 8, textAlign: "center", color: C.txD, fontSize: 10 }}>
          No {troop.toLowerCase()} heroes yet.
        </div>
      )}
      {ownedForTroop.map(({ name, db, entry }) => (
        <div key={name} style={{
          background: C.bg, border: `1px solid ${C.brd}`, borderRadius: 4,
          padding: 6, display: "flex", flexDirection: "column", gap: 4,
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <span style={{ fontWeight: 700, fontSize: 11, color: troopColor[troop] }}>{name}</span>
              <span style={{ fontSize: 9, color: C.txD, marginLeft: 4 }}>G{db?.gen}</span>
            </div>
            <button
              onClick={() => removeRoster(name)}
              style={{
                fontSize: 8, color: C.red, background: "none",
                border: `1px solid ${C.red}44`, borderRadius: 3,
                padding: "1px 5px", cursor: "pointer",
              }}
            >
              ×
            </button>
          </div>
          <div style={{ display: "flex", gap: 4, flexWrap: "wrap", alignItems: "flex-end" }}>
            <div style={{ flex: 0 }}>
              <div style={{ fontSize: 8, color: C.txD }}>Lv</div>
              <input
                type="number" min={1} max={80}
                value={entry.level || 1}
                onChange={e => updateRoster(name, "level", Math.min(80, Math.max(1, Number(e.target.value) || 1)))}
                style={{ width: 40, fontSize: 10, padding: "2px" }}
              />
            </div>
            <div style={{ flex: 0 }}>
              <div style={{ fontSize: 8, color: C.txD }}>Stars</div>
              <select
                value={entry.stars || 0}
                onChange={e => updateRoster(name, "stars", Number(e.target.value))}
                style={{ fontSize: 10, width: 56 }}
              >
                {STAR_OPTIONS.map(v => <option key={v} value={v}>{formatStars(v)}</option>)}
              </select>
            </div>
            {db?.hasWidget && (
              <div style={{ flex: 0 }}>
                <div style={{ fontSize: 8, color: C.gold }}>Wid</div>
                <input
                  type="number" min={0} max={10}
                  value={entry.widgetLv || 0}
                  onChange={e => updateRoster(name, "widgetLv", Math.min(10, Math.max(0, Number(e.target.value) || 0)))}
                  style={{ width: 32, fontSize: 10, padding: "2px" }}
                />
              </div>
            )}
            {(db?.expeditionSkills || []).map((skill, si) => (
              <div key={si} style={{ flex: 0 }}>
                <div style={{ fontSize: 8, color: C.txD, maxWidth: 36, overflow: "hidden", textOverflow: "ellipsis" }}>
                  {skill.name?.slice(0, 6) || `S${si + 1}`}
                </div>
                <input
                  type="number" min={0} max={5}
                  value={(entry.skills || [0, 0, 0])[si] || 0}
                  onChange={e => {
                    const sk = [...(entry.skills || [0, 0, 0])];
                    sk[si] = Math.min(5, Math.max(0, Number(e.target.value) || 0));
                    updateRoster(name, "skills", sk);
                  }}
                  style={{ width: 30, fontSize: 10, padding: "2px" }}
                />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Bonus Overview inputs ───────────────────────────────────────────────

function BonusOverviewCard({ scope, cs, numUp }) {
  const isSquads = scope === "squads";
  const bo = cs.bonusOverview || {};
  const values = bo[scope] || {};
  const accent = isSquads ? C.gold : troopColor[scope];
  const title = isSquads ? "BONUS — SQUADS" : `BONUS — ${scope.toUpperCase()}`;
  return (
    <Card title={title} accent={accent}>
      <div style={{ fontSize: 9, color: C.txD, marginBottom: 2 }}>
        Total in-game buff % (research + alliance + gear + charms + pets combined).
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {BONUS_STAT_ORDER.map(s => (
          <div key={s} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 10, color: C.txD, width: 40 }}>{s}</span>
            <input
              type="number"
              value={values[s] || 0}
              onChange={e => numUp(`bonusOverview.${scope}.${s}`, e.target.value)}
              style={{ flex: 1, fontSize: 11, padding: "3px 4px", minWidth: 0 }}
            />
            <span style={{ fontSize: 9, color: C.txD }}>%</span>
          </div>
        ))}
      </div>
    </Card>
  );
}
