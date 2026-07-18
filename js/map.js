let leafletMap = null;
let mapMarkers = {}; // docId -> marker
let unsubscribePins = null;

function initMap() {
  if (leafletMap) return; // już zainicjalizowana

  leafletMap = L.map('map').setView([52.0, 19.0], 6); // środek Polski

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors',
    maxZoom: 19
  }).addTo(leafletMap);

  leafletMap.on('click', async (e) => {
    const note = prompt('Opisz to miejsce (opcjonalnie):', '');
    if (note === null) return; // anulowano
    await addPin(e.latlng.lat, e.latlng.lng, note);
  });

  // Leaflet potrzebuje przeliczenia rozmiaru po pokazaniu ukrytej wcześniej zakładki
  setTimeout(() => leafletMap.invalidateSize(), 200);
}

async function addPin(lat, lng, note) {
  await db.collection('pins').add({
    uid: currentUser.uid,
    username: currentUser.username,
    lat: lat,
    lng: lng,
    note: note || '',
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  });
}

function loadPins() {
  if (unsubscribePins) unsubscribePins();

  unsubscribePins = db.collection('pins').onSnapshot(snapshot => {
    snapshot.docChanges().forEach(change => {
      const docId = change.doc.id;
      const p = change.doc.data();

      if (change.type === 'removed') {
        if (mapMarkers[docId]) {
          leafletMap.removeLayer(mapMarkers[docId]);
          delete mapMarkers[docId];
        }
        return;
      }

      // added lub modified
      if (mapMarkers[docId]) {
        leafletMap.removeLayer(mapMarkers[docId]);
      }

      const marker = L.marker([p.lat, p.lng]).addTo(leafletMap);
      const isMine = p.uid === currentUser.uid;
      const popupHtml = `
        <b>${escapeHtml(p.username)}</b><br>
        ${escapeHtml(p.note || '')}
        ${isMine ? `<br><a href="#" onclick="deletePin('${docId}');return false;">🗑 Usuń</a>` : ''}
      `;
      marker.bindPopup(popupHtml);
      mapMarkers[docId] = marker;
    });
  });
}

async function deletePin(docId) {
  await db.collection('pins').doc(docId).delete();
}

function cleanupMapListener() {
  if (unsubscribePins) unsubscribePins();
}
