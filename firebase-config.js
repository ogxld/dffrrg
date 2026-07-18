// ===================================================================
// 1) Wejdź na https://console.firebase.google.com i utwórz nowy projekt
// 2) Dodaj aplikację webową (ikona </>) i skopiuj tu jej konfigurację
// 3) Włącz: Authentication -> Email/Password, Firestore Database, Storage
//    (szczegółowa instrukcja krok po kroku jest w pliku README.md)
// ===================================================================
const firebaseConfig = {
  apiKey: "TWOJ_API_KEY",
  authDomain: "TWOJ_PROJEKT.firebaseapp.com",
  projectId: "TWOJ_PROJEKT",
  storageBucket: "TWOJ_PROJEKT.appspot.com",
  messagingSenderId: "TWOJ_SENDER_ID",
  appId: "TWOJ_APP_ID"
};

firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
const db = firebase.firestore();
// Uwaga: nie używamy już firebase.storage() - zdjęcia do Relacji idą przez ImgBB
// (zobacz js/imgbb-config.js), bo Firebase Storage wymaga płatnego planu Blaze.
