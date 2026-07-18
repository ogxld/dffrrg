let unsubscribeStories = null;
const STORY_LIFETIME_MS = 24 * 60 * 60 * 1000; // 24 godziny

async function uploadStory(event) {
  const file = event.target.files[0];
  if (!file) return;

  const statusEl = document.getElementById('story-upload-status');

  if (!file.type.startsWith('image')) {
    statusEl.textContent = 'Można dodawać tylko zdjęcia (nie wideo).';
    event.target.value = '';
    return;
  }

  if (!IMGBB_API_KEY || IMGBB_API_KEY === 'TWOJ_IMGBB_API_KEY') {
    statusEl.textContent = 'Brak skonfigurowanego klucza ImgBB - zobacz js/imgbb-config.js';
    event.target.value = '';
    return;
  }

  statusEl.textContent = 'Wysyłanie...';

  try {
    const base64 = await fileToBase64(file);
    const formData = new FormData();
    formData.append('image', base64);

    const response = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
      method: 'POST',
      body: formData
    });
    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error?.message || 'Nieznany błąd ImgBB');
    }

    await db.collection('stories').add({
      uid: currentUser.uid,
      username: currentUser.username,
      url: result.data.url,
      deleteUrl: result.data.delete_url || null,
      type: 'image',
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });

    statusEl.textContent = 'Dodano relację ✅';
    setTimeout(() => statusEl.textContent = '', 2500);
  } catch (err) {
    statusEl.textContent = 'Błąd wysyłania: ' + err.message;
  }
  event.target.value = '';
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
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
          deleteExpiredStory(doc.id);
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

async function deleteExpiredStory(docId) {
  try {
    await db.collection('stories').doc(docId).delete();
    // Uwaga: sam plik zostaje na ImgBB (darmowy hosting nie ma prostego API do
    // automatycznego kasowania), ale znika z aplikacji i nikt go już nie zobaczy.
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
