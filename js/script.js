/* =========================================================
   script.js - সব পেজে ব্যবহার হবে
   কাজ: মোবাইলে হ্যামবার্গার মেনু খোলা ও বন্ধ করা
   ========================================================= */

// দুইটা এলিমেন্ট খুঁজে নিচ্ছি: বাটন এবং মেনু
var menuBtn = document.getElementById("menuBtn");
var nav = document.getElementById("nav");

// মেনু খোলা বা বন্ধ করার ফাংশন
function toggleMenu() {
  // "open" ক্লাস থাকলে সরাবে, না থাকলে যোগ করবে
  nav.classList.toggle("open");

  // মেনু এখন খোলা আছে কিনা দেখছি
  var isOpen = nav.classList.contains("open");

  // বাটনের আইকন বদলাচ্ছি (খোলা থাকলে ✕, বন্ধ থাকলে ☰)
  if (isOpen) {
    menuBtn.innerHTML = '<i class="fa-solid fa-xmark"></i>';
  } else {
    menuBtn.innerHTML = '<i class="fa-solid fa-bars"></i>';
  }

  menuBtn.setAttribute("aria-expanded", isOpen);
}

// বাটনে ক্লিক করলে মেনু খুলবে/বন্ধ হবে
menuBtn.addEventListener("click", toggleMenu);

// মেনুর কোনো লিংকে ক্লিক করলে মেনু বন্ধ হয়ে যাবে
var links = nav.querySelectorAll("a");

for (var i = 0; i < links.length; i++) {
  links[i].addEventListener("click", function () {
    if (nav.classList.contains("open")) {
      toggleMenu();
    }
  });
}

// লগইন করা থাকলে মেনুর "লগইন" বাটন "ড্যাশবোর্ড" হয়ে যাবে
// (getToken ফাংশন config.js এ আছে)
if (typeof getToken === "function" && getToken() !== "") {
  for (var j = 0; j < links.length; j++) {
    if (links[j].getAttribute("href") === "login.html") {
      links[j].setAttribute("href", "dashboard.html");
      links[j].textContent = "ড্যাশবোর্ড";
    }
  }
}
