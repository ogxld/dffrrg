// ===================================================================
// 1) Wejdź na https://console.firebase.google.com i utwórz nowy projekt
// 2) Dodaj aplikację webową (ikona </>) i skopiuj tu jej konfigurację
// 3) Włącz: Authentication -> Email/Password, Firestore Database, Storage
//    (szczegółowa instrukcja krok po kroku jest w pliku README.md)
// ===================================================================
const firebaseConfig = {
  apiKey: "AIzaSyAKyB1P7H5cV2spoeGluWPte0m0msWhc0Y",
  authDomain: "snapklon-74587.firebaseapp.com",
  projectId: "snapklon-74587",
  storageBucket: "snapklon-74587.firebasestorage.app",
  messagingSenderId: "982903989710",
  appId: "1:982903989710:web:302630115494cdb3b2379f"
};

firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();
