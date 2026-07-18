// ===== Przełączanie zakładek =====
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    btn.classList.add('active');
    const target = document.getElementById(btn.dataset.tab);
    target.classList.add('active');

    if (btn.dataset.tab === 'map-tab') {
      initMap();
      leafletMap.invalidateSize();
    }
  });
});

// ===== Stan logowania =====
auth.onAuthStateChanged(async (user) => {
  if (user) {
    const userDoc = await db.collection('users').doc(user.uid).get();
    const profile = userDoc.exists ? userDoc.data() : { uid: user.uid, username: user.email, email: user.email };
    currentUser = { uid: user.uid, username: profile.username, email: user.email };

    document.getElementById('auth-screen').style.display = 'none';
    document.getElementById('app-screen').style.display = 'flex';
    document.getElementById('current-user-label').textContent = 'Zalogowano jako ' + currentUser.username;

    loadUserList();
    loadStories();
    loadPins();
  } else {
    currentUser = null;
    cleanupChatListeners();
    cleanupStoriesListener();
    cleanupMapListener();

    document.getElementById('app-screen').style.display = 'none';
    document.getElementById('auth-screen').style.display = 'flex';
    document.getElementById('login-email').value = '';
    document.getElementById('login-password').value = '';
  }
});
