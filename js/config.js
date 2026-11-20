/* =========================================================
   config.js - সার্ভারের (Google Sheet) সাথে যোগাযোগের সেটিং

   Apps Script Deploy করার পর যে "Web app URL" পাবেন
   সেটা নিচের "" এর ভিতরে বসান। শুধু এখানেই একবার বসালে হবে,
   লগইন, রেজিস্ট্রেশন ও ড্যাশবোর্ড সব পেজ এটাই ব্যবহার করবে।

   উদাহরণ: var SCRIPT_URL = "https://script.google.com/macros/s/AKfycb.../exec";
   ========================================================= */

var SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzMY2tKX_g6S8fbeYJ2ikxzluBNKUWjqdJqYXhn2yLy5SLTGswGdO6z-k6X-EAR21Ga/exec";

/* ---------------------------------------------------------
   callServer - সার্ভারে তথ্য পাঠানোর সহজ ফাংশন

   data    : যা পাঠাতে চান (যেমন { action: "login", id: "...", password: "..." })
   onDone  : সার্ভার উত্তর দিলে এই ফাংশন চলবে (উত্তরটা result নামে পাবেন)
   onError : ইন্টারনেট বা লিংকের সমস্যা হলে এই ফাংশন চলবে (বার্তা পাবেন)
   --------------------------------------------------------- */
function callServer(data, onDone, onError) {
  // লিংক বসানো না থাকলে জানিয়ে দেওয়া
  if (SCRIPT_URL === "") {
    onError("config.js ফাইলে SCRIPT_URL বসানো হয়নি।");
    return;
  }

  fetch(SCRIPT_URL, {
    method: "POST",
    body: JSON.stringify(data) // কোনো header দেওয়া হয়নি, এতে ব্রাউজার আটকায় না
  })
    .then(function (response) {
      return response.json(); // উত্তরটা পড়ার উপযোগী করা
    })
    .then(function (result) {
      onDone(result);
    })
    .catch(function () {
      onError("সার্ভারের সাথে যোগাযোগ করা যায়নি। ইন্টারনেট চেক করে আবার চেষ্টা করুন।");
    });
}

/* ---------------------------------------------------------
   লগইন টোকেন (সেশন) সংক্রান্ত সাহায্যকারী ফাংশন
   "মনে রাখুন" চাপলে localStorage এ (ব্রাউজার বন্ধ করলেও থাকে),
   না চাপলে sessionStorage এ (ট্যাব বন্ধ করলে মুছে যায়)
   --------------------------------------------------------- */
function getToken() {
  return localStorage.getItem("sessionToken") || sessionStorage.getItem("sessionToken") || "";
}

function saveToken(token, remember) {
  clearToken();
  if (remember) {
    localStorage.setItem("sessionToken", token);
  } else {
    sessionStorage.setItem("sessionToken", token);
  }
}

function clearToken() {
  localStorage.removeItem("sessionToken");
  sessionStorage.removeItem("sessionToken");
}
