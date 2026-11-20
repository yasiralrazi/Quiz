/* =========================================================
   dashboard.js - লগইনের পর যে পেজ দেখাবে তার জাভাস্ক্রিপ্ট
   কাজ: ১. লগইন আছে কিনা দেখা  ২. তথ্য এনে দেখানো  ৩. লগআউট
   ========================================================= */

var loadingBox = document.getElementById("loading");
var contentBox = document.getElementById("content");
var logoutBtn = document.getElementById("logoutBtn");

// ---------- লগইন পেজে পাঠানোর ফাংশন ----------
function goToLogin() {
  clearToken();
  window.location.href = "login.html";
}

// ---------- তথ্যের তালিকা (নাম: মান) সাজিয়ে দেখানো ----------
function showInfo(user) {
  var rows = [
    ["নাম", user.name],
    ["প্রতিষ্ঠান", user.inst],
    ["শ্রেণি", user.cls + " (" + user.category + ")"],
    ["লিঙ্গ", user.gender],
    ["জন্ম তারিখ", user.dob],
    ["ইমেইল", user.email],
    ["মোবাইল", user.mobile],
    ["ঠিকানা", user.upazila + ", " + user.district + ", " + user.division]
  ];

  var info = document.getElementById("info");
  info.innerHTML = "";

  for (var i = 0; i < rows.length; i++) {
    var dt = document.createElement("dt");
    var dd = document.createElement("dd");
    dt.textContent = rows[i][0];
    dd.textContent = rows[i][1];
    info.appendChild(dt);
    info.appendChild(dd);
  }
}

// ---------- ১. টোকেন না থাকলে সরাসরি লগইন পেজে ----------
var token = getToken();

if (token === "") {
  goToLogin();
} else {
  // ---------- ২. সার্ভার থেকে নিজের তথ্য আনা ----------
  callServer(
    { action: "profile", token: token },

    function (result) {
      if (result.success) {
        document.getElementById("welcomeName").textContent = result.name;
        document.getElementById("cidText").textContent = result.candidateId;
        showInfo(result);

        loadingBox.hidden = true;
        contentBox.hidden = false;
      } else {
        // সেশনের মেয়াদ শেষ হলে আবার লগইন করতে হবে
        goToLogin();
      }
    },

    function (message) {
      loadingBox.querySelector("p").textContent = message;
    }
  );
}

// ---------- ৩. লগআউট ----------
logoutBtn.addEventListener("click", function (event) {
  event.preventDefault();

  // সার্ভারকে জানানো, তারপর ব্রাউজার থেকে টোকেন মুছে লগইন পেজে যাওয়া
  callServer(
    { action: "logout", token: getToken() },
    function () {
      goToLogin();
    },
    function () {
      goToLogin(); // ইন্টারনেট না থাকলেও ব্রাউজার থেকে লগআউট হবে
    }
  );
});
