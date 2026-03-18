# MedSpeak

MedSpeak is a small frontend-only healthcare translation prototype built with Next.js, TypeScript, and Tailwind CSS. It captures speech with the browser Speech Recognition API, shows the original transcript, attempts browser-native translation when available, and can read the translated text aloud with `speechSynthesis`.

## Browser limitations

- Best experienced on Chrome or Edge over HTTPS.
- Speech recognition support varies by browser and device.
- Browser-native translation is experimental and may be unavailable for some browsers or language pairs.
- Text-to-speech voice availability depends on the voices installed in the browser and operating system.
- This prototype keeps all transcript data in local in-memory React state only. Nothing is persisted.

## Run locally

```bash
npm install
npm run dev
```

Then open `http://localhost:3000`.

## Deploy to Vercel

1. Push the project to a Git repository.
2. Import the repository into Vercel.
3. Accept the default Next.js build settings.
4. Deploy over HTTPS so browser speech and translation features have the best chance of working.

## Prototype disclaimer

Prototype only. Do not rely on this app for emergencies or critical medical decisions.
