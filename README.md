# FocusReader

FocusReader is a minimalist speed-reading app that shows text word-by-word with fullscreen mode, background music, and text/PDF import.

## Features
- RSVP (word-by-word) reader with red anchor highlight
- Background music toggle with volume control and custom upload
- Import text from .txt and .pdf files
- Adjustable reading speed (WPM)

## Tech Stack
- React + Vite
- Canvas-based rendering
- PDF parsing via pdf.js

## Getting Started
Install dependencies:

```bash
npm install
```

Run the dev server:

```bash
npm run dev
```

Build for production:

```bash
npm run build
```

## Usage
- Paste text into the Source Text area or upload a file (.txt, .pdf).
- Use the speed slider to set WPM.
- Use the background music card to enable music, change volume, or upload your own audio.
- Click the fullscreen button in the top right to focus.

## Project Structure
```
speed-reader/
  public/
    audio/
    favicon.svg
  src/
    App.jsx
    App.css
    index.css
    main.jsx
```

## Audio Files
Place default audio in public/audio and reference it by path, for example:

```
public/audio/ETUDE.mp3
```

## Notes
- Background music plays only while reading is running.
- PDF extraction happens in the browser and may take a moment for large files.# React + Vite



