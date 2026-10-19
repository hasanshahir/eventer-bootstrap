export const STACK_OPTIONS = ["Next.js","React","Python","AI/ML","Flutter","Node.js","DevOps","Cybersecurity","Web3","UI/UX"];

const KEYWORDS: Record<string, string[]> = {
  "Next.js": ["next.js","nextjs","vercel"],
  "React": ["react"],
  "Python": ["python","django","flask"],
  "AI/ML": ["ai","ml","machine learning","gemini","genai","llm","data science"],
  "Flutter": ["flutter","firebase","dart"],
  "Node.js": ["node","express","backend"],
  "DevOps": ["devops","docker","kubernetes","cloud","aws"],
  "Cybersecurity": ["security","ctf","cyber"],
  "Web3": ["web3","blockchain","solidity"],
  "UI/UX": ["ui/ux","design","figma"],
  "Hackathon": ["hackathon","codesprint","olympiad","competition"],
  "Workshop": ["workshop","bootcamp"],
};

export function deriveTags(title = "", description = ""): string[] {
  const text = ` ${title} ${description} `.toLowerCase();
  const out: string[] = [];
  for (const [tag, words] of Object.entries(KEYWORDS)) {
    if (words.some((w) => text.includes(w))) out.push(tag);
  }
  return out;
}

function hash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

export function matchScore(userStack: string[], eventTags: string[], seed = "") {
  const u = userStack.map((s) => s.trim().toLowerCase());
  const overlap = eventTags.filter((t) => u.includes(t.trim().toLowerCase()));
  if (overlap.length === 0) {
    return { pct: 41 + (hash(seed + eventTags.join(",")) % 15), overlap: [] as string[] };
  }
  const raw = 60 + 40 * (overlap.length / Math.max(1, eventTags.length)) + Math.min(overlap.length * 2, 6);
  return { pct: Math.max(41, Math.min(99, Math.round(raw))), overlap };
}