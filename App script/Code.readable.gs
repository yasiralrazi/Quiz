/* =========================================================
   Code.gs - সিরাত কুইজ অলিম্পিয়াডের সার্ভার (Google Apps Script)
   শিটের শুধু একটা ট্যাব ("Registrations") ব্যবহার করে।

   বসানোর নিয়ম:
   ১. Google Sheet > Extensions > Apps Script > সব মুছে এই কোড পেস্ট > Save
   ২. Deploy > New deployment > Web app (Execute as: Me, Access: Anyone)
   ৩. Authorize করে "Web app URL" কপি করুন, config.js এ বসান
   কোড বদলালে: Deploy > Manage deployments > Edit > New version > Deploy
   ========================================================= */

var SHEET_NAME = "Registrations";
var SITE = "সিরাত কুইজ অলিম্পিয়াড";
var MAX_TRIES = 5;     // কতবার ভুল পাসওয়ার্ডের পর আটকাবে
var LOCK_MIN = 15;     // আটকে থাকার সময় (মিনিট)
var RESET_MIN = 10;    // রিসেট কোডের মেয়াদ (মিনিট)

// শিটের কলাম (এই ক্রমে)। শেষ দুইটা লগইন সেশনের জন্য।
var HEADERS = [
  "Timestamp", "Candidate ID", "Full Name", "Institute", "Email", "Mobile",
  "Class", "Category", "Gender", "Date of Birth", "Division", "District",
  "Upazila", "Password (Hashed)", "Session (Hashed)", "Session Expires"
];

// কোন তথ্য কততম কলামে (১ থেকে গোনা)
var C = {
  id: 2, name: 3, inst: 4, email: 5, mobile: 6, cls: 7, cat: 8, gender: 9,
  dob: 10, div: 11, dist: 12, upz: 13, pass: 14, token: 15, expires: 16
};

// ---------- ঢোকার দরজা ----------

function doGet() {
  return reply(true, "Seerah Quiz Olympiad server is running.");
}

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var actions = {
      register: register,
      login: login,
      profile: profile,
      logout: logout,
      requestReset: requestReset,
      resetPassword: resetPassword
    };

    var action = data.action || "register";
    if (!actions[action]) {
      return reply(false, "অজানা অনুরোধ।");
    }
    return actions[action](data);

  } catch (error) {
    return reply(false, "সার্ভারে সমস্যা হয়েছে, একটু পরে আবার চেষ্টা করুন।");
  }
}

// ---------- ১. রেজিস্ট্রেশন ----------

function register(data) {
  var problem = checkRegistration(data);
  if (problem) {
    return reply(false, problem);
  }

  var email = String(data.email).trim().toLowerCase();
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);

  try {
    var sheet = getSheet();

    // একই ইমেইল বা মোবাইল আগে থেকে আছে কিনা
    if (findRow(function (v) { return String(v[C.email - 1]).toLowerCase() === email; })) {
      return reply(false, "এই ইমেইল দিয়ে আগেই রেজিস্ট্রেশন করা হয়েছে।");
    }
    if (findRow(function (v) { return String(v[C.mobile - 1]) === data.mobile; })) {
      return reply(false, "এই মোবাইল নম্বর দিয়ে আগেই রেজিস্ট্রেশন করা হয়েছে।");
    }

    var candidateId = makeCandidateId();
    var row = [
      Utilities.formatDate(new Date(), "Asia/Dhaka", "yyyy-MM-dd HH:mm:ss"),
      candidateId, data.name, data.inst, email, data.mobile, data.cls,
      data.category, data.gender, data.dob, data.division, data.district,
      data.upazila, hashPassword(data.password)
    ];

    // "@" = প্লেইন টেক্সট (মোবাইলের শুরুর 0 মুছে যাবে না)
    var newRow = sheet.getLastRow() + 1;
    sheet.getRange(newRow, 1, 1, HEADERS.length).setNumberFormat("@");
    sheet.getRange(newRow, 1, 1, row.length).setValues([row]);

    return reply(true, "ok", { candidateId: candidateId });

  } finally {
    lock.releaseLock();
  }
}

// ---------- ২. লগইন ----------

function login(data) {
  var id = String(data.id || "").trim();
  var password = String(data.password || "");

  if (id === "" || password === "") {
    return reply(false, "আইডি ও পাসওয়ার্ড দিন।");
  }

  // ভুল পাসওয়ার্ডের হিসাব (পাসওয়ার্ড অনুমান করা ঠেকাতে)
  var cache = CacheService.getScriptCache();
  var failKey = "fail_" + shortHash(id.toLowerCase());
  var fails = Number(cache.get(failKey)) || 0;

  if (fails >= MAX_TRIES) {
    return reply(false, "অনেকবার ভুল হয়েছে। " + LOCK_MIN + " মিনিট পরে চেষ্টা করুন।");
  }

  var user = findUser(id);

  if (!user || !verifyPassword(user.v[C.pass - 1], password)) {
    cache.put(failKey, String(fails + 1), LOCK_MIN * 60);
    if (fails + 1 >= MAX_TRIES) {
      return reply(false, MAX_TRIES + " বার ভুল হয়েছে। " + LOCK_MIN + " মিনিট অপেক্ষা করুন।");
    }
    return reply(false, "আইডি বা পাসওয়ার্ড ভুল। বাকি চেষ্টা: " + (MAX_TRIES - fails - 1));
  }

  cache.remove(failKey);

  // লগইন টোকেন বানিয়ে ব্যবহারকারীর নিজের সারিতেই (হ্যাশ করে) রাখা
  var token = Utilities.getUuid() + Utilities.getUuid();
  var days = data.remember ? 30 : 1;
  var expires = new Date().getTime() + days * 24 * 60 * 60 * 1000;
  var cells = getSheet().getRange(user.row, C.token, 1, 2);

  cells.setNumberFormat("@");
  cells.setValues([[sha256(token), String(expires)]]);

  return reply(true, "ok", {
    token: token,
    name: user.v[C.name - 1],
    candidateId: user.v[C.id - 1]
  });
}

// ---------- ৩. প্রোফাইল (ড্যাশবোর্ডের জন্য) ----------

function profile(data) {
  var user = findByToken(data.token);
  if (!user) {
    return reply(false, "সেশন শেষ হয়ে গেছে। আবার লগইন করুন।");
  }

  var v = user.v;
  return reply(true, "ok", {
    candidateId: v[C.id - 1], name: v[C.name - 1], inst: v[C.inst - 1],
    email: v[C.email - 1], mobile: v[C.mobile - 1], cls: v[C.cls - 1],
    category: v[C.cat - 1], gender: v[C.gender - 1], dob: v[C.dob - 1],
    division: v[C.div - 1], district: v[C.dist - 1], upazila: v[C.upz - 1]
  });
}

// ---------- ৪. লগআউট ----------

function logout(data) {
  var user = findByToken(data.token);
  if (user) {
    clearSession(user.row);
  }
  return reply(true, "ok");
}

// ---------- ৫. রিসেট কোড ইমেইলে পাঠানো ----------

function requestReset(data) {
  var id = String(data.id || "").trim();
  if (id === "") {
    return reply(false, "মোবাইল বা ইমেইল দিন।");
  }

  var cache = CacheService.getScriptCache();
  var coolKey = "cool_" + shortHash(id.toLowerCase());

  if (cache.get(coolKey)) {
    return reply(false, "একটু অপেক্ষা করুন, ৬০ সেকেন্ড পরে আবার চেষ্টা করুন।");
  }
  cache.put(coolKey, "1", 60);

  var user = findUser(id);

  if (user) {
    var candidateId = user.v[C.id - 1];
    var code = String(Math.floor(100000 + Math.random() * 900000));

    // কোড হ্যাশ করে অস্থায়ীভাবে রাখা
    cache.put("reset_" + candidateId, shortHash(code + candidateId), RESET_MIN * 60);
    cache.remove("resetfail_" + candidateId);

    MailApp.sendEmail({
      to: user.v[C.email - 1],
      subject: SITE + " - পাসওয়ার্ড রিসেট কোড",
      body: "আসসালামু আলাইকুম " + user.v[C.name - 1] + ",\n\n" +
            "আপনার পাসওয়ার্ড রিসেট কোড: " + code + "\n\n" +
            "এই কোড " + RESET_MIN + " মিনিট পর্যন্ত কাজ করবে।\n" +
            "আপনি অনুরোধ না করে থাকলে এই ইমেইল উপেক্ষা করুন।\n\n" + SITE
    });
  }

  // অ্যাকাউন্ট থাকুক বা না থাকুক একই উত্তর (কার অ্যাকাউন্ট আছে তা গোপন রাখতে)
  return reply(true, "ok");
}

// ---------- ৬. কোড দিয়ে নতুন পাসওয়ার্ড ----------

function resetPassword(data) {
  var code = String(data.code || "").trim();
  var newPassword = String(data.newPassword || "");

  var problem = checkPassword(newPassword);
  if (problem) {
    return reply(false, problem);
  }

  var user = findUser(String(data.id || "").trim());
  if (!user || code === "") {
    return reply(false, "কোড ভুল বা মেয়াদ শেষ।");
  }

  var candidateId = user.v[C.id - 1];
  var cache = CacheService.getScriptCache();
  var fails = Number(cache.get("resetfail_" + candidateId)) || 0;

  if (fails >= 5) {
    return reply(false, "অনেকবার ভুল কোড দিয়েছেন। নতুন কোড চেয়ে নিন।");
  }

  if (cache.get("reset_" + candidateId) !== shortHash(code + candidateId)) {
    cache.put("resetfail_" + candidateId, String(fails + 1), RESET_MIN * 60);
    return reply(false, "কোড ভুল বা মেয়াদ শেষ।");
  }

  getSheet().getRange(user.row, C.pass).setValue(hashPassword(newPassword));
  clearSession(user.row); // পুরনো লগইন বাতিল
  cache.remove("reset_" + candidateId);
  cache.remove("resetfail_" + candidateId);

  return reply(true, "ok");
}

// =========================================================
// সাহায্যকারী ফাংশন
// =========================================================

// ব্রাউজারকে JSON উত্তর পাঠানো (extra এর তথ্য উত্তরের সাথে যুক্ত হয়)
function reply(success, message, extra) {
  var result = { success: success, message: message };

  for (var key in extra) {
    result[key] = extra[key];
  }

  return ContentService
    .createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

// রেজিস্ট্রেশন শিট খুঁজে নেওয়া (না থাকলে বানানো, হেডার ঠিক রাখা)
function getSheet() {
  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = spreadsheet.getSheetByName(SHEET_NAME) || spreadsheet.insertSheet(SHEET_NAME);

  if (sheet.getLastRow() === 0 || sheet.getRange(1, C.expires).getValue() === "") {
    sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
    sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight("bold");
    sheet.setFrozenRows(1);
  }

  return sheet;
}

// শর্ত মেলে এমন প্রথম সারি খোঁজা। test(v) সত্য হলে সেই সারি ফেরত আসে।
function findRow(test) {
  var sheet = getSheet();
  var lastRow = sheet.getLastRow();

  if (lastRow < 2) {
    return null;
  }

  var rows = sheet.getRange(2, 1, lastRow - 1, HEADERS.length).getValues();

  for (var i = 0; i < rows.length; i++) {
    if (test(rows[i])) {
      return { row: i + 2, v: rows[i] };
    }
  }

  return null;
}

// মোবাইল, ইমেইল বা ক্যান্ডিডেট আইডি দিয়ে ব্যবহারকারী খোঁজা
function findUser(id) {
  var text = String(id).trim();

  return findRow(function (v) {
    return String(v[C.id - 1]).toUpperCase() === text.toUpperCase() ||
           String(v[C.email - 1]).toLowerCase() === text.toLowerCase() ||
           String(v[C.mobile - 1]) === text;
  });
}

// লগইন টোকেন দিয়ে ব্যবহারকারী খোঁজা (মেয়াদ শেষ হলে পাওয়া যাবে না)
function findByToken(token) {
  if (!token) {
    return null;
  }

  var hash = sha256(String(token));
  var now = new Date().getTime();

  return findRow(function (v) {
    return v[C.token - 1] === hash && Number(v[C.expires - 1]) > now;
  });
}

// একটা সারির লগইন সেশন মুছে ফেলা
function clearSession(row) {
  getSheet().getRange(row, C.token, 1, 2).setValues([["", ""]]);
}

// পাসওয়ার্ড: ৮+ অক্ষর, বড় হাতের, ছোট হাতের, সংখ্যা
function checkPassword(p) {
  if (p.length < 8 || !/[a-z]/.test(p) || !/[A-Z]/.test(p) || !/[0-9]/.test(p)) {
    return "পাসওয়ার্ড কমপক্ষে ৮ অক্ষর, বড়/ছোট হাতের অক্ষর ও সংখ্যা সহ হতে হবে।";
  }
  return "";
}

// রেজিস্ট্রেশনের তথ্য সার্ভারেও যাচাই
function checkRegistration(data) {
  var required = ["name", "inst", "email", "mobile", "password", "cls",
                  "category", "gender", "dob", "division", "district", "upazila"];

  for (var i = 0; i < required.length; i++) {
    if (String(data[required[i]] || "").trim() === "") {
      return "সব তথ্য পূরণ করুন।";
    }
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(data.email)) {
    return "সঠিক ইমেইল দিন।";
  }
  if (!/^01[3-9][0-9]{8}$/.test(data.mobile)) {
    return "সঠিক মোবাইল নম্বর দিন।";
  }
  return checkPassword(String(data.password));
}

// ক্যান্ডিডেট আইডি: SQO-00001, SQO-00002 ...
function makeCandidateId() {
  var properties = PropertiesService.getScriptProperties();
  var next = (Number(properties.getProperty("lastCandidateNumber")) || 0) + 1;

  properties.setProperty("lastCandidateNumber", String(next));

  return "SQO-" + ("00000" + next).slice(-5);
}

// ---------- হ্যাশ (আসল পাসওয়ার্ড কোথাও জমা থাকে না) ----------

function sha256(text) {
  var bytes = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256, text, Utilities.Charset.UTF_8
  );
  var hex = "";

  for (var i = 0; i < bytes.length; i++) {
    hex += ("0" + (bytes[i] & 255).toString(16)).slice(-2);
  }
  return hex;
}

function shortHash(text) {
  return sha256(text).slice(0, 32);
}

function hashPassword(password) {
  var salt = Utilities.getUuid().replace(/-/g, "").slice(0, 16);
  return salt + ":" + sha256(salt + password);
}

function verifyPassword(stored, password) {
  var parts = String(stored).split(":");
  return parts.length === 2 && sha256(parts[0] + password) === parts[1];
}
