let currentUser = null; // { uid, username, email }

function showRegister() {
  document.getElementById('login-form').style.display = 'none';
  document.getElementById('register-form').style.display = 'block';
  document.getElementById('auth-error').textContent = '';
}
function showLogin() {
  document.getElementById('register-form').style.display = 'none';
  document.getElementById('login-form').style.display = 'block';
  document.getElementById('auth-error').textContent = '';
}

function setAuthError(msg) {
  document.getElementById('auth-error').textContent = msg;
}

async function registerUser() {
  const username = document.getElementById('register-username').value.trim();
  const email = document.getElementById('register-email').value.trim();
  const password = document.getElementById('register-password').value;

  if (!username || !email || !password) {
    setAuthError('Uzupełnij wszystkie pola.');
    return;
  }

  try {
    const cred = await auth.createUserWithEmailAndPassword(email, password);
    await db.collection('users').doc(cred.user.uid).set({
      uid: cred.user.uid,
      username: username,
      email: email,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    // onAuthStateChanged w main.js zajmie się przejściem do aplikacji
  } catch (err) {
    setAuthError(translateAuthError(err));
  }
}

async function loginUser() {
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;

  if (!email || !password) {
    setAuthError('Podaj email i hasło.');
    return;
  }

  try {
    await auth.signInWithEmailAndPassword(email, password);
  } catch (err) {
    setAuthError(translateAuthError(err));
  }
}

function logoutUser() {
  auth.signOut();
}

function translateAuthError(err) {
  const map = {
    'auth/email-already-in-use': 'Ten email jest już zarejestrowany.',
    'auth/invalid-email': 'Nieprawidłowy adres email.',
    'auth/weak-password': 'Hasło musi mieć minimum 6 znaków.',
    'auth/user-not-found': 'Nie znaleziono użytkownika.',
    'auth/wrong-password': 'Błędne hasło.',
    'auth/invalid-credential': 'Błędny email lub hasło.'
  };
  return map[err.code] || ('Błąd: ' + err.message);
}
