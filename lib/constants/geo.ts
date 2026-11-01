export interface CityDesk {
  slug: string;
  city: string;
  regionId: string;
  regionName: string;
  tag: string;
  subtitle: string;
  note: string;
  desc: string;
  tags: string[];
  latLng: string;
  lat: number | null;
  lng: number | null;
  isVirtual?: boolean;
}

export interface RegionalDivision {
  id: string;
  name: string;
  desks: CityDesk[];
}

export const REGIONAL_DIVISIONS: RegionalDivision[] = [
  {
    id: "01",
    name: "Federal & Virtual",
    desks: [
      {
        slug: "online",
        city: "Online / Virtual",
        regionId: "01",
        regionName: "Federal & Virtual",
        tag: "Nationwide Digital",
        subtitle: "Virtual Hackathons & Summits",
        note: "Virtual Hackathons & Global",
        desc: "Worldwide virtual hackathons, online code sprints, and global livestreams open to developers in Pakistan.",
        tags: ["#Remote", "#Global", "#AI"],
        latLng: "Nationwide / Global Circuit",
        lat: null,
        lng: null,
        isVirtual: true,
      },
      {
        slug: "islamabad",
        city: "Islamabad",
        regionId: "01",
        regionName: "Federal & Virtual",
        tag: "Federal AI & DeepTech",
        subtitle: "Federal AI & DeepTech",
        note: "NUST, FAST, COMSATS",
        desc: "NUST, FAST, COMSATS, Air University, and national cyber olympiads.",
        tags: ["#GenerativeAI", "#Robotics", "#Policy"],
        latLng: "33.6844° N / 73.0479° E",
        lat: 33.6844,
        lng: 73.0479,
      },
    ],
  },
  {
    id: "02",
    name: "Punjab Hubs",
    desks: [
      {
        slug: "lahore",
        city: "Lahore",
        regionId: "02",
        regionName: "Punjab Hubs",
        tag: "Startup & Dev Valley",
        subtitle: "Startup & Dev Valley",
        note: "LUMS, FAST, ITU, PUCIT",
        desc: "LUMS, FAST, ITU, UET, and PUCIT collegiate hackathon circuits.",
        tags: ["#Startups", "#SaaS", "#DeepTech"],
        latLng: "31.5204° N / 74.3587° E",
        lat: 31.5204,
        lng: 74.3587,
      },
      {
        slug: "rawalpindi",
        city: "Rawalpindi",
        regionId: "02",
        regionName: "Punjab Hubs",
        tag: "Twin Cities Circuit",
        subtitle: "Twin Cities Circuit",
        note: "Cyber & Security Sprints",
        desc: "Military College of Signals, engineering summits, and security conferences.",
        tags: ["#Cybersecurity", "#CTF", "#Hardware"],
        latLng: "33.5651° N / 73.0169° E",
        lat: 33.5651,
        lng: 73.0169,
      },
      {
        slug: "faisalabad",
        city: "Faisalabad",
        regionId: "02",
        regionName: "Punjab Hubs",
        tag: "Industrial Tech Center",
        subtitle: "Industrial Tech Center",
        note: "AgriTech & Youth Summits",
        desc: "University of Agriculture, FAST CFD, and emerging developer meetups.",
        tags: ["#AgriTech", "#Industrial", "#Youth"],
        latLng: "31.4504° N / 73.1350° E",
        lat: 31.4504,
        lng: 73.135,
      },
      {
        slug: "multan",
        city: "Multan",
        regionId: "02",
        regionName: "Punjab Hubs",
        tag: "South Punjab Devs",
        subtitle: "South Punjab Devs",
        note: "Bahauddin Zakariya Univ",
        desc: "Bahauddin Zakariya University, NFC IET, and Google Developer Groups.",
        tags: ["#MobileDev", "#Flutter", "#Web"],
        latLng: "30.1575° N / 71.5249° E",
        lat: 30.1575,
        lng: 71.5249,
      },
      {
        slug: "sialkot",
        city: "Sialkot",
        regionId: "02",
        regionName: "Punjab Hubs",
        tag: "Active Tech Community",
        subtitle: "Export & Software Hub",
        note: "University of Sialkot & regional dev circles.",
        desc: "Industrial software engineering and regional campus developer circles.",
        tags: ["#SaaS", "#ExportTech", "#Web"],
        latLng: "32.4945° N / 74.5229° E",
        lat: 32.4945,
        lng: 74.5229,
      },
      {
        slug: "gujranwala",
        city: "Gujranwala",
        regionId: "02",
        regionName: "Punjab Hubs",
        tag: "Active Tech Community",
        subtitle: "Central Punjab Circuit",
        note: "UET Gujranwala & PU Gujranwala Campus.",
        desc: "Campus developer societies and central Punjab engineering meetups.",
        tags: ["#Web", "#Engineering", "#Campus"],
        latLng: "32.1877° N / 74.1945° E",
        lat: 32.1877,
        lng: 74.1945,
      },
    ],
  },
  {
    id: "03",
    name: "Sindh Hubs",
    desks: [
      {
        slug: "karachi",
        city: "Karachi",
        regionId: "03",
        regionName: "Sindh Hubs",
        tag: "Coastal Mega Hub",
        subtitle: "Mega coastal tech hub",
        note: "FAST, NED, IBA, Habib",
        desc: "Home to NED, FAST, IBA, Habib, and Pakistan's largest developer density.",
        tags: ["#Fintech", "#Hackathons", "#AI / ML"],
        latLng: "24.8607° N / 67.0011° E",
        lat: 24.8607,
        lng: 67.0011,
      },
      {
        slug: "hyderabad",
        city: "Hyderabad",
        regionId: "03",
        regionName: "Sindh Hubs",
        tag: "Sindh Univ Circuit",
        subtitle: "Sindh Univ Circuit",
        note: "Mehran UET & UoS Jamshoro",
        desc: "Mehran UET and Sindh University technology competitions.",
        tags: ["#Engineering", "#IoT", "#Python"],
        latLng: "25.3960° N / 68.3578° E",
        lat: 25.396,
        lng: 68.3578,
      },
      {
        slug: "sukkur",
        city: "Sukkur",
        regionId: "03",
        regionName: "Sindh Hubs",
        tag: "Upper Sindh Tech Oasis",
        subtitle: "Upper Sindh Tech Oasis",
        note: "Sukkur IBA University",
        desc: "Sukkur IBA University and regional Sindh developer initiatives.",
        tags: ["#Fintech", "#AI", "#CampusHack"],
        latLng: "27.7052° N / 68.8574° E",
        lat: 27.7052,
        lng: 68.8574,
      },
    ],
  },
  {
    id: "04",
    name: "Khyber Pakhtunkhwa",
    desks: [
      {
        slug: "peshawar",
        city: "Peshawar",
        regionId: "04",
        regionName: "Khyber Pakhtunkhwa",
        tag: "Frontier Tech Hub",
        subtitle: "Frontier Tech Hub",
        note: "UET Peshawar, IM|Sciences",
        desc: "UET Peshawar, IM|Sciences, and KP IT Board hackathons.",
        tags: ["#OpenSource", "#Cloud", "#YouthDev"],
        latLng: "34.0151° N / 71.5249° E",
        lat: 34.0151,
        lng: 71.5249,
      },
      {
        slug: "topi",
        city: "Topi (GIKI)",
        regionId: "04",
        regionName: "Khyber Pakhtunkhwa",
        tag: "GIKI Tech Oasis",
        subtitle: "GIKI Engineering Circuit",
        note: "ACM All-Pakistan Olympiad",
        desc: "GIK Institute of Engineering Sciences and Technology national olympiads.",
        tags: ["#Robotics", "#Algorithms", "#Hardware"],
        latLng: "34.0704° N / 72.6208° E",
        lat: 34.0704,
        lng: 72.6208,
      },
      {
        slug: "abbottabad",
        city: "Abbottabad",
        regionId: "04",
        regionName: "Khyber Pakhtunkhwa",
        tag: "Hazara Campus Hub",
        subtitle: "Hazara University & COMSATS",
        note: "COMSATS Abbottabad & UET Campus.",
        desc: "COMSATS Abbottabad software engineering and mountain tech sprints.",
        tags: ["#Software", "#Campus", "#AI"],
        latLng: "34.1688° N / 73.2215° E",
        lat: 34.1688,
        lng: 73.2215,
      },
      {
        slug: "mardan",
        city: "Mardan",
        regionId: "04",
        regionName: "Khyber Pakhtunkhwa",
        tag: "Active Tech Community",
        subtitle: "UET Mardan Circuit",
        note: "UET Mardan & AWKUM.",
        desc: "University of Engineering & Technology Mardan developer competitions.",
        tags: ["#Engineering", "#Web", "#Students"],
        latLng: "34.1986° N / 72.0404° E",
        lat: 34.1986,
        lng: 72.0404,
      },
      {
        slug: "swat",
        city: "Swat",
        regionId: "04",
        regionName: "Khyber Pakhtunkhwa",
        tag: "Active Tech Community",
        subtitle: "University of Swat Circuit",
        note: "Regional developer community.",
        desc: "Emerging student developer community in Malakand division.",
        tags: ["#YouthDev", "#OpenSource", "#Web"],
        latLng: "34.7717° N / 72.3602° E",
        lat: 34.7717,
        lng: 72.3602,
      },
    ],
  },
  {
    id: "05",
    name: "Balochistan & Emerging",
    desks: [
      {
        slug: "quetta",
        city: "Quetta",
        regionId: "05",
        regionName: "Balochistan & Emerging",
        tag: "Balochistan Tech Hub",
        subtitle: "Balochistan Tech Hub",
        note: "BUITEMS & UoB Hub",
        desc: "BUITEMS & UoB developer incubators and hackathons.",
        tags: ["#Innovation", "#Digital", "#Access"],
        latLng: "30.1798° N / 66.9750° E",
        lat: 30.1798,
        lng: 66.975,
      },
      {
        slug: "gilgit",
        city: "Gilgit",
        regionId: "05",
        regionName: "Balochistan & Emerging",
        tag: "Northern Tech Hub",
        subtitle: "Karakoram International Univ",
        note: "KIU & Gilgit-Baltistan software parks.",
        desc: "Karakoram International University and northern freelance/startup hubs.",
        tags: ["#Remote", "#Cloud", "#Startups"],
        latLng: "35.9208° N / 74.3083° E",
        lat: 35.9208,
        lng: 74.3083,
      },
      {
        slug: "muzaffarabad",
        city: "Muzaffarabad",
        regionId: "05",
        regionName: "Balochistan & Emerging",
        tag: "AJK Campus Circuit",
        subtitle: "University of AJK",
        note: "UAJK King Abdullah Campus.",
        desc: "AJK student computing societies and regional hackathons.",
        tags: ["#Campus", "#Web", "#Mobile"],
        latLng: "34.3700° N / 73.4711° E",
        lat: 34.37,
        lng: 73.4711,
      },
      {
        slug: "gwadar",
        city: "Gwadar",
        regionId: "05",
        regionName: "Balochistan & Emerging",
        tag: "Coastal Emerging Desk",
        subtitle: "University of Gwadar",
        note: "Coastal Balochistan tech initiatives.",
        desc: "University of Gwadar and coastal digital skills programs.",
        tags: ["#Emerging", "#MaritimeTech", "#Youth"],
        latLng: "25.1216° N / 62.3254° E",
        lat: 25.1216,
        lng: 62.3254,
      },
    ],
  },
];

export const ALL_CITY_DESKS: CityDesk[] = REGIONAL_DIVISIONS.flatMap(
  (r) => r.desks
);

export const CITY_DESK_MAP: Record<string, CityDesk> = Object.fromEntries(
  ALL_CITY_DESKS.map((d) => [d.slug, d])
);

export const CITY_DOSSIERS: Record<
  string,
  { latLng: string; subtitle: string; tags: string[]; desc: string }
> = Object.fromEntries(
  ALL_CITY_DESKS.map((d) => [
    d.isVirtual ? "Online" : d.city,
    {
      latLng: d.latLng,
      subtitle: d.subtitle,
      tags: d.tags,
      desc: d.desc,
    },
  ])
);

export function getCityDeskBySlug(slug: string): CityDesk | undefined {
  const norm = slug.trim().toLowerCase();
  return ALL_CITY_DESKS.find(
    (d) =>
      d.slug.toLowerCase() === norm ||
      d.city.toLowerCase() === norm
  );
}

export function haversineDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Finds the nearest physical Pakistani city desk within `maxRadiusKm` (default 150 km).
 * If the user's coordinates are outside the 150 km cutoff (e.g. abroad), returns
 * `withinCutoff: false` so the UI does not falsely snap to Quetta or Karachi (fixes F-14).
 */
export function findNearestCityDesk(
  lat: number,
  lng: number,
  maxRadiusKm = 150
): {
  desk: CityDesk;
  distanceKm: number;
  withinCutoff: boolean;
} {
  const physicalDesks = ALL_CITY_DESKS.filter(
    (d) => !d.isVirtual && typeof d.lat === "number" && typeof d.lng === "number"
  );

  let nearest = physicalDesks[0];
  let minDistance = Infinity;

  for (const desk of physicalDesks) {
    const dist = haversineDistanceKm(lat, lng, desk.lat!, desk.lng!);
    if (dist < minDistance) {
      minDistance = dist;
      nearest = desk;
    }
  }

  return {
    desk: nearest,
    distanceKm: Math.round(minDistance),
    withinCutoff: minDistance <= maxRadiusKm,
  };
}

