/** The GATE branches the platform covers, in display order. */
export interface Branch {
  code: string;
  name: string;
  displayName: string;
  icon: string;
  /** Shown on the branch's pages, e.g. a change to the paper for GATE 2027. */
  note?: string;
}

export const BRANCHES: Branch[] = [
  { code: "cs", name: "Computer Science and Information Technology", displayName: "Computer Science", icon: "💻" },
  {
    code: "da",
    name: "Data Science and Artificial Intelligence",
    displayName: "Data Science & AI",
    icon: "🤖",
    note: "Previous-year DA questions have not been collected yet.",
  },
  { code: "ec", name: "Electronics and Communication Engineering", displayName: "Electronics & Communication", icon: "📡" },
  { code: "ee", name: "Electrical Engineering", displayName: "Electrical Engineering", icon: "⚡" },
  { code: "me", name: "Mechanical Engineering", displayName: "Mechanical Engineering", icon: "⚙️" },
  { code: "ce", name: "Civil Engineering", displayName: "Civil Engineering", icon: "🏗️" },
  { code: "in", name: "Instrumentation Engineering", displayName: "Instrumentation", icon: "📊" },
  { code: "pi", name: "Production and Industrial Engineering", displayName: "Production & Industrial", icon: "🏭" },
  { code: "ch", name: "Chemical Engineering", displayName: "Chemical Engineering", icon: "⚗️" },
  { code: "bt", name: "Biotechnology", displayName: "Biotechnology", icon: "🧬" },
  { code: "mt", name: "Metallurgical Engineering", displayName: "Metallurgical", icon: "🔩" },
  { code: "xe", name: "Engineering Sciences", displayName: "Engineering Sciences", icon: "🔬" },
  { code: "xl", name: "Life Sciences", displayName: "Life Sciences", icon: "🌱" },
  {
    code: "tf",
    name: "Textile Engineering and Fibre Science",
    displayName: "Textile Engineering",
    icon: "🧵",
    note: "From GATE 2027, TF is no longer a separate paper: Textile is section XE9 of the XE paper. These are past TF questions.",
  },
  { code: "pe", name: "Petroleum Engineering", displayName: "Petroleum Engineering", icon: "🛢️" },
  { code: "ey", name: "Ecology and Evolution", displayName: "Ecology & Evolution", icon: "🦋" },
  { code: "ma", name: "Mathematics", displayName: "Mathematics", icon: "➗" },
  { code: "ar", name: "Architecture and Planning", displayName: "Architecture & Planning", icon: "📐" },
  { code: "ag", name: "Agricultural Engineering", displayName: "Agricultural Engineering", icon: "🌾" },
  { code: "gg", name: "Geology and Geophysics", displayName: "Geology & Geophysics", icon: "🪨" },
  { code: "ph", name: "Physics", displayName: "Physics", icon: "🔭" },
];

export const BRANCH_CODES = BRANCHES.map((b) => b.code);

export function getBranch(code: string): Branch | undefined {
  return BRANCHES.find((b) => b.code === code.toLowerCase());
}
