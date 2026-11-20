/* =========================================================
   login.js - লগইন পেজের জাভাস্ক্রিপ্ট (সহজ ভাষায় লেখা)
   সত্যিকারের লগইন: তথ্য Google Sheet এর সাথে মিলিয়ে দেখা হয়
   ========================================================= */

// ---------- ১. এলিমেন্টগুলো খুঁজে নেওয়া ----------
var card = document.getElementById("card");
var loginView = document.getElementById("loginView");
var resetView = document.getElementById("resetView");

var loginForm = document.getElementById("loginForm");
var userId = document.getElementById("userId");
var password = document.getElementById("password");
var remember = document.getElementById("remember");
var loginBtn = document.getElementById("loginBtn");
var alertBox = document.getElementById("alert");

var idLabel = document.getElementById("idLabel");
var idHint = document.getElementById("idHint");
var capsHint = document.getElementById("capsHint");
var eyeBtn = document.getElementById("eyeBtn");

var resetForm = document.getElementById("resetForm");
var resetId = document.getElementById("resetId");
var resetBtn = document.getElementById("resetBtn");
var resetAlert = document.getElementById("resetAlert");

var resetForm2 = document.getElementById("resetForm2");
var resetCode = document.getElementById("resetCode");
var newPw = document.getElementById("newPw");
var newPw2 = document.getElementById("newPw2");
var resetBtn2 = document.getElementById("resetBtn2");
var resetAlert2 = document.getElementById("resetAlert2");

// ---------- ২. কিছু ভেরিয়েবল ----------
var mode = "contact";   // "contact" = মোবাইল/ইমেইল, "cid" = ক্যান্ডিডেট আইডি

// ---------- ৩. যাচাই করার ফাংশন ----------

// বাংলাদেশী মোবাইল নম্বর ঠিক আছে কিনা (01 দিয়ে শুরু, মোট ১১ সংখ্যা)
function isMobile(value) {
  return /^01[3-9][0-9]{8}$/.test(value);
}

// ইমেইল ঠিক আছে কিনা
function isEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value);
}

// ক্যান্ডিডেট আইডি ঠিক আছে কিনা (বড় হাতের ইংরেজি অক্ষর, সংখ্যা, হাইফেন)
function isCandidateId(value) {
  return /^[A-Z0-9][A-Z0-9-]{4,15}$/.test(value);
}

// ---------- ৪. বার্তা ও এরর দেখানোর ফাংশন ----------

// ইনপুটের নিচে লাল এরর দেখানো (message ফাঁকা হলে এরর মুছে যাবে)
function showError(input, message) {
  var errBox = document.getElementById(input.id + "Err");

  if (message) {
    input.classList.add("bad");
  } else {
    input.classList.remove("bad");
  }

  errBox.textContent = message;
}

// উপরের বার্তা বক্সে লেখা দেখানো (success true হলে সবুজ হবে)
function showAlert(box, message, success) {
  box.textContent = message;
  box.classList.add("show");

  if (success) {
    box.classList.add("okk");
  } else {
    box.classList.remove("okk");
  }
}

// কার্ড কাঁপানো (ভুল হলে)
function shakeCard() {
  card.classList.remove("shake");
  void card.offsetWidth; // অ্যানিমেশন আবার চালানোর কৌশল
  card.classList.add("shake");
}

// ---------- ৫. লগইন / রিসেট পেজ বদল ----------

function showView(name) {
  if (name === "reset") {
    loginView.hidden = true;
    resetView.hidden = false;

    // লগইনে যা লেখা ছিল রিসেট বক্সে বসিয়ে দিচ্ছি
    if (resetId.value === "") {
      resetId.value = userId.value;
    }
    resetId.focus();
  } else {
    resetView.hidden = true;
    loginView.hidden = false;
    userId.focus();
  }
}

document.getElementById("forgotLink").addEventListener("click", function (event) {
  event.preventDefault(); // লিংকের স্বাভাবিক কাজ বন্ধ
  showView("reset");
});

document.getElementById("backLink").addEventListener("click", function (event) {
  event.preventDefault();
  showView("login");
});

// ---------- ৬. ট্যাব বদল (Mobile/Email <-> Candidate ID) ----------

function changeMode(newMode, keepValue) {
  mode = newMode;

  // ট্যাব বাটনগুলোর মধ্যে কোনটা সক্রিয় সেটা ঠিক করা
  var tabs = document.querySelectorAll(".tab");
  for (var i = 0; i < tabs.length; i++) {
    if (tabs[i].dataset.mode === newMode) {
      tabs[i].classList.add("on");
      tabs[i].setAttribute("aria-selected", "true");
    } else {
      tabs[i].classList.remove("on");
      tabs[i].setAttribute("aria-selected", "false");
    }
  }

  // লেবেল, প্লেসহোল্ডার ও হিন্ট বদলানো
  if (newMode === "cid") {
    idLabel.innerHTML = 'Candidate ID <span class="req">*</span>';
    userId.placeholder = "যেমন: CAND-123456";
    idHint.hidden = false;
  } else {
    idLabel.innerHTML = 'Mobile / Email <span class="req">*</span>';
    userId.placeholder = "01XXXXXXXXX বা email@example.com";
    idHint.hidden = true;
  }

  if (!keepValue) {
    userId.value = "";
  }
  showError(userId, "");
}

var tabButtons = document.querySelectorAll(".tab");
for (var t = 0; t < tabButtons.length; t++) {
  tabButtons[t].addEventListener("click", function () {
    changeMode(this.dataset.mode, false);
    userId.focus();
  });
}

// ---------- ৭. "আমাকে মনে রাখুন" - আগের তথ্য ফিরিয়ে আনা ----------

var savedId = localStorage.getItem("loginId");
if (savedId) {
  if (localStorage.getItem("loginMode") === "cid") {
    changeMode("cid", true);
  }
  userId.value = savedId;
  remember.checked = true;
}

// ---------- ৮. টাইপ করার সময় ইনপুট ঠিক করা ----------

userId.addEventListener("input", function () {
  var value = userId.value;

  if (mode === "cid") {
    // ক্যান্ডিডেট আইডি: বড় হাতের অক্ষর, সংখ্যা ও হাইফেন ছাড়া সব মুছবে
    value = value.toUpperCase().replace(/[^A-Z0-9-]/g, "");
    userId.value = value.slice(0, 16);
  } else if (/^[0-9]/.test(value) && value.indexOf("@") === -1) {
    // সংখ্যা দিয়ে শুরু হলে শুধু সংখ্যা রাখবে (মোবাইল নম্বর)
    userId.value = value.replace(/[^0-9]/g, "").slice(0, 11);
  }

  showError(userId, "");
});

password.addEventListener("input", function () {
  showError(password, "");
});

resetId.addEventListener("input", function () {
  showError(resetId, "");
});

// ---------- ৯. পাসওয়ার্ড দেখা/লুকানো এবং Caps Lock ----------

eyeBtn.addEventListener("click", function () {
  var icon = eyeBtn.querySelector("i");

  if (password.type === "password") {
    password.type = "text";
    icon.className = "fa-solid fa-eye-slash";
  } else {
    password.type = "password";
    icon.className = "fa-solid fa-eye";
  }
});

password.addEventListener("keyup", function (event) {
  // Caps Lock চালু থাকলে সতর্কবার্তা দেখাবে
  capsHint.hidden = !event.getModifierState("CapsLock");
});

password.addEventListener("blur", function () {
  capsHint.hidden = true;
});

// ---------- ১০. লগইন ফর্ম জমা দেওয়া ----------

loginForm.addEventListener("submit", function (event) {
  event.preventDefault(); // পেজ রিলোড বন্ধ
  alertBox.classList.remove("show");

  var idValue = userId.value.trim();
  var passValue = password.value;
  var allOk = true;

  // আইডি যাচাই
  if (mode === "cid") {
    if (!isCandidateId(idValue)) {
      showError(userId, "সঠিক ক্যান্ডিডেট আইডি দিন (৫–১৬ অক্ষর, ইংরেজি বড় হাতের অক্ষর/সংখ্যা/হাইফেন)।");
      allOk = false;
    }
  } else {
    if (!isMobile(idValue) && !isEmail(idValue)) {
      showError(userId, "সঠিক মোবাইল নম্বর বা ইমেইল দিন।");
      allOk = false;
    }
  }

  // পাসওয়ার্ড যাচাই
  if (passValue === "") {
    showError(password, "পাসওয়ার্ড লিখুন।");
    allOk = false;
  }

  if (allOk === false) {
    shakeCard();
    return;
  }

  // বাটন বন্ধ করে "অপেক্ষা করুন" দেখানো
  loginBtn.disabled = true;
  loginBtn.textContent = "অপেক্ষা করুন…";

  // সার্ভারে (Google Sheet) আইডি ও পাসওয়ার্ড পাঠিয়ে মিলিয়ে দেখা
  callServer(
    {
      action: "login",
      id: idValue,
      password: passValue,
      remember: remember.checked
    },

    // সার্ভার উত্তর দিলে
    function (result) {
      loginBtn.disabled = false;
      loginBtn.textContent = "Log in";

      if (result.success) {
        // "আমাকে মনে রাখুন" অনুযায়ী আইডি মনে রাখা
        if (remember.checked) {
          localStorage.setItem("loginId", idValue);
          localStorage.setItem("loginMode", mode);
        } else {
          localStorage.removeItem("loginId");
          localStorage.removeItem("loginMode");
        }

        // লগইন টোকেন সেভ করা (config.js এর ফাংশন)
        saveToken(result.token, remember.checked);

        showAlert(alertBox, "লগইন সফল হয়েছে! ড্যাশবোর্ডে নেওয়া হচ্ছে…", true);

        setTimeout(function () {
          window.location.href = "dashboard.html";
        }, 700);
      } else {
        // ভুল পাসওয়ার্ড বা অন্য সমস্যা (বার্তা সার্ভার থেকেই আসে)
        shakeCard();
        showAlert(alertBox, result.message, false);
      }
    },

    // ইন্টারনেট বা লিংকের সমস্যা হলে
    function (message) {
      loginBtn.disabled = false;
      loginBtn.textContent = "Log in";
      shakeCard();
      showAlert(alertBox, message, false);
    }
  );
});

// ---------- ১১. পাসওয়ার্ড রিসেট - ধাপ ১: কোড চাওয়া ----------

resetForm.addEventListener("submit", function (event) {
  event.preventDefault();
  resetAlert.classList.remove("show");

  var value = resetId.value.trim();

  if (!isMobile(value) && !isEmail(value)) {
    showError(resetId, "সঠিক মোবাইল নম্বর বা ইমেইল দিন।");
    shakeCard();
    return;
  }

  resetBtn.disabled = true;
  resetBtn.textContent = "পাঠানো হচ্ছে…";

  callServer(
    { action: "requestReset", id: value },

    function (result) {
      resetBtn.disabled = false;
      resetBtn.textContent = "Send reset code";

      if (result.success) {
        // ধাপ ২ এর ফর্ম দেখানো
        resetForm.hidden = true;
        resetForm2.hidden = false;
        showAlert(
          resetAlert2,
          "ঠিক থাকলে রেজিস্ট্রেশনের ইমেইলে ৬ সংখ্যার কোড পাঠানো হয়েছে। কোডটি ১০ মিনিট কাজ করবে। ইনবক্সে না পেলে স্প্যাম ফোল্ডার দেখুন।",
          true
        );
        resetCode.focus();
      } else {
        showAlert(resetAlert, result.message, false);
      }
    },

    function (message) {
      resetBtn.disabled = false;
      resetBtn.textContent = "Send reset code";
      showAlert(resetAlert, message, false);
    }
  );
});

// "আবার পাঠান" চাপলে ধাপ ১ এ ফিরে যাওয়া
document.getElementById("againLink").addEventListener("click", function (event) {
  event.preventDefault();
  resetForm2.hidden = true;
  resetForm.hidden = false;
  resetAlert.classList.remove("show");
  resetId.focus();
});

// ---------- ১২. পাসওয়ার্ড রিসেট - ধাপ ২: কোড দিয়ে নতুন পাসওয়ার্ড ----------

resetCode.addEventListener("input", function () {
  // শুধু সংখ্যা রাখা
  resetCode.value = resetCode.value.replace(/[^0-9]/g, "").slice(0, 6);
  showError(resetCode, "");
});

newPw.addEventListener("input", function () {
  showError(newPw, "");
});

newPw2.addEventListener("input", function () {
  showError(newPw2, "");
});

// পাসওয়ার্ড নিয়ম: ৮+ অক্ষর, বড় হাতের, ছোট হাতের, সংখ্যা
function isStrongPassword(value) {
  return value.length >= 8 && /[a-z]/.test(value) && /[A-Z]/.test(value) && /[0-9]/.test(value);
}

resetForm2.addEventListener("submit", function (event) {
  event.preventDefault();
  resetAlert2.classList.remove("show");

  var allOk = true;

  if (!/^[0-9]{6}$/.test(resetCode.value)) {
    showError(resetCode, "৬ সংখ্যার কোড দিন।");
    allOk = false;
  }

  if (!isStrongPassword(newPw.value)) {
    showError(newPw, "৮+ অক্ষর, বড়/ছোট হাতের অক্ষর ও সংখ্যা লাগবে।");
    allOk = false;
  }

  if (newPw2.value === "" || newPw2.value !== newPw.value) {
    showError(newPw2, "পাসওয়ার্ড মিলছে না।");
    allOk = false;
  }

  if (allOk === false) {
    shakeCard();
    return;
  }

  resetBtn2.disabled = true;
  resetBtn2.textContent = "অপেক্ষা করুন…";

  callServer(
    {
      action: "resetPassword",
      id: resetId.value.trim(),
      code: resetCode.value,
      newPassword: newPw.value
    },

    function (result) {
      resetBtn2.disabled = false;
      resetBtn2.textContent = "Change password";

      if (result.success) {
        // লগইন পেজে ফিরে গিয়ে সফল বার্তা দেখানো
        var idUsed = resetId.value.trim();

        resetCode.value = "";
        newPw.value = "";
        newPw2.value = "";
        resetForm2.hidden = true;
        resetForm.hidden = false;
        resetAlert2.classList.remove("show");

        changeMode("contact", false);
        userId.value = idUsed;
        password.value = "";

        showView("login");
        showAlert(alertBox, "পাসওয়ার্ড বদলানো হয়েছে। নতুন পাসওয়ার্ড দিয়ে লগইন করুন।", true);
      } else {
        shakeCard();
        showAlert(resetAlert2, result.message, false);
      }
    },

    function (message) {
      resetBtn2.disabled = false;
      resetBtn2.textContent = "Change password";
      showAlert(resetAlert2, message, false);
    }
  );
});
