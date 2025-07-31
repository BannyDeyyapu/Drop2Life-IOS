const firebaseConfig = {
  apiKey: "AIzaSyBfcC9Gud_viIPCdDXUOi4syJyOQQQOaCk",
  authDomain: "drop2life.firebaseapp.com",
  projectId: "drop2life",
  storageBucket: "drop2life.firebasestorage.app",
  messagingSenderId: "496136250187",
  appId: "1:496136250187:web:5cf369383abf4e3109bece",
  measurementId: "G-J3QL0MGVEG"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
let selectedLocation = "";

window.addEventListener("load", () => {
  const locationInput = document.getElementById("location");
  if (locationInput && google?.maps?.places) {
    const autocomplete = new google.maps.places.Autocomplete(locationInput, {
      types: ['(regions)'],
      componentRestrictions: { country: 'in' }
    });
    autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace();
      selectedLocation = place?.name || '';
      locationInput.value = selectedLocation;
    });
  }
});

window.useMyLocation = function () {
  const locationInput = document.getElementById("location");
  if (!navigator.geolocation) return alert("Geolocation not supported.");

  navigator.geolocation.getCurrentPosition(
    pos => {
      const { latitude: lat, longitude: lng } = pos.coords;
      const geocoder = new google.maps.Geocoder();
      geocoder.geocode({ location: { lat, lng } }, (results, status) => {
        if (status === "OK" && results[0]) {
          const region = results[0].address_components.find(c =>
            c.types.includes("locality") || c.types.includes("administrative_area_level_2")
          );
          selectedLocation = region?.long_name || '';
          locationInput.value = selectedLocation;
          alert("✅ Location filled using GPS!");
        } else {
          alert("❌ Location not found. Try manually.");
        }
      });
    },
    err => alert("❌ GPS access denied or unavailable.")
  );
};

window.showSection = function (id) {
  document.querySelectorAll('.section').forEach(sec => sec.classList.remove('visible'));
  const section = document.getElementById(id);
  if (section) section.classList.add('visible');
};

window.registerDonor = async function () {
  const name = document.getElementById('name').value.trim();
  const bloodGroup = document.getElementById('bloodGroup').value;
  const location = document.getElementById('location').value.trim();
  const contact = document.getElementById('contact').value.trim();

  if (!name || !bloodGroup || !location || !contact) return alert("Fill all fields.");
  if (location !== selectedLocation) return alert("Use correct GPS/Autocomplete location.");
  if (!/^[6-9]\d{9}$/.test(contact)) return alert("Invalid contact number.");

  try {
    await db.collection("donors").add({ name, bloodGroup, location, contact });
    alert("✅ Registered successfully!");
    ['name', 'bloodGroup', 'location', 'contact'].forEach(id => document.getElementById(id).value = '');
  } catch {
    alert("❌ Failed to register. Try again.");
  }
};

window.searchDonors = async function () {
  const group = document.getElementById('searchBlood').value.trim().toUpperCase();
  const resultList = document.getElementById('resultList');
  resultList.innerHTML = '';

  try {
    const querySnap = await db.collection("donors").where("bloodGroup", "==", group).get();
    if (querySnap.empty) return resultList.innerHTML = '<li>No donors found.</li>';
    querySnap.forEach(doc => {
      const d = doc.data();
      resultList.innerHTML += `<li>${d.name} - ${d.bloodGroup} - ${d.location} - ${d.contact}</li>`;
    });
  } catch {
    alert("❌ Failed to search donors.");
  }
};

window.shareApp = function () {
  const shareText = `🩸 Help save lives! Download Drop2Life\n${window.location.href}`;
  if (navigator.share) {
    navigator.share({ title: "Drop2Life", text: shareText, url: window.location.href }).catch(() =>
      fallbackCopy(shareText)
    );
  } else fallbackCopy(shareText);
};

function fallbackCopy(text) {
  navigator.clipboard.writeText(text).then(() =>
    alert("🔗 Link copied! Share it.")
  ).catch(() => alert("❌ Sharing failed. Copy manually."));
}

// ✅ Accept Terms logic
window.acceptTerms = function () {
  localStorage.setItem("termsAccepted", "yes");
  document.getElementById("termsModal").style.display = "none";
};

window.addEventListener("DOMContentLoaded", () => {
  if (!localStorage.getItem("termsAccepted")) {
    const modal = document.getElementById("termsModal");
    if (modal) modal.style.display = "flex";
  }
});
