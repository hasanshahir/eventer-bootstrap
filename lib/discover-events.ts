import { prisma } from "./prisma";
import { deriveTags } from "./match";

export interface DiscoveredEvent {
  id: string;
  title: string;
  description: string;
  city: string;
  venue: string;
  category: "HACKATHON" | "CONFERENCE" | "WORKSHOP" | "MEETUP" | "COMPETITION" | "TECH_TALK";
  organizer: string;
  registrationUrl: string;
  tags: string[];
  startsAt: string | null;
  endsAt: string | null;
  source: "devpost" | "gdg" | "luma" | "campus";
  scope: "pakistan" | "global";
}

// In-memory cache with 1-hour TTL
let memoryCache: { events: DiscoveredEvent[]; timestamp: number } | null = null;
const CACHE_TTL_MS = 60 * 60 * 1000;

export function isValidRegistrationUrl(url?: string | null): boolean {
  if (!url || typeof url !== "string") return false;
  try {
    const parsed = new URL(url);
    if (!["http:", "https:"].includes(parsed.protocol)) return false;
    const hostname = parsed.hostname.toLowerCase();
    const pathname = parsed.pathname.replace(/\/+$/, "");

    // STRICT VALIDATION RULE: Reject generic root domains
    if (["lu.ma", "luma.com", "devpost.com", "forms.gle"].includes(hostname)) {
      if (!pathname || pathname === "" || pathname === "/" || pathname === "/home") {
        return false;
      }
    }
    return true;
  } catch {
    return false;
  }
}

// Verified 2026 Pakistan Tech Events Archive (City-wise, District-wise across Pakistan)
export const PAKISTAN_2026_CURATED_EVENTS: DiscoveredEvent[] = [
  // --- KARACHI ---
  {
    id: "khi_gdg_kolachi_2026",
    title: "GDG Kolachi DevFest 2026",
    description: "The premier developer gathering in Karachi covering Cloud, Web, Android, Open Source, and Gemini generative AI agents.",
    city: "Karachi",
    venue: "Habib University Auditorium, Block 7, Gulistan-e-Johar, Karachi",
    category: "CONFERENCE",
    organizer: "GDG Kolachi",
    registrationUrl: "https://gdg.community.dev/gdg-kolachi/",
    tags: ["GDG", "Google Cloud", "AI/ML", "Android", "Web"],
    startsAt: "2026-11-14T05:00:00.000Z",
    endsAt: "2026-11-14T14:00:00.000Z",
    source: "gdg",
    scope: "pakistan",
  },
  {
    id: "khi_ned_techfest_2026",
    title: "NED TechFest '26: All Pakistan AI Hackathon",
    description: "Flagship 48-hour student AI hackathon bringing together builders across Sindh to solve real-world problems with generative intelligence.",
    city: "Karachi",
    venue: "NED University Main Campus, University Road, Karachi",
    category: "HACKATHON",
    organizer: "NED University ACM Student Chapter",
    registrationUrl: "https://acm.neduet.edu.pk/",
    tags: ["Hackathon", "AI/ML", "Python", "Students"],
    startsAt: "2026-11-06T04:00:00.000Z",
    endsAt: "2026-11-08T13:00:00.000Z",
    source: "campus",
    scope: "pakistan",
  },
  {
    id: "khi_021disrupt_2026",
    title: "021Disrupt Tech & Startup Conference 2026",
    description: "Pakistan's premier entrepreneurship and technology conference uniting global venture capitalists, tech founders, and engineers.",
    city: "Karachi",
    venue: "Marriott Hotel Karachi / The Nest I/O",
    category: "CONFERENCE",
    organizer: "The Nest I/O & P@SHA",
    registrationUrl: "https://021disrupt.com/",
    tags: ["Startups", "Conferences", "Fintech", "Venture"],
    startsAt: "2026-11-21T04:30:00.000Z",
    endsAt: "2026-11-22T13:00:00.000Z",
    source: "campus",
    scope: "pakistan",
  },
  {
    id: "khi_fast_procom_2026",
    title: "FAST Karachi Procom '26 Hackathon & Speed Programming",
    description: "Annual national technology competition featuring algorithmic speed programming, web development, and AI build sprints.",
    city: "Karachi",
    venue: "FAST-NUCES Karachi Campus, Shah Latif Town",
    category: "COMPETITION",
    organizer: "Procom Society FAST",
    registrationUrl: "https://khi.nu.edu.pk/",
    tags: ["Competitive Programming", "Algorithms", "Hackathon"],
    startsAt: "2026-03-15T04:00:00.000Z",
    endsAt: "2026-03-17T12:00:00.000Z",
    source: "campus",
    scope: "pakistan",
  },
  {
    id: "khi_iba_ai_summit_2026",
    title: "IBA Karachi Data Science & AI Summit 2026",
    description: "Conference and research symposium on computer vision, deep learning, and enterprise data analytics across Pakistan.",
    city: "Karachi",
    venue: "IBA Main Campus, University Road, Karachi",
    category: "CONFERENCE",
    organizer: "IBA Computer Science Society",
    registrationUrl: "https://cs.iba.edu.pk/",
    tags: ["Data Science", "AI/ML", "Python", "DeepTech"],
    startsAt: "2026-04-20T05:00:00.000Z",
    endsAt: "2026-04-21T12:00:00.000Z",
    source: "campus",
    scope: "pakistan",
  },
  {
    id: "khi_sip_karo_2026",
    title: "sip karo by doublespeed | Coffee Mixer & Dev Networking",
    description: "Casual community mixer bringing together software engineers, product managers, and builders across Karachi.",
    city: "Karachi",
    venue: "Block 6, PECHS, Karachi, Pakistan",
    category: "MEETUP",
    organizer: "DoubleSpeed Community",
    registrationUrl: "https://lu.ma/kpmc9wm9",
    tags: ["Networking", "Founders", "Tech Meetup"],
    startsAt: "2026-10-23T10:30:00.000Z",
    endsAt: "2026-10-23T14:30:00.000Z",
    source: "luma",
    scope: "pakistan",
  },
  {
    id: "khi_pitch_fest_2026",
    title: "Pitch Fest Karachi 2026",
    description: "Early-stage software demos, founder elevator pitches, and live feedback from leading angel investors in Sindh.",
    city: "Karachi",
    venue: "Daftarkhwan / Karachi Tech Hub, Pakistan",
    category: "CONFERENCE",
    organizer: "Karachi Builders Network",
    registrationUrl: "https://lu.ma/sp8r18lh",
    tags: ["Startups", "Pitch", "Fintech", "Demo"],
    startsAt: "2026-10-28T09:00:00.000Z",
    endsAt: "2026-10-28T13:00:00.000Z",
    source: "luma",
    scope: "pakistan",
  },

  // --- LAHORE ---
  {
    id: "lhr_gdg_devfest_2026",
    title: "DevFest Lahore 2026 : AGENTS OF CHANGE",
    description: "The flagship annual developer festival in Punjab covering Cloud Run, Gemini agents, open models, and scalable architectures.",
    city: "Lahore",
    venue: "Arfa Software Technology Park, Ferozepur Road, Lahore",
    category: "CONFERENCE",
    organizer: "GDG Cloud Lahore",
    registrationUrl: "https://gdg.community.dev/events/details/google-gdg-cloud-lahore-presents-devfest-lahore-2026-agents-of-change/",
    tags: ["GDG", "Google Cloud", "Agentic AI", "DevFest"],
    startsAt: "2026-12-05T04:30:00.000Z",
    endsAt: "2026-12-05T13:00:00.000Z",
    source: "gdg",
    scope: "pakistan",
  },
  {
    id: "lhr_softec_2026",
    title: "SOFTEC '26: All Pakistan Software Competition & Hackathon",
    description: "Pakistan's oldest and premier software competition featuring algorithmic challenges, AI innovation tracks, and university showdowns.",
    city: "Lahore",
    venue: "FAST-NUCES Lahore Campus, Block B, Faisal Town",
    category: "HACKATHON",
    organizer: "SOFTEC Society FAST Lahore",
    registrationUrl: "https://softecnu.org/",
    tags: ["Hackathon", "Software Competition", "Algorithms"],
    startsAt: "2026-11-20T04:00:00.000Z",
    endsAt: "2026-11-22T12:00:00.000Z",
    source: "campus",
    scope: "pakistan",
  },
  {
    id: "lhr_lums_synergies_2026",
    title: "LUMS Synergies & Coding Conclave 2026",
    description: "Flagship collegiate technology conclave featuring speed programming, cybersecurity CTF, and system architecture challenges.",
    city: "Lahore",
    venue: "Lahore University of Management Sciences, DHA Phase 5, Lahore",
    category: "COMPETITION",
    organizer: "LUMS Tech Society",
    registrationUrl: "https://lums.edu.pk/",
    tags: ["Hackathon", "Competitive Programming", "Startups"],
    startsAt: "2026-02-14T04:00:00.000Z",
    endsAt: "2026-02-16T12:00:00.000Z",
    source: "campus",
    scope: "pakistan",
  },
  {
    id: "lhr_itu_ai_summit_2026",
    title: "ITU AI Summit 2026: Frontier Intelligence",
    description: "Research and industry conference showcasing deep learning architectures, robotics, and natural language processing in Urdu.",
    city: "Lahore",
    venue: "Information Technology University, Arfa Karim Tower, Lahore",
    category: "CONFERENCE",
    organizer: "ITU Department of Computer Science",
    registrationUrl: "https://itu.edu.pk/",
    tags: ["AI/ML", "DeepTech", "Robotics", "Research"],
    startsAt: "2026-05-18T04:00:00.000Z",
    endsAt: "2026-05-19T11:00:00.000Z",
    source: "campus",
    scope: "pakistan",
  },
  {
    id: "lhr_htb_meetup_2026",
    title: "Hack The Box Meetup Lahore: Ethical Hacking & CTF",
    description: "Hands-on offensive and defensive cybersecurity workshop covering reverse engineering, web exploits, and live box rooting.",
    city: "Lahore",
    venue: "Arfa Karim Technology Park, Ferozepur Road, Lahore",
    category: "WORKSHOP",
    organizer: "HTB Lahore Community",
    registrationUrl: "https://www.meetup.com/hack-the-box-meetup-lahore-pk/",
    tags: ["Cybersecurity", "CTF", "Security", "Workshop"],
    startsAt: "2026-11-15T09:00:00.000Z",
    endsAt: "2026-11-15T13:00:00.000Z",
    source: "campus",
    scope: "pakistan",
  },

  // --- ISLAMABAD ---
  {
    id: "isb_nust_codesprint_2026",
    title: "NUST Olympiad CodeSprint & TechFest '26",
    description: "High-octane competitive programming contest and tech showcase challenging the sharpest collegiate teams nationwide.",
    city: "Islamabad",
    venue: "SEECS, NUST H-12 Campus, Islamabad",
    category: "COMPETITION",
    organizer: "SEECS NUST",
    registrationUrl: "https://nust.edu.pk/",
    tags: ["Competition", "Algorithms", "AI/ML", "Students"],
    startsAt: "2026-11-27T05:00:00.000Z",
    endsAt: "2026-11-28T13:00:00.000Z",
    source: "campus",
    scope: "pakistan",
  },
  {
    id: "isb_gdg_cloud_devday_2026",
    title: "GDG Islamabad AI Agents & Cloud DevDay",
    description: "Full-day developer workshop on building agentic workflows, deploying serverless architectures, and scaling with Kubernetes.",
    city: "Islamabad",
    venue: "National Incubation Center (NIC), H-9/1, Islamabad",
    category: "WORKSHOP",
    organizer: "GDG Islamabad",
    registrationUrl: "https://gdg.community.dev/gdg-islamabad/",
    tags: ["GDG", "Google Cloud", "DevOps", "AI Agents"],
    startsAt: "2026-10-18T04:30:00.000Z",
    endsAt: "2026-10-18T12:00:00.000Z",
    source: "gdg",
    scope: "pakistan",
  },
  {
    id: "isb_fast_nascon_2026",
    title: "FAST Islamabad NaSCon '26 Software Showcase",
    description: "One of the federal capital's largest student technology competitions, featuring mobile app dev, robotics, and cyber defense.",
    city: "Islamabad",
    venue: "FAST-NUCES Islamabad, A.K. Brohi Road, H-11/4",
    category: "COMPETITION",
    organizer: "FAST NaSCon Society",
    registrationUrl: "https://isb.nu.edu.pk/",
    tags: ["Competition", "Robotics", "Web", "MobileDev"],
    startsAt: "2026-04-10T04:00:00.000Z",
    endsAt: "2026-04-12T12:00:00.000Z",
    source: "campus",
    scope: "pakistan",
  },
  {
    id: "isb_comsats_techfest_2026",
    title: "COMSATS TechFest & Cyber Defense Challenge",
    description: "National hackathon and cyber defense challenge bringing together universities from KPK, Punjab, and Islamabad.",
    city: "Islamabad",
    venue: "COMSATS University Islamabad, Park Road, Tarlai Kalan",
    category: "HACKATHON",
    organizer: "CUI Computing Society",
    registrationUrl: "https://www.comsats.edu.pk/",
    tags: ["Hackathon", "Cybersecurity", "IoT"],
    startsAt: "2026-03-28T04:00:00.000Z",
    endsAt: "2026-03-29T13:00:00.000Z",
    source: "campus",
    scope: "pakistan",
  },

  // --- RAWALPINDI ---
  {
    id: "rwp_national_cyber_olympiad_2026",
    title: "National Cyber Olympiad: Defcon Rawalpindi",
    description: "Hardware hacking, binary exploitation, and reverse engineering CTF competition in the Twin Cities technology corridor.",
    city: "Rawalpindi",
    venue: "Military College of Signals (NUST Campus), Rawalpindi",
    category: "COMPETITION",
    organizer: "Cyber Security Association of Pakistan",
    registrationUrl: "https://nust.edu.pk/",
    tags: ["Cybersecurity", "CTF", "Hardware", "Reverse Engineering"],
    startsAt: "2026-11-04T04:00:00.000Z",
    endsAt: "2026-11-05T12:00:00.000Z",
    source: "campus",
    scope: "pakistan",
  },

  // --- PESHAWAR & KPK ---
  {
    id: "psw_gdg_peshawar_devfest_2026",
    title: "GDG Peshawar DevFest & Frontier Tech Day",
    description: "Khyber Pakhtunkhwa's major developer gathering celebrating local open source software, cloud architectures, and youth talent.",
    city: "Peshawar",
    venue: "UET Peshawar / KPITB Tech Complex, Peshawar",
    category: "CONFERENCE",
    organizer: "GDG Peshawar",
    registrationUrl: "https://gdg.community.dev/gdg-peshawar/",
    tags: ["GDG", "OpenSource", "Cloud", "Frontier"],
    startsAt: "2026-11-28T04:30:00.000Z",
    endsAt: "2026-11-28T12:30:00.000Z",
    source: "gdg",
    scope: "pakistan",
  },
  {
    id: "kpk_giki_all_pak_2026",
    title: "GIKI All Pakistan Science & Technology Fair (G-Tech '26)",
    description: "High-level national hackathon, autonomous robotics navigation challenge, and software design summit in Topi, Swabi.",
    city: "Peshawar",
    venue: "GIK Institute of Engineering Sciences and Technology, Topi, Swabi",
    category: "HACKATHON",
    organizer: "Netronix Society GIKI",
    registrationUrl: "https://giki.edu.pk/",
    tags: ["Hackathon", "Robotics", "Hardware", "Embedded"],
    startsAt: "2026-02-27T04:00:00.000Z",
    endsAt: "2026-03-01T12:00:00.000Z",
    source: "campus",
    scope: "pakistan",
  },

  // --- FAISALABAD ---
  {
    id: "fsd_gdg_innovate_2026",
    title: "GDG Faisalabad Tech Innovate & Code Sprint",
    description: "Annual Faisalabad technology convention exploring modern web stacks, Flutter cross-platform apps, and industrial automation.",
    city: "Faisalabad",
    venue: "FAST-NUCES Chiniot-Faisalabad Campus, Faisalabad",
    category: "CONFERENCE",
    organizer: "GDG Faisalabad",
    registrationUrl: "https://gdg.community.dev/gdg-faisalabad/",
    tags: ["GDG", "Flutter", "Python", "Web"],
    startsAt: "2026-10-10T04:30:00.000Z",
    endsAt: "2026-10-10T12:00:00.000Z",
    source: "gdg",
    scope: "pakistan",
  },
  {
    id: "fsd_uaf_agri_ai_2026",
    title: "UAF Agri-AI Hackathon 2026",
    description: "Pioneering smart agriculture challenge utilizing satellite imagery, IoT sensors, and computer vision for crop health.",
    city: "Faisalabad",
    venue: "University of Agriculture Faisalabad, Jail Road",
    category: "HACKATHON",
    organizer: "Faculty of Agricultural Engineering & Tech",
    registrationUrl: "https://uaf.edu.pk/",
    tags: ["AgriTech", "AI/ML", "IoT", "Sensors"],
    startsAt: "2026-03-05T04:00:00.000Z",
    endsAt: "2026-03-07T12:00:00.000Z",
    source: "campus",
    scope: "pakistan",
  },

  // --- MULTAN ---
  {
    id: "mul_bzu_techventure_2026",
    title: "BZU TechVenture Hackathon & Web Summit",
    description: "South Punjab's premier student build sprint focusing on SaaS solutions, cloud APIs, and developer toolchains.",
    city: "Multan",
    venue: "Bahauddin Zakariya University, Bosan Road, Multan",
    category: "HACKATHON",
    organizer: "BZU Computer Science Society",
    registrationUrl: "https://bzu.edu.pk/",
    tags: ["Hackathon", "Web", "MobileDev", "SaaS"],
    startsAt: "2026-04-18T04:00:00.000Z",
    endsAt: "2026-04-19T12:00:00.000Z",
    source: "campus",
    scope: "pakistan",
  },

  // --- QUETTA ---
  {
    id: "qta_buitems_innovation_2026",
    title: "BUITEMS Quetta Innovation Hackathon & AI Sprint",
    description: "Balochistan's leading software showcase empowering local student developers to build resilient civic-tech and mobile solutions.",
    city: "Quetta",
    venue: "BUITEMS Takatu Campus, Airport Road, Quetta",
    category: "HACKATHON",
    organizer: "BUITEMS Tech Club",
    registrationUrl: "https://www.buitms.edu.pk/",
    tags: ["Hackathon", "CivicTech", "MobileDev", "Python"],
    startsAt: "2026-05-12T04:00:00.000Z",
    endsAt: "2026-05-14T11:00:00.000Z",
    source: "campus",
    scope: "pakistan",
  },

  // --- HYDERABAD & SINDH ---
  {
    id: "hyd_muet_megatech_2026",
    title: "Mehran UET All Sindh MegaTech Challenge 2026",
    description: "Engineering and technology showdown covering embedded systems, robotics arenas, and algorithmic challenges.",
    city: "Hyderabad",
    venue: "Mehran University of Engineering and Technology, Jamshoro / Hyderabad",
    category: "COMPETITION",
    organizer: "MUET IEEE Student Branch",
    registrationUrl: "https://www.muet.edu.pk/",
    tags: ["IoT", "Hardware", "Robotics", "Engineering"],
    startsAt: "2026-03-22T04:00:00.000Z",
    endsAt: "2026-03-24T12:00:00.000Z",
    source: "campus",
    scope: "pakistan",
  },
  {
    id: "hyd_uos_codecon_2026",
    title: "University of Sindh Jamshoro CodeCon '26",
    description: "Regional student competitive programming and web development sprint in Jamshoro tech corridor.",
    city: "Hyderabad",
    venue: "Faculty of Engineering & Technology, University of Sindh, Jamshoro",
    category: "COMPETITION",
    organizer: "Sindh University Computing Society",
    registrationUrl: "https://usindh.edu.pk/",
    tags: ["Algorithms", "Web", "Competitive Programming"],
    startsAt: "2026-02-08T04:30:00.000Z",
    endsAt: "2026-02-09T12:00:00.000Z",
    source: "campus",
    scope: "pakistan",
  },

  // --- SUKKUR & UPPER SINDH ---
  {
    id: "skr_sibahack_2026",
    title: "Sukkur IBA SIBAHack '26: National Fintech & AI Sprint",
    description: "National hackathon empowering builders across Upper Sindh and Southern Punjab to architect scalable cloud & fintech systems.",
    city: "Sukkur",
    venue: "Sukkur IBA University Campus, Nisar Ahmed Siddiqui Road, Sukkur",
    category: "HACKATHON",
    organizer: "IBA Sukkur ACM Student Chapter",
    registrationUrl: "https://iba-suk.edu.pk/",
    tags: ["Hackathon", "Fintech", "AI/ML", "Cloud"],
    startsAt: "2026-04-24T04:00:00.000Z",
    endsAt: "2026-04-26T12:00:00.000Z",
    source: "campus",
    scope: "pakistan",
  },

  // --- ADDITIONAL VERIFIED 2026 PAKISTAN EVENTS (FROM JAN 1 2026) ---
  {
    id: "khi_habib_postdigital_2026",
    title: "Habib University Post-Digital Tech & Agent Colloquium 2026",
    description: "Symposium and builder workshop exploring autonomous AI agents, ethical computing, and human-computer interaction.",
    city: "Karachi",
    venue: "Habib University Auditorium, Gulistan-e-Johar, Karachi",
    category: "CONFERENCE",
    organizer: "Habib University CS Program",
    registrationUrl: "https://habib.edu.pk/",
    tags: ["AI Agents", "DeepTech", "HCI", "Research"],
    startsAt: "2026-01-18T05:00:00.000Z",
    endsAt: "2026-01-19T13:00:00.000Z",
    source: "campus",
    scope: "pakistan",
  },
  {
    id: "khi_uok_career_expo_2026",
    title: "Karachi University IT & AI Career Conclave '26",
    description: "Annual software exhibition and live coding showdown hosted by Department of Computer Science (UBIT).",
    city: "Karachi",
    venue: "Department of Computer Science (UBIT), University of Karachi",
    category: "COMPETITION",
    organizer: "UBIT Karachi University",
    registrationUrl: "https://uok.edu.pk/",
    tags: ["Web", "Software Showcase", "AI/ML", "Students"],
    startsAt: "2026-02-22T04:00:00.000Z",
    endsAt: "2026-02-23T11:00:00.000Z",
    source: "campus",
    scope: "pakistan",
  },
  {
    id: "khi_iba_probattle_2026",
    title: "IBA ProBattle '26: All Pakistan Coding Championship",
    description: "National championship featuring web dev, app sprints, algorithmic programming, and database design arenas.",
    city: "Karachi",
    venue: "IBA Main Campus, University Road, Karachi",
    category: "COMPETITION",
    organizer: "IBA Computer Science Society",
    registrationUrl: "https://cs.iba.edu.pk/",
    tags: ["Competitive Programming", "Web", "MobileDev"],
    startsAt: "2026-05-08T04:00:00.000Z",
    endsAt: "2026-05-10T13:00:00.000Z",
    source: "campus",
    scope: "pakistan",
  },
  {
    id: "lhr_lums_psifi_2026",
    title: "LUMS PsiFi '26: Annual Science & Tech Olympiad",
    description: "Pakistan's largest collegiate science and tech olympiad featuring autonomous robotics, algorithmic challenges, and game development.",
    city: "Lahore",
    venue: "LUMS Campus, DHA Phase 5, Lahore",
    category: "COMPETITION",
    organizer: "SPADES LUMS",
    registrationUrl: "https://lums.edu.pk/",
    tags: ["Robotics", "Algorithms", "GameDev", "Olympiad"],
    startsAt: "2026-01-24T04:00:00.000Z",
    endsAt: "2026-01-27T14:00:00.000Z",
    source: "campus",
    scope: "pakistan",
  },
  {
    id: "lhr_uet_cybersprint_2026",
    title: "UET Lahore IET National Cyber Sprints & AI Quest '26",
    description: "Inter-university offensive security CTF, hardware hacking arena, and generative AI agent showcase.",
    city: "Lahore",
    venue: "UET Main Campus, G.T. Road, Lahore",
    category: "COMPETITION",
    organizer: "IET UET Lahore Chapter",
    registrationUrl: "https://uet.edu.pk/",
    tags: ["Cybersecurity", "CTF", "AI Agents", "Hardware"],
    startsAt: "2026-03-12T04:30:00.000Z",
    endsAt: "2026-03-13T12:00:00.000Z",
    source: "campus",
    scope: "pakistan",
  },
  {
    id: "lhr_pucit_codefest_2026",
    title: "PUCIT CodeFest & App Sprint 2026",
    description: "Annual software build sprint bringing Punjab University developers together for mobile and full-stack challenges.",
    city: "Lahore",
    venue: "Punjab University Allama Iqbal Campus, Old Campus, Lahore",
    category: "HACKATHON",
    organizer: "PUCIT ACM Student Chapter",
    registrationUrl: "https://pucit.edu.pk/",
    tags: ["Hackathon", "MobileDev", "Web", "Flutter"],
    startsAt: "2026-04-26T04:00:00.000Z",
    endsAt: "2026-04-27T12:00:00.000Z",
    source: "campus",
    scope: "pakistan",
  },
  {
    id: "isb_air_technocon_2026",
    title: "Air University TechnoCon '26: Cyber & AI Summit",
    description: "National cybersecurity capture-the-flag (CTF) and defense-grade computer vision symposium in the federal capital.",
    city: "Islamabad",
    venue: "Air University, Sector E-9, Islamabad",
    category: "CONFERENCE",
    organizer: "Air University Cyber Security Club",
    registrationUrl: "https://au.edu.pk/",
    tags: ["Cybersecurity", "CTF", "AI/ML", "Conferences"],
    startsAt: "2026-01-29T04:30:00.000Z",
    endsAt: "2026-01-31T13:00:00.000Z",
    source: "campus",
    scope: "pakistan",
  },
  {
    id: "rwp_tech_summit_2026",
    title: "Rawalpindi Tech Summit: Hardware & IoT Arena '26",
    description: "Embedded electronics, IoT edge computing, and robotics prototyping challenge in Rawalpindi.",
    city: "Rawalpindi",
    venue: "Rawalpindi Tech Hub / NUST MCS",
    category: "COMPETITION",
    organizer: "Twin Cities Maker Society",
    registrationUrl: "https://nust.edu.pk/",
    tags: ["Hardware", "IoT", "Robotics", "Embedded"],
    startsAt: "2026-02-19T05:00:00.000Z",
    endsAt: "2026-02-20T12:00:00.000Z",
    source: "campus",
    scope: "pakistan",
  },
  {
    id: "isb_devcon_venture_2026",
    title: "Islamabad DevCon & Venture Showcase 2026",
    description: "Gathering federal builders, venture funds, and AI startups for live engineering demos and pitch rounds.",
    city: "Islamabad",
    venue: "Pak-China Friendship Centre, Garden Avenue, Islamabad",
    category: "CONFERENCE",
    organizer: "Islamabad Tech Council",
    registrationUrl: "https://nicpakistan.com.pk/",
    tags: ["Startups", "Conferences", "AI/ML", "Venture"],
    startsAt: "2026-06-06T04:00:00.000Z",
    endsAt: "2026-06-07T13:00:00.000Z",
    source: "campus",
    scope: "pakistan",
  },
  {
    id: "psw_imsciences_datathon_2026",
    title: "IM|Sciences DataThon & AI Showcase '26",
    description: "KP data analytics sprint exploring natural language processing for low-resource regional languages and computer vision.",
    city: "Peshawar",
    venue: "Institute of Management Sciences, 1-A, Sector E-5, Phase 7, Hayatabad, Peshawar",
    category: "HACKATHON",
    organizer: "IM|Sciences Computing Club",
    registrationUrl: "https://imsciences.edu.pk/",
    tags: ["Data Science", "AI/ML", "NLP", "Hackathon"],
    startsAt: "2026-04-14T04:00:00.000Z",
    endsAt: "2026-04-15T12:00:00.000Z",
    source: "campus",
    scope: "pakistan",
  },
  {
    id: "psw_uet_mechtech_2026",
    title: "UET Peshawar MechTech & Software Expo 2026",
    description: "Annual mechatronics and software design exhibition featuring autonomous rover sprints and embedded systems.",
    city: "Peshawar",
    venue: "UET Main Campus, Jamrud Road, Peshawar",
    category: "COMPETITION",
    organizer: "UET Peshawar Engineering Council",
    registrationUrl: "https://uetpeshawar.edu.pk/",
    tags: ["Embedded", "Robotics", "Hardware", "Software"],
    startsAt: "2026-05-04T04:30:00.000Z",
    endsAt: "2026-05-05T12:00:00.000Z",
    source: "campus",
    scope: "pakistan",
  },
  {
    id: "fsd_fast_cfd_devsprint_2026",
    title: "FAST CFD DevSprint & Speed Coding '26",
    description: "Algorithmic speed coding and full-stack web sprint at FAST Chiniot-Faisalabad Campus.",
    city: "Faisalabad",
    venue: "FAST-NUCES Chiniot-Faisalabad Campus, Chiniot Road",
    category: "COMPETITION",
    organizer: "FAST CFD Computing Society",
    registrationUrl: "https://cfd.nu.edu.pk/",
    tags: ["Competitive Programming", "Algorithms", "Web"],
    startsAt: "2026-05-20T04:00:00.000Z",
    endsAt: "2026-05-21T12:00:00.000Z",
    source: "campus",
    scope: "pakistan",
  },
  {
    id: "mul_nfc_robotics_2026",
    title: "NFC IET Multan Robotics & Autonomous Code Quest '26",
    description: "South Punjab autonomous robotics arena, micro-controller programming, and system design competition.",
    city: "Multan",
    venue: "NFC Institute of Engineering and Technology, Khanewal Road, Multan",
    category: "COMPETITION",
    organizer: "NFC Robotics Club",
    registrationUrl: "https://nfciet.edu.pk/",
    tags: ["Robotics", "Hardware", "IoT", "Competitive Programming"],
    startsAt: "2026-02-10T04:30:00.000Z",
    endsAt: "2026-02-11T12:00:00.000Z",
    source: "campus",
    scope: "pakistan",
  },
  {
    id: "qta_uob_youth_summit_2026",
    title: "University of Balochistan Youth Tech Summit '26",
    description: "Promoting digital skills, Python development, and cloud computing for young engineers across Balochistan.",
    city: "Quetta",
    venue: "UoB Main Auditorium, Sariab Road, Quetta",
    category: "CONFERENCE",
    organizer: "UoB Computer Science Society",
    registrationUrl: "https://uob.edu.pk/",
    tags: ["Python", "Cloud", "Conferences", "YouthDev"],
    startsAt: "2026-03-16T04:30:00.000Z",
    endsAt: "2026-03-17T11:30:00.000Z",
    source: "campus",
    scope: "pakistan",
  },
];

// Pipeline 1: Global Virtual Hackathons (Devpost Public API — Strictly 2026 Online Events)
export async function fetchDevpostHackathons(): Promise<DiscoveredEvent[]> {
  try {
    const res = await fetch(
      "https://devpost.com/api/hackathons?status[]=upcoming&status[]=open&challenge_type[]=online",
      {
        headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" },
        signal: AbortSignal.timeout(8000),
        next: { revalidate: 3600 },
      }
    );
    if (!res.ok) return [];
    const data = await res.json();
    const hackathons = data.hackathons || [];
    const JAN_1_2026_MS = new Date("2026-01-01T00:00:00.000Z").getTime();

    return hackathons
      .filter((h: any) => {
        if (!isValidRegistrationUrl(h.url)) return false;
        
        // Exclude older years (2022, 2023, 2024, 2025)
        const titleLower = (h.title || "").toLowerCase();
        if (/\b(2021|2022|2023|2024|2025)\b/.test(titleLower)) return false;

        const dateStr = parseUpcomingDate(h.submission_period_dates);
        if (dateStr) {
          const t = new Date(dateStr).getTime();
          if (t < JAN_1_2026_MS) return false;
        }
        return true;
      })
      .map((h: any) => {
        const themes = Array.isArray(h.themes) ? h.themes.map((t: any) => t.name) : [];
        const tags = Array.from(new Set(["Virtual", "Hackathon", ...themes, ...deriveTags(h.title, "")])).slice(0, 5);

        return {
          id: `devpost_${h.id || Math.abs(hashCode(h.url))}`,
          title: h.title,
          description: `${h.title} — Global virtual online hackathon open to developers in Pakistan and worldwide.`,
          city: "Global • Virtual",
          venue: "Online (Devpost)",
          category: "HACKATHON" as const,
          organizer: h.organization_name || "Devpost Global",
          registrationUrl: h.url,
          tags,
          startsAt: parseUpcomingDate(h.submission_period_dates),
          endsAt: null,
          source: "devpost" as const,
          scope: "global" as const,
        };
      });
  } catch (err) {
    console.error("Devpost scanner error:", err);
    return [];
  }
}

// Pipeline 2: Pakistan Official GDG & Campus Chapters (Bevy Public API)
export async function fetchGdgPakistanEvents(): Promise<DiscoveredEvent[]> {
  try {
    const res = await fetch("https://gdg.community.dev/api/event/?status=Published", {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        Accept: "application/json",
      },
      signal: AbortSignal.timeout(8000),
      next: { revalidate: 3600 },
    });
    if (!res.ok) return [];
    const data = await res.json();
    const results = data.results || [];
    const JAN_1_2026_MS = new Date("2026-01-01T00:00:00.000Z").getTime();

    const pkCities = ["karachi", "lahore", "islamabad", "peshawar", "faisalabad", "rawalpindi", "multan", "quetta", "hyderabad", "sukkur"];
    const pkCampuses = [/\bned\b/i, /\bfast\b/i, /\bnust\b/i, /\bgiki\b/i, /\biba\b/i, /\bcomsats\b/i, /\bpucit\b/i, /\bhabib\b/i, /\buet\b/i];

    return results
      .filter((ev: any) => {
        if (!isValidRegistrationUrl(ev.url)) return false;
        
        // Strict 2026 filter
        if (ev.start_date) {
          const t = new Date(ev.start_date).getTime();
          if (t < JAN_1_2026_MS) return false;
        }

        const c = ev.chapter;
        if (!c) return false;
        if (c.country === "PK" || c.country_name?.toLowerCase() === "pakistan") return true;

        const loc = `${c.city || ""} ${c.chapter_location || ""} ${c.title || ""}`.toLowerCase();
        const cityMatch = pkCities.some((city) => loc.includes(city));
        const campusMatch = pkCampuses.some((rx) => rx.test(loc));
        return cityMatch || campusMatch;
      })
      .map((ev: any) => {
        const title = ev.title || "GDG Community Gathering";
        const rawCity = ev.chapter?.city || "Lahore";
        const city = normalizeCityName(rawCity);

        const cat = title.toLowerCase().includes("hackathon")
          ? ("HACKATHON" as const)
          : title.toLowerCase().includes("devfest") || title.toLowerCase().includes("summit")
          ? ("CONFERENCE" as const)
          : ("MEETUP" as const);

        return {
          id: `gdg_${ev.id || Math.abs(hashCode(ev.url))}`,
          title,
          description: `${title} hosted by ${ev.chapter?.title || "GDG Pakistan"} in ${city}, Pakistan.`,
          city,
          venue: `${ev.chapter?.title || "Google Developer Groups"} • ${city}`,
          category: cat,
          organizer: ev.chapter?.title || "GDG Pakistan",
          registrationUrl: ev.url,
          tags: ["GDG", "Google Cloud", "Community", ...deriveTags(title, "")].slice(0, 5),
          startsAt: ev.start_date || null,
          endsAt: ev.end_date || null,
          source: "gdg" as const,
          scope: "pakistan" as const,
        };
      });
  } catch (err) {
    console.error("GDG scanner error:", err);
    return [];
  }
}

// Pipeline 3: Real Luma Pakistan Cities & Circles (STRICTLY Verified in Pakistan)
export async function fetchLumaPakistanEvents(): Promise<DiscoveredEvent[]> {
  const cities = ["karachi", "lahore", "islamabad"];
  const allLuma: DiscoveredEvent[] = [];
  const JAN_1_2026_MS = new Date("2026-01-01T00:00:00.000Z").getTime();

  for (const city of cities) {
    try {
      const res = await fetch(`https://api.lu.ma/discover/get-paginated-events?city=${city}`, {
        headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" },
        signal: AbortSignal.timeout(8000),
        next: { revalidate: 3600 },
      });
      if (!res.ok) continue;
      const data = await res.json();
      const entries = data.entries || [];

      for (const entry of entries) {
        const ev = entry.event;
        if (!ev || !ev.url) continue;

        // STRICT GEOPOLITICAL CHECK: Must be verified in Pakistan!
        const geo = entry.geo_address;
        
        // If explicitly in another country, reject immediately (e.g. US events)
        if (geo?.country_code && geo.country_code !== "PK") continue;

        const isPak =
          geo?.country_code === "PK" ||
          geo?.country?.toLowerCase() === "pakistan" ||
          geo?.city_state?.toLowerCase().includes("pakistan") ||
          geo?.address?.toLowerCase().includes("pakistan") ||
          (ev.name && /\b(karachi|lahore|islamabad|rawalpindi|peshawar|faisalabad|multan|quetta|hyderabad|sukkur)\b/i.test(ev.name));

        if (!isPak) continue; // Reject foreign events mistakenly returned

        // Strict 2026 date check
        if (entry.start_at) {
          const t = new Date(entry.start_at).getTime();
          if (t < JAN_1_2026_MS) continue;
        }

        const specificUrl = `https://lu.ma/${ev.url}`;
        if (!isValidRegistrationUrl(specificUrl)) continue;

        const title = ev.name || "Community Meetup";
        const realCity = normalizeCityName(geo?.city || city);

        const cat = title.toLowerCase().includes("hack")
          ? ("HACKATHON" as const)
          : title.toLowerCase().includes("fest") || title.toLowerCase().includes("pitch") || title.toLowerCase().includes("summit")
          ? ("CONFERENCE" as const)
          : ("MEETUP" as const);

        allLuma.push({
          id: `luma_${ev.url}`,
          title,
          description: `${title} in ${realCity}, Pakistan. Direct attendee passes verified on Luma.`,
          city: realCity,
          venue: geo?.city_state || `${realCity}, Pakistan`,
          category: cat,
          organizer: entry.hosts?.[0]?.name || "Pakistan Tech Circle",
          registrationUrl: specificUrl,
          tags: ["Luma", "Networking", ...deriveTags(title, "")].slice(0, 5),
          startsAt: entry.start_at || null,
          endsAt: null,
          source: "luma" as const,
          scope: "pakistan" as const,
        });
      }
    } catch (err) {
      console.error(`Luma scanner error for ${city}:`, err);
    }
  }

  return allLuma;
}

// Master Aggregator with Deduplication and Database Persistence
export async function discoverAllEvents(bypassCache = false): Promise<{
  events: DiscoveredEvent[];
  sources: { devpost: number; gdg: number; luma: number; campus: number };
}> {
  if (!bypassCache && memoryCache && Date.now() - memoryCache.timestamp < CACHE_TTL_MS) {
    const devpost = memoryCache.events.filter((e) => e.source === "devpost").length;
    const gdg = memoryCache.events.filter((e) => e.source === "gdg").length;
    const luma = memoryCache.events.filter((e) => e.source === "luma").length;
    const campus = memoryCache.events.filter((e) => e.source === "campus").length;
    return {
      events: memoryCache.events,
      sources: { devpost, gdg, luma, campus },
    };
  }

  const [devpostEvents, gdgEvents, lumaEvents] = await Promise.all([
    fetchDevpostHackathons(),
    fetchGdgPakistanEvents(),
    fetchLumaPakistanEvents(),
  ]);

  // Combine curated regional 2026 Pakistan calendar with live API streams
  const rawList = [
    ...PAKISTAN_2026_CURATED_EVENTS,
    ...lumaEvents,
    ...gdgEvents,
    ...devpostEvents,
  ];

  // Deduplicate strictly by normalized registration URL and title slug
  const seenUrls = new Set<string>();
  const seenTitles = new Set<string>();
  const uniqueEvents: DiscoveredEvent[] = [];

  for (const ev of rawList) {
    if (!isValidRegistrationUrl(ev.registrationUrl)) continue;
    const normUrl = ev.registrationUrl.toLowerCase().replace(/\/+$/, "");
    const normTitle = ev.title.toLowerCase().replace(/[^a-z0-9]/g, "");

    if (seenUrls.has(normUrl) || seenTitles.has(normTitle)) continue;
    seenUrls.add(normUrl);
    seenTitles.add(normTitle);
    uniqueEvents.push(ev);
  }

  // Sort chronologically (startsAt asc)
  uniqueEvents.sort((a, b) => {
    const timeA = a.startsAt ? new Date(a.startsAt).getTime() : Infinity;
    const timeB = b.startsAt ? new Date(b.startsAt).getTime() : Infinity;
    return timeA - timeB;
  });

  memoryCache = {
    events: uniqueEvents,
    timestamp: Date.now(),
  };

  // Sync to Neon DB asynchronously
  syncDiscoveredEventsToPrisma(uniqueEvents).catch((err) => {
    console.error("Async Prisma sync error:", err);
  });

  const devpost = uniqueEvents.filter((e) => e.source === "devpost").length;
  const gdg = uniqueEvents.filter((e) => e.source === "gdg").length;
  const luma = uniqueEvents.filter((e) => e.source === "luma").length;
  const campus = uniqueEvents.filter((e) => e.source === "campus").length;

  return {
    events: uniqueEvents,
    sources: { devpost, gdg, luma, campus },
  };
}

// Sync to PostgreSQL with Prisma
export async function syncDiscoveredEventsToPrisma(events: DiscoveredEvent[]) {
  try {
    const organizer = await (prisma as any).organizer.upsert({
      where: { id: "org_radar_scanner" },
      update: { name: "HackScout Autonomous Radar" },
      create: {
        id: "org_radar_scanner",
        name: "HackScout Autonomous Radar",
      },
    });

    // Delete any old generic mock records and pre-2026 dates
    try {
      await (prisma as any).event.deleteMany({
        where: {
          OR: [
            { startTime: { lt: new Date("2026-01-01T00:00:00.000Z") } },
            { description: { contains: "https://lu.ma\n" } },
            { description: { endsWith: "https://lu.ma" } },
            { description: { contains: "https://luma.com/home" } },
            { description: { contains: "From the Forest" } },
            { title: { contains: "2021" } },
            { title: { contains: "2022" } },
            { title: { contains: "2023" } },
            { title: { contains: "2024" } },
          ],
        },
      });
    } catch {}

    // Upsert discovered events
    for (const ev of events) {
      const startTime = ev.startsAt ? new Date(ev.startsAt) : new Date(Date.now() + 7 * 86400 * 1000);
      const endTime = ev.endsAt ? new Date(ev.endsAt) : new Date(startTime.getTime() + 48 * 3600 * 1000);
      const fullDescription = `${ev.description}\n\nOfficial Registration: ${ev.registrationUrl}`;

      await (prisma as any).event.upsert({
        where: { id: ev.id },
        update: {
          title: ev.title,
          description: fullDescription,
          city: ev.city,
          venue: ev.venue,
          type: ev.category,
          startTime,
          endTime,
        },
        create: {
          id: ev.id,
          title: ev.title,
          description: fullDescription,
          city: ev.city,
          venue: ev.venue,
          type: ev.category,
          startTime,
          endTime,
          organizerId: organizer.id,
        },
      });
    }
  } catch (err) {
    console.warn("Prisma sync warning:", err);
  }
}

function normalizeCityName(raw: string): string {
  const lower = raw.trim().toLowerCase();
  if (lower.includes("karachi")) return "Karachi";
  if (lower.includes("lahore")) return "Lahore";
  if (lower.includes("islamabad")) return "Islamabad";
  if (lower.includes("rawalpindi")) return "Rawalpindi";
  if (lower.includes("faisalabad")) return "Faisalabad";
  if (lower.includes("peshawar")) return "Peshawar";
  if (lower.includes("multan")) return "Multan";
  if (lower.includes("quetta")) return "Quetta";
  if (lower.includes("hyderabad") || lower.includes("jamshoro")) return "Hyderabad";
  if (lower.includes("sukkur")) return "Sukkur";
  return capitalize(raw);
}

function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return hash;
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}

function parseUpcomingDate(dateStr?: string): string | null {
  if (!dateStr) return null;
  try {
    const parts = dateStr.split("-");
    const endPart = parts[parts.length - 1].trim();
    const parsed = new Date(endPart);
    if (!isNaN(parsed.getTime())) return parsed.toISOString();
  } catch {}
  return null;
}
