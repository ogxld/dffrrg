let unsubscribeStories = null;
const STORY_LIFETIME_MS = 24 * 60 * 60 * 1000; // 24 godziny

async function uploadStory(event) {
  const file = event.target.files[0];
  if (!file) return;

  const statusEl = document.getElementById('story-upload-status');
  statusEl.textContent = 'Wysyłanie...';

  try {
    const filePath = `stories/${currentUser.uid}/${Date.now()}_${file.name}`;
    const ref = storage.ref(filePath);
    await ref.put(file);
    const url = await ref.getDownloadURL();

    await db.collection('stories').add({
      uid: currentUser.uid,
      username: currentUser.username,
      url: url,
      storagePath: filePath,
      type: file.type.startsWith('video') ? 'video' : 'image',
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });

    statusEl.textContent = 'Dodano relację ✅';
    setTimeout(() => statusEl.textContent = '', 2500);
  } catch (err) {
    statusEl.textContent = 'Błąd wysyłania: ' + err.message;
  }
  event.target.value = '';
}

function loadStories() {
  if (unsubscribeStories) unsubscribeStories();
  const grid = document.getElementById('stories-grid');

  unsubscribeStories = db.collection('stories')
    .orderBy('createdAt', 'desc')
    .onSnapshot(snapshot => {
      grid.innerHTML = '';
      const now = Date.now();

      snapshot.forEach(doc => {
        const s = doc.data();
        if (!s.createdAt) return; // jeszcze się nie zapisało z serwera
        const ageMs = now - s.createdAt.toDate().getTime();

        if (ageMs > STORY_LIFETIME_MS) {
          // relacja wygasła - najlepszy wysiłek: usuń ją w tle
          deleteExpiredStory(doc.id, s.storagePath);
          return;
        }

        const thumb = document.createElement('div');
        thumb.className = 'story-thumb';
        thumb.onclick = () => openStoryViewer(s);

        const mediaEl = s.type === 'video'
          ? `<video src="${s.url}" muted></video>`
          : `<img src="${s.url}">`;

        thumb.innerHTML = mediaEl + `<div class="story-author">${escapeHtml(s.username)}</div>`;
        grid.appendChild(thumb);
      });

      if (grid.innerHTML === '') {
        grid.innerHTML = '<p style="color:#666;grid-column:1/-1;">Brak aktywnych relacji. Bądź pierwszy!</p>';
      }
    });
}

async function deleteExpiredStory(docId, storagePath) {
  try {
    await db.collection('stories').doc(docId).delete();
    if (storagePath) await storage.ref(storagePath).delete();
  } catch (e) {
    // cicho ignorujemy - inny klient mógł już to usunąć
  }
}

function openStoryViewer(story) {
  const viewer = document.getElementById('story-viewer');
  const media = document.getElementById('story-viewer-media');
  const meta = document.getElementById('story-viewer-meta');

  media.innerHTML = story.type === 'video'
    ? `<video src="${story.url}" controls autoplay></video>`
    : `<img src="${story.url}">`;

  const time = story.createdAt ? story.createdAt.toDate().toLocaleString('pl-PL') : '';
  meta.textContent = `${story.username} • ${time}`;

  viewer.style.display = 'flex';
}

function closeStoryViewer() {
  document.getElementById('story-viewer').style.display = 'none';
  document.getElementById('story-viewer-media').innerHTML = '';
}

function cleanupStoriesListener() {
  if (unsubscribeStories) unsubscribeStories();
}
