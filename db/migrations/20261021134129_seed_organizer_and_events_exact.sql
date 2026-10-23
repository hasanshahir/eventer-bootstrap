INSERT INTO "Organizer" ("id","name")
VALUES ('org_eventer_seed','Eventer Community')
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Event" ("id","title","description","city","venue","type","startTime","endTime","capacity","organizerId")
SELECT v.* FROM (VALUES
 ('evt_ned_techfest','NED Tech Fest: AI Hackathon','24-hour AI hackathon at NED University with workshops, mentors and prizes.','Karachi','NED University, AV Hall','HACKATHON','2026-11-14 09:00:00+05'::timestamptz,'2026-11-15 09:00:00+05'::timestamptz,250,'org_eventer_seed'),
 ('evt_gdg_devfest','GDG Kolachi DevFest 2026','Flagship Google developer community conference with talks on Android, Cloud and AI.','Karachi','Karachi Expo Centre','CONFERENCE','2026-11-21 10:00:00+05'::timestamptz,'2026-11-21 18:00:00+05'::timestamptz,500,'org_eventer_seed'),
 ('evt_softec26','SOFTEC ''26 Hackathon','FAST-NUCES flagship tech competition featuring a 36-hour hackathon.','Lahore','FAST-NUCES Lahore','HACKATHON','2026-11-27 09:00:00+05'::timestamptz,'2026-11-28 21:00:00+05'::timestamptz,400,'org_eventer_seed'),
 ('evt_nust_codesprint','NUST Olympiad CodeSprint','Competitive programming sprint run by the NUST Olympiad team.','Islamabad','NUST H-12 Campus','COMPETITION','2026-11-08 10:00:00+05'::timestamptz,'2026-11-08 17:00:00+05'::timestamptz,150,'org_eventer_seed')
) AS v(id,title,description,city,venue,type,"startTime","endTime",capacity,"organizerId")
WHERE NOT EXISTS (SELECT 1 FROM "Event" e WHERE e."title" = v.title);
