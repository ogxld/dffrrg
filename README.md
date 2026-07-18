# 👻 SnapKlon

Prosty klon Snapchata "1:1" do zrobienia razem ze znajomymi:
- 💬 **Czat** — wiadomości na żywo między dwiema osobami
- 📸 **Relacje** — zdjęcia/wideo widoczne dla wszystkich, znikają automatycznie po 24h
- 🗺️ **Wspólna mapa** — każdy może dodać pinezkę widoczną dla reszty grupy

Aplikacja jest w 100% statyczna (HTML/CSS/JS, bez serwera) i korzysta z **Firebase**
(darmowy plan w zupełności wystarczy dla grupy znajomych). Dzięki temu można ją
hostować za darmo na **GitHub Pages** i po prostu wysłać znajomym link.

---

## 1. Załóż projekt Firebase (5 minut)

1. Wejdź na https://console.firebase.google.com i kliknij **Dodaj projekt**.
2. Nadaj nazwę (np. `snapklon`) i utwórz projekt.
3. W panelu projektu kliknij ikonę **`</>`** (Dodaj aplikację webową), nadaj jej
   nazwę i zarejestruj. Firebase pokaże Ci obiekt `firebaseConfig` — skopiuj go.
4. Wklej skopiowaną konfigurację do pliku [`js/firebase-config.js`](js/firebase-config.js)
   w miejsce `firebaseConfig`.

### Włącz potrzebne usługi

W lewym menu konsoli Firebase:

- **Authentication** → zakładka *Sign-in method* → włącz **Email/Password**.
- **Firestore Database** → **Utwórz bazę danych** → tryb produkcyjny (reguły ustawimy niżej) → wybierz region (np. `eur3`).
- **Storage** → **Rozpocznij** → tryb produkcyjny → wybierz ten sam region.

### Ustaw reguły bezpieczeństwa

**Firestore → zakładka Reguły**, wklej i opublikuj:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    match /chats/{chatId} {
      allow read, write: if request.auth != null;
      match /messages/{messageId} {
        allow read, write: if request.auth != null;
      }
    }
    match /stories/{storyId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null && request.resource.data.uid == request.auth.uid;
      allow delete: if request.auth != null;
    }
    match /pins/{pinId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null && request.resource.data.uid == request.auth.uid;
      allow delete: if request.auth != null && resource.data.uid == request.auth.uid;
    }
  }
}
```

**Storage → zakładka Reguły**, wklej i opublikuj:

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /stories/{userId}/{fileName} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId
                   && request.resource.size < 20 * 1024 * 1024; // max 20MB
      allow delete: if request.auth != null;
    }
  }
}
```

> Te reguły są proste i myślane dla zamkniętej grupy znajomych — każdy zalogowany
> użytkownik widzi wszystkich. To zamierzone uproszczenie ("wspólna mapa i relacje
> dla wszystkich"), tak jak prosiłeś.

---

## 2. Uruchom lokalnie (opcjonalnie, do testów)

Nie trzeba niczego instalować — to zwykłe pliki statyczne. Możesz np. użyć
rozszerzenia VS Code "Live Server", albo w terminalu w folderze projektu:

```bash
python3 -m http.server 8080
```

i wejść na `http://localhost:8080`.

---

## 3. Wrzuć na GitHuba i włącz GitHub Pages

```bash
git init
git add .
git commit -m "SnapKlon - pierwsza wersja"
git branch -M main
git remote add origin https://github.com/TWOJ_NICK/snapklon.git
git push -u origin main
```

Następnie na GitHubie: **Settings → Pages → Branch: `main` / folder: `/root`** → Save.
Po chwili aplikacja będzie dostępna pod adresem:

```
https://TWOJ_NICK.github.io/snapklon/
```

Ten link wyślij znajomym — każdy zakłada konto (email + hasło + nazwa użytkownika)
i możecie razem pisać, wrzucać relacje i pinować miejsca na mapie.

---

## Jak to działa (skrót)

| Funkcja | Technologia |
|---|---|
| Logowanie / rejestracja | Firebase Authentication |
| Czat 1:1 na żywo | Firestore (`chats/{para_uid}/messages`) |
| Relacje 24h | Firebase Storage (pliki) + Firestore (metadane + auto-czyszczenie po stronie klienta) |
| Wspólna mapa z pinezkami | Leaflet.js (OpenStreetMap, bez klucza API) + Firestore (`pins`) |

## Możliwe rozszerzenia na później
- Powiadomienia push (Firebase Cloud Messaging)
- Usuwanie relacji po 24h przez Cloud Function zamiast po stronie klienta
- Widoczność "kto widział relację"
- Awatar / zdjęcie profilowe
- Wysyłanie zdjęć bezpośrednio na czacie
