/* ---------- Festival calendar for the Festivals channel (dates in IST) ----------
   from: songs start   day: the festival itself   to: songs end   cat: song category in scripts/feeds.json
   Lunar dates from Drik Panchang; Eid dates are estimates until the moon is sighted. Add next year's rows before Oct 2027. */
const FESTIVALS = [
  {"name":"Navratri & Durga Puja","cat":"fest-navratri","from":"2026-10-11","day":"2026-10-11","to":"2026-10-19"},
  {"name":"Dussehra","cat":"fest-ram","from":"2026-10-20","day":"2026-10-20","to":"2026-10-20"},
  {"name":"Karva Chauth","cat":"fest-karvachauth","from":"2026-10-27","day":"2026-10-29","to":"2026-10-29"},
  {"name":"Diwali","cat":"fest-diwali","from":"2026-11-03","day":"2026-11-08","to":"2026-11-11"},
  {"name":"Chhath Puja","cat":"fest-chhath","from":"2026-11-12","day":"2026-11-15","to":"2026-11-15"},
  {"name":"Guru Nanak Jayanti","cat":"fest-gurpurab","from":"2026-11-22","day":"2026-11-24","to":"2026-11-24"},
  {"name":"Christmas","cat":"fest-christmas","from":"2026-12-18","day":"2026-12-25","to":"2026-12-26"},
  {"name":"New Year","cat":"fest-newyear","from":"2026-12-30","day":"2027-01-01","to":"2027-01-01"},
  {"name":"Lohri & Makar Sankranti","cat":"fest-lohri","from":"2027-01-10","day":"2027-01-13","to":"2027-01-15"},
  {"name":"Republic Day","cat":"fest-patriotic","from":"2027-01-24","day":"2027-01-26","to":"2027-01-26"},
  {"name":"Maha Shivratri","cat":"fest-shivratri","from":"2027-03-04","day":"2027-03-06","to":"2027-03-06"},
  {"name":"Eid ul-Fitr","cat":"fest-eid","from":"2027-03-08","day":"2027-03-10","to":"2027-03-11"},
  {"name":"Holi","cat":"fest-holi","from":"2027-03-17","day":"2027-03-22","to":"2027-03-22"},
  {"name":"Ram Navami","cat":"fest-ram","from":"2027-04-12","day":"2027-04-14","to":"2027-04-14"},
  {"name":"Eid al-Adha","cat":"fest-eid","from":"2027-05-14","day":"2027-05-16","to":"2027-05-17"},
  {"name":"Independence Day","cat":"fest-patriotic","from":"2027-08-12","day":"2027-08-15","to":"2027-08-15"},
  {"name":"Raksha Bandhan","cat":"fest-rakhi","from":"2027-08-16","day":"2027-08-17","to":"2027-08-17"},
  {"name":"Janmashtami","cat":"fest-janmashtami","from":"2027-08-22","day":"2027-08-25","to":"2027-08-25"},
  {"name":"Ganesh Chaturthi","cat":"fest-ganesh","from":"2027-09-01","day":"2027-09-04","to":"2027-09-14"},
  {"name":"Navratri","cat":"fest-navratri","from":"2027-09-30","day":"2027-09-30","to":"2027-10-08"},
  {"name":"Dussehra","cat":"fest-ram","from":"2027-10-09","day":"2027-10-09","to":"2027-10-09"},
  {"name":"Diwali","cat":"fest-diwali","from":"2027-10-24","day":"2027-10-29","to":"2027-10-31"}
];
