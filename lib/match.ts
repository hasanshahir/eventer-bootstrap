export const STACK_OPTIONS = [
  "Next.js",
  "React",
  "Python",
  "AI/ML",
  "Flutter",
  "Node.js",
  "DevOps",
  "Cybersecurity",
  "Web3",
  "UI/UX",
];

const KEYWORDS: Record<string, string[]> = {
  "Next.js": ["next.js", "nextjs", "vercel"],
  React: ["react", "reactjs", "react native"],
  Python: ["python", "django", "flask", "fastapi", "pytorch"],
  "AI/ML": [
    "ai",
    "ml",
    "ai/ml",
    "machine learning",
    "deep learning",
    "gemini",
    "genai",
    "llm",
    "agentic",
    "data science",
  ],
  Flutter: ["flutter", "firebase", "dart"],
  "Node.js": ["node", "node.js", "nodejs", "express", "nestjs", "backend"],
  DevOps: ["devops", "docker", "kubernetes", "k8s", "cloud", "aws", "gcp"],
  Cybersecurity: ["security", "cybersecurity", "ctf", "cyber", "infosec", "owasp"],
  Web3: ["web3", "blockchain", "solidity", "ethereum", "zk"],
  "UI/UX": ["ui/ux", "ux", "ui design", "product design", "figma"],
  Hackathon: ["hackathon", "codesprint", "olympiad", "competition"],
  Workshop: ["workshop", "bootcamp", "hands-on"],
};

function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Matches a keyword against text using strict non-alphanumeric token boundaries
 * so short tokens like "ai" or "ml" never falsely match inside words like
 * "email", "domain", "main", "html", or "yaml" (fixes F-06).
 */
export function matchesKeywordToken(text: string, keyword: string): boolean {
  const escaped = escapeRegExp(keyword.trim().toLowerCase());
  if (!escaped) return false;
  const pattern = new RegExp(`(^|[^a-z0-9])${escaped}([^a-z0-9]|$)`, "i");
  return pattern.test(text);
}

export function deriveTags(title = "", description = ""): string[] {
  const text = `${title} ${description}`.toLowerCase();
  const out: string[] = [];
  for (const [tag, words] of Object.entries(KEYWORDS)) {
    if (words.some((w) => matchesKeywordToken(text, w))) {
      out.push(tag);
    }
  }
  return out;
}

/**
 * Computes an honest stack affinity score between the user's selected skills
 * and an event's tags (fixes F-06).
 * - Returns `pct: 0` when `overlap.length === 0` (never fabricates a 41-55% random hash score).
 * - Scales deterministically from 60% to 100% based on tag overlap ratio and breadth.
 */
export function matchScore(
  userStack: string[],
  eventTags: string[],
  _seed = ""
): { pct: number; overlap: string[] } {
  void _seed;
  const normalizedUser = new Set(
    userStack.map((s) => s.trim().toLowerCase()).filter(Boolean)
  );
  if (normalizedUser.size === 0 || eventTags.length === 0) {
    return { pct: 0, overlap: [] };
  }

  const overlap: string[] = [];
  const seenOverlap = new Set<string>();
  for (const rawTag of eventTags) {
    const clean = rawTag.trim();
    const lower = clean.toLowerCase();
    if (normalizedUser.has(lower) && !seenOverlap.has(lower)) {
      seenOverlap.add(lower);
      overlap.push(clean);
    }
  }

  if (overlap.length === 0) {
    return { pct: 0, overlap: [] };
  }

  const eventTagRatio = overlap.length / Math.max(1, eventTags.length);
  const bonus = Math.min(overlap.length * 4, 12);
  const raw = 55 + 35 * eventTagRatio + bonus;
  return {
    pct: Math.max(55, Math.min(100, Math.round(raw))),
    overlap,
  };
}
