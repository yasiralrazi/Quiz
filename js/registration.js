/* =========================================================
   registration.js - রেজিস্ট্রেশন পেজের জাভাস্ক্রিপ্ট (সহজ ভাষায় লেখা)
   ========================================================= */

// ---------- ১. এলিমেন্ট খুঁজে নেওয়া ----------
var regForm = document.getElementById("regForm");
var nameInput = document.getElementById("name");
var instInput = document.getElementById("inst");
var emailInput = document.getElementById("email");
var mobileInput = document.getElementById("mobile");
var pwInput = document.getElementById("pw");
var pw2Input = document.getElementById("pw2");
var clsSelect = document.getElementById("cls");
var catInput = document.getElementById("cat");
var genderSelect = document.getElementById("gender");
var dobInput = document.getElementById("dob");
var divisionSelect = document.getElementById("division");
var districtSelect = document.getElementById("district");
var upazilaSelect = document.getElementById("upazila");
var confirmBox = document.getElementById("confirm");

// যে ঘরগুলো যাচাই করতে হবে তাদের আইডির তালিকা
var fieldIds = [
  "name", "inst", "email", "mobile", "pw", "pw2",
  "cls", "gender", "dob", "division", "district", "upazila"
];

// ---------- ২. ডেটা: শ্রেণি ও ক্যাটাগরি ----------
// প্রতিটি লাইনে: [শ্রেণি, ক্যাটাগরি]
var classList = [
  ["Class 3", "Primary"],
  ["Class 4", "Primary"],
  ["Class 5", "Primary"],
  ["Class 6", "Junior"],
  ["Class 7", "Junior"],
  ["Class 8", "Junior"],
  ["Class 9", "Secondary"],
  ["Class 10", "Secondary"],
  ["Class 11", "Higher Secondary"],
  ["Class 12", "Higher Secondary"]
];

// ---------- ৩. ডেটা: বিভাগ > জেলা > উপজেলা ----------
// (নমুনা তালিকা, দরকার মতো বাড়িয়ে নিন)
var places = {
  "Dhaka": {
    "Dhaka": ["Savar", "Dhamrai", "Keraniganj", "Nawabganj", "Dohar"],
    "Gazipur": ["Gazipur Sadar", "Kaliakair", "Kapasia", "Sreepur"]
  },
  "Chattogram": {
    "Chattogram": ["Hathazari", "Sitakunda", "Patiya", "Raozan"],
    "Cox's Bazar": ["Cox's Bazar Sadar", "Teknaf", "Ukhia"]
  },
  "Rajshahi": {
    "Rajshahi": ["Paba", "Bagmara", "Godagari"],
    "Bogura": ["Bogura Sadar", "Shibganj", "Sherpur"]
  },
  "Khulna": {
    "Khulna": ["Dumuria", "Batiaghata", "Dacope"],
    "Jashore": ["Jashore Sadar", "Benapole", "Sharsha"]
  },
  "Sylhet": {
    "Sylhet": ["Sylhet Sadar", "Beanibazar", "Jaintiapur"],
    "Moulvibazar": ["Moulvibazar Sadar", "Sreemangal", "Kulaura"]
  },
  "Barishal": {
    "Barishal": ["Barishal Sadar", "Bakerganj", "Muladi"]
  },
  "Rangpur": {
    "Rangpur": ["Rangpur Sadar", "Mithapukur", "Badarganj"]
  },
  "Mymensingh": {
    "Mymensingh": ["Mymensingh Sadar", "Muktagachha", "Trishal"]
  }
};

// ---------- ৪. ড্রপডাউন ভরার ফাংশন ----------

// একটা select বক্সে তালিকার সব আইটেম বসায়
function fillSelect(select, items) {
  // প্রথম "-- Select --" রেখে বাকি সব মুছে ফেলা
  select.length = 1;

  for (var i = 0; i < items.length; i++) {
    select.add(new Option(items[i], items[i]));
  }

  // তালিকা ফাঁকা হলে বক্স বন্ধ থাকবে
  select.disabled = (items.length === 0);
}

// জেলার নামগুলো একটা তালিকায় আনা
function getDistricts(division) {
  if (places[division]) {
    return Object.keys(places[division]);
  }
  return [];
}

// উপজেলার নামগুলো একটা তালিকায় আনা
function getUpazilas(division, district) {
  if (places[division] && places[division][district]) {
    return places[division][district];
  }
  return [];
}

// পেজ খোলার সময় শ্রেণি ও বিভাগ ভরে দেওয়া
for (var c = 0; c < classList.length; c++) {
  clsSelect.add(new Option(classList[c][0], classList[c][0]));
}
fillSelect(divisionSelect, Object.keys(places));

// জন্ম তারিখে আজকের পরের তারিখ বেছে নেওয়া যাবে না
dobInput.max = new Date().toISOString().slice(0, 10);

// ---------- ৫. বয়স বের করার ফাংশন ----------
function calculateAge(dateText) {
  var birth = new Date(dateText);
  var today = new Date();

  var age = today.getFullYear() - birth.getFullYear();

  // এ বছর জন্মদিন এখনো না এলে বয়স ১ কমবে
  var monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age = age - 1;
  }

  return age;
}

// ---------- ৬. যাচাই (Validation) ----------
// ঠিক থাকলে ফাঁকা লেখা ("") ফেরত দেয়, ভুল থাকলে এরর বার্তা ফেরত দেয়
function getErrorMessage(id) {
  var value = document.getElementById(id).value;

  if (id === "name") {
    if (value.trim().length < 3 || /[0-9]/.test(value)) {
      return "নাম অন্তত ৩ অক্ষরের হতে হবে (সংখ্যা ছাড়া)।";
    }
  }

  if (id === "inst") {
    if (value.trim().length < 2) {
      return "প্রতিষ্ঠানের নাম লিখুন।";
    }
  }

  if (id === "email") {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value)) {
      return "সঠিক ইমেইল দিন।";
    }
  }

  if (id === "mobile") {
    if (!/^01[3-9][0-9]{8}$/.test(value)) {
      return "০১ দিয়ে শুরু ১১ সংখ্যার নম্বর দিন।";
    }
  }

  if (id === "pw") {
    var longEnough = value.length >= 8;
    var hasLower = /[a-z]/.test(value);
    var hasUpper = /[A-Z]/.test(value);
    var hasNumber = /[0-9]/.test(value);

    if (!longEnough || !hasLower || !hasUpper || !hasNumber) {
      return "৮+ অক্ষর, বড়/ছোট হাতের অক্ষর ও সংখ্যা লাগবে।";
    }
  }

  if (id === "pw2") {
    if (value === "" || value !== pwInput.value) {
      return "পাসওয়ার্ড মিলছে না।";
    }
  }

  if (id === "cls") {
    if (value === "") {
      return "শ্রেণি নির্বাচন করুন।";
    }
  }

  if (id === "gender") {
    if (value === "") {
      return "লিঙ্গ নির্বাচন করুন।";
    }
  }

  if (id === "dob") {
    if (value === "") {
      return "জন্ম তারিখ সঠিক দিন (বয়স ৫–৩০)।";
    }
    var age = calculateAge(value);
    if (age < 5 || age > 30) {
      return "জন্ম তারিখ সঠিক দিন (বয়স ৫–৩০)।";
    }
  }

  if (id === "division") {
    if (value === "") {
      return "বিভাগ নির্বাচন করুন।";
    }
  }

  if (id === "district") {
    if (value === "") {
      return "জেলা নির্বাচন করুন।";
    }
  }

  if (id === "upazila") {
    if (value === "") {
      return "উপজেলা নির্বাচন করুন।";
    }
  }

  return ""; // কোনো ভুল নেই
}

// একটা ঘর যাচাই করে এরর দেখায়। ঠিক থাকলে true ফেরত দেয়।
function checkField(id) {
  var input = document.getElementById(id);
  var errBox = document.getElementById(id + "Err");
  var message = getErrorMessage(id);

  if (message !== "") {
    input.classList.add("bad");
    input.classList.remove("good");
  } else {
    input.classList.remove("bad");
    input.classList.add("good");
  }

  errBox.textContent = message;

  return message === "";
}

// ---------- ৭. প্রগ্রেস বার ----------
function updateProgress() {
  var doneCount = 0;

  // কয়টা ঘর ঠিকঠাক পূরণ হয়েছে গুনছি
  for (var i = 0; i < fieldIds.length; i++) {
    if (getErrorMessage(fieldIds[i]) === "") {
      doneCount = doneCount + 1;
    }
  }

  // টিক চিহ্নও ১টা ধাপ
  if (confirmBox.checked) {
    doneCount = doneCount + 1;
  }

  var total = fieldIds.length + 1;
  var percent = Math.round((doneCount / total) * 100);

  document.getElementById("fill").style.width = percent + "%";
  document.getElementById("pct").textContent = percent + "% সম্পূর্ণ";
}

// ---------- ৮. পাসওয়ার্ড শক্তি মাপা ----------
function updateStrength() {
  var value = pwInput.value;
  var score = 0;

  if (value.length >= 8) {
    score = score + 1;
  }
  if (/[a-z]/.test(value) && /[A-Z]/.test(value)) {
    score = score + 1;
  }
  if (/[0-9]/.test(value)) {
    score = score + 1;
  }
  if (/[^a-zA-Z0-9]/.test(value) || value.length >= 12) {
    score = score + 1;
  }

  var colors = ["#c2342f", "#d9822b", "#c9a400", "#15803d"];
  var labels = ["খুব দুর্বল", "মাঝারি", "ভালো", "শক্তিশালী"];
  var colorIndex = Math.max(score - 1, 0);

  // ৪টা ছোট বারের মধ্যে score সংখ্যক বার রঙিন হবে
  var bars = document.getElementById("meter").querySelectorAll("i");
  for (var i = 0; i < bars.length; i++) {
    if (i < score) {
      bars[i].classList.add("on");
    } else {
      bars[i].classList.remove("on");
    }
    bars[i].style.setProperty("--c", colors[colorIndex]);
  }

  var hint = document.getElementById("pwHint");
  if (value === "") {
    hint.textContent = "অন্তত ৮ অক্ষর, বড়-ছোট হাতের অক্ষর ও সংখ্যা দিন";
  } else {
    hint.textContent = "পাসওয়ার্ড: " + labels[colorIndex];
  }
}

// ---------- ৯. ছোট বার্তা (Toast) ----------
function showToast(message) {
  var toast = document.getElementById("toast");
  toast.textContent = message;
  toast.classList.add("show");

  setTimeout(function () {
    toast.classList.remove("show");
  }, 2400);
}

// ---------- ১০. ড্রাফট সেভ ও ফিরিয়ে আনা ----------
// (পাসওয়ার্ড কখনো সেভ করা হয় না)
var saveFields = [
  "name", "inst", "email", "mobile",
  "cls", "gender", "dob", "division", "district", "upazila"
];

function saveDraft() {
  var draft = {};

  for (var i = 0; i < saveFields.length; i++) {
    draft[saveFields[i]] = document.getElementById(saveFields[i]).value;
  }
  draft.confirm = confirmBox.checked;

  localStorage.setItem("regDraft", JSON.stringify(draft));
  document.getElementById("draft").textContent = "ড্রাফট সেভ হয়েছে ✓";
}

function showCategory() {
  var category = "";

  for (var i = 0; i < classList.length; i++) {
    if (classList[i][0] === clsSelect.value) {
      category = classList[i][1];
    }
  }

  catInput.value = category;
}

function showAge() {
  if (dobInput.value) {
    document.getElementById("age").textContent = "বয়স: " + calculateAge(dobInput.value) + " বছর";
  } else {
    document.getElementById("age").textContent = "";
  }
}

function restoreDraft() {
  var text = localStorage.getItem("regDraft");
  if (!text) {
    return; // কোনো ড্রাফট নেই
  }

  var draft = JSON.parse(text);

  nameInput.value = draft.name || "";
  instInput.value = draft.inst || "";
  emailInput.value = draft.email || "";
  mobileInput.value = draft.mobile || "";
  clsSelect.value = draft.cls || "";
  genderSelect.value = draft.gender || "";
  dobInput.value = draft.dob || "";

  // বিভাগ > জেলা > উপজেলা - পরপর ভরতে হয়
  divisionSelect.value = draft.division || "";
  fillSelect(districtSelect, getDistricts(draft.division));
  districtSelect.value = draft.district || "";
  fillSelect(upazilaSelect, getUpazilas(draft.division, draft.district));
  upazilaSelect.value = draft.upazila || "";

  confirmBox.checked = !!draft.confirm;

  showCategory();
  showAge();
  showToast("আগের ড্রাফট ফিরিয়ে আনা হয়েছে");
}

// ---------- ১১. ঘরগুলোতে ইভেন্ট বসানো ----------

for (var f = 0; f < fieldIds.length; f++) {
  var field = document.getElementById(fieldIds[f]);

  // ঘর থেকে বের হয়ে গেলে (blur) যাচাই করবে, যদি কিছু লেখা থাকে
  field.addEventListener("blur", function () {
    if (this.value !== "") {
      checkField(this.id);
    }
  });

  // লেখা বা বাছাই বদলালে প্রগ্রেস ও ড্রাফট আপডেট হবে
  field.addEventListener("input", onFieldChange);
  field.addEventListener("change", onFieldChange);
}

function onFieldChange() {
  // আগে থেকে লাল/সবুজ থাকলে সঙ্গে সঙ্গে আবার যাচাই করবে
  if (this.classList.contains("bad") || this.classList.contains("good")) {
    checkField(this.id);
  }
  updateProgress();
  saveDraft();
}

confirmBox.addEventListener("change", function () {
  document.getElementById("confirmErr").textContent = "";
  updateProgress();
  saveDraft();
});

// মোবাইল: শুধু সংখ্যা
mobileInput.addEventListener("input", function () {
  mobileInput.value = mobileInput.value.replace(/[^0-9]/g, "").slice(0, 11);
});

// নামের শুরুর ফাঁকা জায়গা মুছে ফেলা
nameInput.addEventListener("input", function () {
  nameInput.value = nameInput.value.replace(/^\s+/, "");
});

// শ্রেণি বাছলে ক্যাটাগরি নিজে নিজে বসবে
clsSelect.addEventListener("change", showCategory);

// বিভাগ বাছলে জেলা ভরবে, উপজেলা খালি হবে
divisionSelect.addEventListener("change", function () {
  fillSelect(districtSelect, getDistricts(divisionSelect.value));
  fillSelect(upazilaSelect, []);
});

// জেলা বাছলে উপজেলা ভরবে
districtSelect.addEventListener("change", function () {
  fillSelect(upazilaSelect, getUpazilas(divisionSelect.value, districtSelect.value));
});

// জন্ম তারিখ বাছলে বয়স দেখাবে
dobInput.addEventListener("change", showAge);

// পাসওয়ার্ড লিখলে শক্তি দেখাবে, আর কনফার্ম বক্স থাকলে সেটাও মিলিয়ে দেখবে
pwInput.addEventListener("input", function () {
  if (pw2Input.value !== "") {
    checkField("pw2");
  }
  updateStrength();
});

// চোখ বাটন: পাসওয়ার্ড দেখা/লুকানো
var eyeButtons = document.querySelectorAll(".eye");

for (var e = 0; e < eyeButtons.length; e++) {
  eyeButtons[e].addEventListener("click", function () {
    var input = document.getElementById(this.dataset.target);
    var icon = this.querySelector("i");

    if (input.type === "password") {
      input.type = "text";
      icon.className = "fa-solid fa-eye-slash";
    } else {
      input.type = "password";
      icon.className = "fa-solid fa-eye";
    }
  });
}

// ---------- ১২. Reset বাটন ----------
document.getElementById("resetBtn").addEventListener("click", function () {
  if (!confirm("সব তথ্য মুছে ফেলবেন?")) {
    return;
  }

  regForm.reset();
  fillSelect(districtSelect, []);
  fillSelect(upazilaSelect, []);
  catInput.value = "";
  document.getElementById("age").textContent = "";

  // লাল/সবুজ বর্ডার ও এরর মুছে ফেলা
  for (var i = 0; i < fieldIds.length; i++) {
    var input = document.getElementById(fieldIds[i]);
    input.classList.remove("bad");
    input.classList.remove("good");
    document.getElementById(fieldIds[i] + "Err").textContent = "";
  }
  document.getElementById("confirmErr").textContent = "";

  localStorage.removeItem("regDraft");
  document.getElementById("draft").textContent = "";
  updateStrength();
  updateProgress();
});

// ---------- ১৩. Submit বাটন ----------
regForm.addEventListener("submit", function (event) {
  event.preventDefault();

  // সব ঘর যাচাই করছি
  var allOk = true;
  for (var i = 0; i < fieldIds.length; i++) {
    if (checkField(fieldIds[i]) === false) {
      allOk = false;
    }
  }

  // টিক চিহ্ন যাচাই
  if (confirmBox.checked) {
    document.getElementById("confirmErr").textContent = "";
  } else {
    document.getElementById("confirmErr").textContent = "জমা দেওয়ার আগে নিশ্চিত করুন।";
    allOk = false;
  }

  // ভুল থাকলে প্রথম ভুল ঘরে নিয়ে যাওয়া
  if (allOk === false) {
    var firstBad = document.querySelector(".bad");
    if (firstBad) {
      firstBad.scrollIntoView({ block: "center", behavior: "smooth" });
      firstBad.focus({ preventScroll: true });
    }
    showToast("ফর্মে ভুল আছে, ঠিক করুন");
    return;
  }

  // সব ঠিক থাকলে এখানে আসবে। এবার তথ্য Google Sheet এ পাঠাবো।

  // পাঠানোর তথ্যগুলো একটা অবজেক্টে সাজানো
  var data = {
    action: "register",
    name: nameInput.value.trim(),
    inst: instInput.value.trim(),
    email: emailInput.value.trim(),
    mobile: mobileInput.value,
    password: pwInput.value,
    cls: clsSelect.value,
    category: catInput.value,
    gender: genderSelect.value,
    dob: dobInput.value,
    division: divisionSelect.value,
    district: districtSelect.value,
    upazila: upazilaSelect.value
  };

  // পাঠানোর সময় বাটন বন্ধ রাখা (যাতে দুইবার চাপা না পড়ে)
  var submitBtn = regForm.querySelector('button[type="submit"]');
  submitBtn.disabled = true;
  submitBtn.textContent = "অপেক্ষা করুন…";

  // callServer ফাংশনটা config.js এ আছে
  callServer(
    data,

    // সার্ভার উত্তর দিলে
    function (result) {
      submitBtn.disabled = false;
      submitBtn.textContent = "Submit";

      if (result.success) {
        showDone(result.candidateId); // সফল
      } else {
        showToast(result.message);    // যেমন: ইমেইল আগেই নেওয়া হয়েছে
      }
    },

    // ইন্টারনেট বা লিংকের সমস্যা হলে
    function (message) {
      submitBtn.disabled = false;
      submitBtn.textContent = "Submit";
      showToast(message);
    }
  );
});

// ---------- সফল হলে সারাংশ দেখানোর ফাংশন ----------
function showDone(candidateId) {
  var rows = [
    ["ক্যান্ডিডেট আইডি", candidateId],
    ["নাম", nameInput.value.trim()],
    ["প্রতিষ্ঠান", instInput.value.trim()],
    ["ইমেইল", emailInput.value],
    ["মোবাইল", mobileInput.value],
    ["শ্রেণি", clsSelect.value + " (" + catInput.value + ")"],
    ["ঠিকানা", upazilaSelect.value + ", " + districtSelect.value + ", " + divisionSelect.value]
  ];

  var summary = document.getElementById("summary");
  summary.innerHTML = "";

  for (var r = 0; r < rows.length; r++) {
    var dt = document.createElement("dt");
    var dd = document.createElement("dd");
    dt.textContent = rows[r][0];
    dd.textContent = rows[r][1];
    summary.appendChild(dt);
    summary.appendChild(dd);
  }

  localStorage.removeItem("regDraft");

  // ফর্ম লুকিয়ে সফল বার্তা দেখানো
  regForm.style.display = "none";
  document.getElementById("loginText").style.display = "none";
  document.getElementById("done").style.display = "block";
  window.scrollTo({ top: 0, behavior: "smooth" });
}

// ---------- ১৪. পেজ খোলার সময় শুরুর কাজ ----------
restoreDraft();
updateStrength();
updateProgress();
