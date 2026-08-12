<div align="center">

# 🔳 UPI QR Generator

**A lightweight, open-source UPI QR generator built as an experimental project to learn, build, and explore modern web development.**

![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-5-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind-3-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)

[![Stars](https://img.shields.io/github/stars/charanrajtechy/upiqrgenerator?style=flat-square&color=yellow)](https://github.com/charanrajtechy/upiqrgenerator/stargazers)
[![Issues](https://img.shields.io/github/issues/charanrajtechy/upiqrgenerator?style=flat-square&color=orange)](https://github.com/charanrajtechy/upiqrgenerator/issues)
[![Last Commit](https://img.shields.io/github/last-commit/charanrajtechy/upiqrgenerator?style=flat-square&color=brightgreen)](https://github.com/charanrajtechy/upiqrgenerator/commits/main)

**[🚀 Live Demo](https://upiqrgenerator.clpstudio.workers.dev)** · **[⭐ Repository](https://github.com/charanrajtechy/upiqrgenerator)**

</div>

---

## 📖 About

UPI QR Generator turns UPI payment details into a scannable QR code — right in your browser. No login, no backend, nothing leaves your device. Enter a UPI ID (plus an optional name, amount, and note), and the app builds a standard `upi://pay` link and renders it as a customizable QR code you can download or share.

This project started as a hands-on experiment to learn how a real web app is designed, built, and shipped — from UI state and browser storage to QR encoding and deployment. It's not meant to be a polished commercial product; it's an honest, working example of what you can build while learning.

## ✨ Features

| | |
|---|---|
| 🔗 **UPI QR generation** | Build a QR from a UPI ID, name, amount, and note |
| 🧩 **Smart link building** | Only includes fields you actually fill in |
| 🎨 **QR customization** | Corner and module styles (dots, rounded, diamond, etc.) |
| 🖼️ **Logo upload** | Center logo while keeping the QR scannable |
| 🗂️ **Card styles** | Minimal, bold, boxed, or centered preview layouts |
| ⬇️ **PNG export** | With automatic fallback to native sharing |
| 📤 **Share** | Via the Web Share API, best on mobile |
| 🕘 **Local history** | Saved entries, stored only in your browser |
| 📌 **Templates** | Reusable UPI ID + name presets |
| 🌗 **Light/dark theme** | Preference persisted locally |

## 🧰 Tech Stack

`React 18` · `TypeScript` · `Vite` · `Tailwind CSS` · `shadcn/ui` · `React Hook Form + Zod` · `TanStack Query` · `qrcode` / `jsqr` · `Vitest`

Fully client-side — no backend, no database.

## ⚙️ How It Works

```
User enters UPI details
        ↓
App builds a upi://pay URI (only with the fields provided)
        ↓
QR code is generated locally in the browser
        ↓
User customizes, downloads, or shares it
```

```
upi://pay?pa=upi-id&pn=name&am=amount&tn=note
```

| Param | Meaning | Required |
|---|---|---|
| `pa` | Payee UPI ID | ✅ |
| `pn` | Payee name | – |
| `am` | Amount | – |
| `tn` | Note | – |

## 🔒 Privacy

Everything runs client-side. History, templates, and theme are stored only in your browser's local storage — no analytics, no tracking, no server. One honest limitation: with no backend, the app can't confirm whether a payment actually went through — it only generates the link/QR.

## 🚀 Running Locally

```bash
git clone https://github.com/charanrajtechy/upiqrgenerator.git
cd upiqrgenerator
npm install
npm run dev
```

```bash
npm run build     # production build
npm run test       # run tests (Vitest)
```

## 🌍 Deployment

Static app — deployable anywhere. This repo includes config for **Cloudflare Workers** and **Vercel**; the live demo runs on Cloudflare Workers.

## 🌱 Why It's Open Source

This project was built to learn — QR generation, UPI links, browser storage, deployment, and everything in between. It stays public so others can explore it, fork it, and build their own version.

Our focus has since moved to **[Lead Scraper](#)** and **[DMFlux](#)**, tools built to solve real business problems. This project remains available as an open-source experiment — just no longer the main focus.

## 🤝 Contributing

Forks, issues, and pull requests are all welcome.

## 📄 License

No license has been added yet.

## 👤 Credits

Built by **Charan Raj — CLP Studio**

[![GitHub](https://img.shields.io/badge/GitHub-charanrajtechy-181717?style=flat-square&logo=github)](https://github.com/charanrajtechy)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-charanrajtechy-0A66C2?style=flat-square&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/charanrajtechy)
[![YouTube](https://img.shields.io/badge/YouTube-CLP%20Studio-FF0000?style=flat-square&logo=youtube&logoColor=white)](https://youtube.com/@clpstudiobycharanraj)

