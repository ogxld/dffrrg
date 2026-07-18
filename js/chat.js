let selectedChatUser = null; // { uid, username }
let unsubscribeMessages = null;
let unsubscribeUsers = null;

function chatIdFor(uidA, uidB) {
  return [uidA, uidB].sort().join('_');
}

function loadUserList() {
  if (unsubscribeUsers) unsubscribeUsers();
  const container = document.getElementById('users-container');

  unsubscribeUsers = db.collection('users').onSnapshot(snapshot => {
    container.innerHTML = '';
    snapshot.forEach(doc => {
      const u = doc.data();
      if (u.uid === currentUser.uid) return; // pomiń siebie
      const div = document.createElement('div');
      div.className = 'user-item';
      div.textContent = '🙂 ' + u.username;
      div.onclick = () => selectChatUser(u, div);
      container.appendChild(div);
    });
    if (container.innerHTML === '') {
      container.innerHTML = '<p style="color:#666;font-size:13px;">Poproś znajomych o rejestrację w aplikacji.</p>';
    }
  });
}

function selectChatUser(user, el) {
  selectedChatUser = user;
  document.querySelectorAll('.user-item').forEach(x => x.classList.remove('active'));
  if (el) el.classList.add('active');

  document.getElementById('chat-header').textContent = 'Czat z ' + user.username;
  document.getElementById('chat-input-bar').style.display = 'flex';

  listenToMessages();
}

function listenToMessages() {
  if (unsubscribeMessages) unsubscribeMessages();
  const chatId = chatIdFor(currentUser.uid, selectedChatUser.uid);
  const messagesContainer = document.getElementById('messages-container');

  unsubscribeMessages = db.collection('chats').doc(chatId)
    .collection('messages')
    .orderBy('createdAt', 'asc')
    .onSnapshot(snapshot => {
      messagesContainer.innerHTML = '';
      snapshot.forEach(doc => {
        const m = doc.data();
        const div = document.createElement('div');
        div.className = 'msg ' + (m.senderUid === currentUser.uid ? 'mine' : 'theirs');
        const time = m.createdAt ? m.createdAt.toDate().toLocaleTimeString('pl-PL', {hour:'2-digit', minute:'2-digit'}) : '';
        div.innerHTML = escapeHtml(m.text) + '<span class="msg-time">' + time + '</span>';
        messagesContainer.appendChild(div);
      });
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    });
}

async function sendMessage() {
  const input = document.getElementById('message-input');
  const text = input.value.trim();
  if (!text || !selectedChatUser) return;

  const chatId = chatIdFor(currentUser.uid, selectedChatUser.uid);
  input.value = '';

  await db.collection('chats').doc(chatId).collection('messages').add({
    text: text,
    senderUid: currentUser.uid,
    senderUsername: currentUser.username,
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  });

  // Zapisz też metadane rozmowy (przydatne do list "ostatnich czatów" w przyszłości)
  await db.collection('chats').doc(chatId).set({
    participants: [currentUser.uid, selectedChatUser.uid],
    lastMessage: text,
    lastMessageAt: firebase.firestore.FieldValue.serverTimestamp()
  }, { merge: true });
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function cleanupChatListeners() {
  if (unsubscribeMessages) unsubscribeMessages();
  if (unsubscribeUsers) unsubscribeUsers();
}
