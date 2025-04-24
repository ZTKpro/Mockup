# Edytor Etui na Telefon

Aplikacja internetowa do projektowania i dostosowywania etui na telefony z podglądem wysokiej jakości i możliwością eksportu.

## Główne funkcje

- Manipulacja obrazem w czasie rzeczywistym (obracanie, powiększanie, przesuwanie)
- Obsługa wielu mockupów z organizacją według modeli telefonów
- Możliwość zmiany koloru tła
- Eksport obrazów w wysokiej jakości w formacie PNG lub JPG
- Eksport wielu projektów jednocześnie jako pojedyncze pliki lub archiwum ZIP
- Responsywny design dla komputerów i urządzeń mobilnych
- Obsługa wielu elementów dla złożonych projektów
- Automatyczne zachowywanie obrazu pomiędzy mockupami
- Przechowywanie ustawień projektu po stronie serwera

## Wymagania systemowe

- Node.js >= 14.0.0
- Nowoczesna przeglądarka z włączoną obsługą JavaScript
- Minimum 100MB wolnego miejsca na dysku
- Port 3000 dostępny na serwerze (lub możliwość konfiguracji innego portu)

## Instalacja

1. Zainstaluj zależności:
   ```
   npm install
   ```

2. Uruchom serwer:
   ```
   npm start
   ```

3. Uzyskaj dostęp do aplikacji w przeglądarce:
   ```
   http://localhost:3000
   ```

Aby uruchomić aplikację na serwerze produkcyjnym, możesz użyć menedżera procesów PM2:
```
npm install -g pm2
pm2 start server.js --name edytor-etui
```

## Struktura katalogów

```
edytor-etui/
├── css/                  # Arkusze stylów
├── js/                   # Pliki JavaScript
│   ├── loader.js         # Moduł ładujący
│   ├── auth.js           # Moduł uwierzytelniania
│   ├── index.js          # Główny plik aplikacji
│   ├── dodaj.js          # Skrypt zarządzania mockupami
│   ├── password.js       # Skrypt ochrony hasłem
│   └── modules/          # Moduły funkcjonalne
├── uploads/              # Katalogi na pliki
│   ├── mockups/          # Przechowywanie mockupów
│   └── user-images/      # Przesłane obrazy użytkowników (tymczasowe)
├── index.html            # Główna strona aplikacji
├── dodaj.html            # Strona zarządzania mockupami
├── password.html         # Strona uwierzytelniania
├── server.js             # Serwer Express.js
└── package.json          # Zależności projektu
```

## Instrukcja użytkowania

### Uwierzytelnianie

Aplikacja jest chroniona hasłem. Domyślne hasło jest ustawione w pliku `js/password.js` (domyślnie: `halo@jpe.pl`).

Aby zmienić hasło, należy edytować linię:
```javascript
const correctPassword = "halo@jpe.pl";
```
w pliku `js/password.js`

### Główny edytor

1. **Wgraj obraz**: Kliknij "Wybierz zdjęcie" lub przeciągnij i upuść obraz w obszarze wgrywania
2. **Wybierz mockup**: Wybierz dostępny mockup z bocznego panelu
3. **Dostosuj swój projekt**:
   - Obracaj obraz za pomocą suwaka lub przycisków -90°/+90°
   - Powiększaj/pomniejszaj za pomocą suwaka lub przycisków +/-
   - Dostosuj pozycję za pomocą suwaków X i Y
   - Zmień kolor tła za pomocą próbnika kolorów
4. **Eksportuj swój projekt**:
   - Kliknij "Pobierz jako PNG/JPG" dla bieżącego projektu
   - Zaznacz wiele mockupów za pomocą pól wyboru i kliknij "Pobierz zaznaczone" dla eksportu wielu projektów naraz

### Zarządzanie mockupami

1. Przejdź do strony zarządzania mockupami klikając przycisk "+" w galerii mockupów
2. Wgraj nowe obrazy mockupów (PNG z przezroczystym tłem)
3. Organizuj mockupy według modeli telefonów
4. Usuwaj lub edytuj istniejące mockupy

## Konfiguracja serwera

### Zmiana portu

Domyślnie aplikacja działa na porcie 3000. Aby zmienić port, edytuj plik `server.js`:
```javascript
const PORT = process.env.PORT || 3000;
```
Na przykład, aby użyć portu 8080:
```javascript
const PORT = process.env.PORT || 8080;
```

### Ustawienie za rewers proxy (np. Nginx)

Jeśli chcesz uruchomić aplikację za rewers proxy, skonfiguruj Nginx (przykład):
```
server {
    listen 80;
    server_name twojadomena.pl;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## Tryb debugowania

Aplikacja zawiera tryb debugowania, który można aktywować:
- Dodając `?debug=true` do adresu URL
- Ustawiając `debug=true` w localStorage przeglądarki
- Uruchamiając serwer za pomocą `npm run debug`

Gdy tryb debugowania jest aktywny, szczegółowe informacje są dostępne w konsoli przeglądarki.

## Tworzenie kopii zapasowych

Aby utworzyć kopię zapasową mockupów, wystarczy skopiować katalog `uploads/mockups`. Zawiera on wszystkie wgrane mockupy.

```bash
cp -r uploads/mockups /path/to/backup/folder
```

Aby przywrócić mockupy z kopii zapasowej:
```bash
cp -r /path/to/backup/folder/mockups uploads/
```

## Dodawanie nowych mockupów

1. Utwórz obrazy PNG z przezroczystym tłem przedstawiające kontury etui na telefon
2. Wgraj je przez interfejs zarządzania mockupami (dodaj.html)
3. Organizuj je według modelu dla łatwiejszego dostępu

Mockupy powinny mieć następujące cechy:
- Format PNG z przezroczystym tłem
- Obraz przedstawiający obrys telefonu z przezroczystym obszarem w miejscu gdzie będzie wstawiany obraz
- Najlepiej białe krawędzie etui dla lepszej wizualizacji

## Wsparcie

W razie pytań lub problemów, skontaktuj się z:
- Email: damianszmurlowork@gmail.com
- Strona: dswebsite
