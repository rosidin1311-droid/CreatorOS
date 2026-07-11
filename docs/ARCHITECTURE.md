# CreatorOS Architecture

## Overview

CreatorOS adalah aplikasi AI yang mengubah video panjang menjadi beberapa video pendek secara otomatis.

---

# Stack

Framework

- Next.js 16
- React 19
- TypeScript

UI

- Tailwind CSS

Processing

- FFmpeg WASM

Future AI

- Gemini API
- Whisper
- Cloud Storage

---

# Folder Structure

/app

Halaman aplikasi

/components

Reusable Components

/lib

Utilities

/hooks

Custom Hooks

/utils

Helper Functions

/docs

Project Documentation

/public

Static Assets

---

# Workflow

User

↓

Upload Video / Paste URL

↓

Preview Video

↓

AI Analysis

↓

Scene Detection

↓

Best Clip Selection

↓

Subtitle

↓

Export

---

# Design Principles

- Mobile First
- Dark Theme
- Fast
- Simple
- AI Assisted
- Minimal Click

---

# Engineering Rules

- Small reusable components.
- TypeScript first.
- Avoid duplicated code.
- Keep functions small.
- Always handle errors.
- Never break working features.

---

# Future Modules

- AI Scene Detection
- AI Viral Score
- AI Subtitle
- AI Thumbnail
- AI Hook Generator
- Batch Export
- YouTube Upload