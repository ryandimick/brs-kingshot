// UI metadata for the Scenario Planner — resource keys + display labels.
// The kernel logic that consumes these lives server-side at /optimize/resources.

export const PLANNER_CATEGORIES = [
  { id: "govgear", label: "Gov Gear", resources: [
    { key: "satin", label: "Satin", default: 0 },
    { key: "threads", label: "Gilded Threads", default: 0 },
    { key: "artisan", label: "Artisan's Vision", default: 0 },
  ]},
  { id: "charm", label: "Gov Charms", resources: [
    { key: "guides", label: "Charm Guides", default: 0 },
    { key: "designs", label: "Charm Designs", default: 0 },
  ]},
  { id: "forgehammer", label: "Forgehammers", resources: [
    { key: "forgehammers", label: "Forgehammers", default: 0 },
    { key: "mythicGears", label: "Mythic Gears", default: 0 },
  ]},
  { id: "heroXP", label: "Gear XP", resources: [
    { key: "ep", label: "Enhancement Points", default: 0 },
    { key: "mithril", label: "Mithril", default: 0 },
    { key: "mythicGears", label: "Mythic Gears", default: 0 },
  ]},
  { id: "widget", label: "Hero Widgets", resources: [
    { key: "widgets", label: "Widget Fragments", default: 0 },
  ]},
];
