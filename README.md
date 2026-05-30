# The Pensieve 🌌

[English](./README.md) | [中文](./README_zh.md)

*Capture a thought, watch it become a memory.*

**The Pensieve** is an immersive, magical web application inspired by the Harry Potter universe. It allows users to store, polish, and relive their thoughts and experiences. Built with a focus on cinematic animations, fluid physics, and AI-driven textual refinement.

---

## ✨ Features

*   **Interactive Liquid Basin (HTML5 Canvas):** A highly customized, performant fluid simulation. Hovering over the basin generates organic ripples, subtle underwater caustics, and diffusing grey-white ink blobs that sink beneath the surface.
*   **AI-Powered Memory Polishing:** Speak or type raw thoughts into the "Add Memory" panel. The app leverages the **Google Gemini Pro** model via a secure backend to automatically clean up filler words (e.g., "um," "uh," "就是"), restructure sentences logically, and extract a concise, poetic title for your memory.
*   **Immersive "Dive" Animations:** Selecting a memory triggers a cinematic GSAP timeline. The liquid expands, the memory title glows, and the screen seamlessly transitions to plunge the user "into" the memory.
*   **Magical Custom Cursors:** The application features globally overridden SVG wands. The cursor elegantly features a glowing tip whenever hovering over clickable elements, acting as the user's personal wand.
*   **Memory Archive & Local Storage:** Switch between 'Warm' (golden aura) and 'Cool' (silver-blue aura) emotional resonances for each memory. Users can upload custom images, delete preset lore memories, and save everything locally.

## 🛠️ Tech Stack & Secure Architecture

This project uses a full-stack **Express + Vite (React)** architecture to ensure critical secrets (like the Gemini API Key) are safely hidden from the browser.

*   **Backend Server:** Express.js (`server.ts`) securely proxies and processes all AI generation requests.
*   **Frontend Framework:** React 19 + Vite + TypeScript (running seamlessly alongside Express in dev and perfectly bundled for production).
*   **Generative AI:** `@google/genai` (Only executed Server-Side)
*   **Animations:** GSAP
*   **Styling:** Tailwind CSS

## 🚀 Getting Started & Configuration

Follow these instructions to clone this repository, configure your own AI capabilities, and run the magic locally.

### 1. Requirements
*   **Node.js** (v18 or higher recommended)
*   **Git**

### 2. Get an AI API Key (Gemini, Kimi, DeepSeek, etc.)
To power the "Memory Polishing" (text cleanup and titular summarization) feature, you will need an AI model API Key. 

By default, the application is configured to use **Google Gemini**, but it also includes ready-to-use configurations for major OpenAI-compatible models.

**Option A: Google Gemini (Default & Free Tier Available)**
1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey).
2. Sign in and click **"Create API Key"**.
3. Copy the generated key.

**Option B: Alternative AI Models (Kimi, DeepSeek, Zhipu, MiniMax, ChatGPT)**
If you prefer not to use Gemini, The Pensieve is equipped with setup blocks for major OpenAI-compliant platforms.

1.  Open the `/server.ts` file.
2.  Locate the **"AI Provider Configuration"** block.
3.  Comment out the default `GoogleGenAI` initialization block.
4.  Uncomment the setup block for your desired platform (e.g., Kimi, DeepSeek, Zhipu, MiniMax, or ChatGPT).
5.  In your `.env` file, add the respective `API_KEY` associated with the active platform, for example: `DEEPSEEK_API_KEY=your_key`.
6.  *Note:* You will also need to update the actual `ai.models.generateContent(...)` method call inside the `/api/polish` endpoint to use the `openaiClient.chat.completions.create(...)` syntax (instructions and examples are widespread for the `openai` node package).

### 3. Clone & Install
Clone this repository to your local computer:
```bash
git clone https://github.com/your-username/the-pensieve.git
cd the-pensieve
npm install
```

### 4. Configure Your Environment Variables
In the root folder of the project, create a new file named `.env` (or copy the provided `.env.example` file and rename it to `.env`).

> ⚠️ **Important:** Ensure you name it exactly `.env`. Do NOT commit this file to your GitHub repository! The included `.gitignore` file should prevent this natively.

Open the `.env` file and paste your Gemini API key like so:
```env
GEMINI_API_KEY=your_actual_api_key_here
```

### 5. Start the Application
Because of the integrated Express + Vite setup, simply run one command to start the full stack:
```bash
npm run dev
```
Open your browser and navigate to `http://localhost:3000` to dive into your pensieve!

### 6. Production Deployment
To deploy this app publicly, you cannot use static hosting (like Vercel static or GitHub Pages) because of the necessary secure Node.js backend. 

*   Deploy to a full-stack Node.js platform like **Render, Railway, Heroku**, or **Google Cloud Run**.
*   In your platform's dashboard, look for **"Environment Variables"** or **"Config Vars"**.
*   Add the key `GEMINI_API_KEY` and paste your key there.
*   Set the build command to `npm run build` and start command to `npm start`.

---

## 🛡️ Security Architecture Update

Previously, the `GEMINI_API_KEY` was handled directly in the React client, triggering potential leaks.

**The architecture has now been fully upgraded.** The React frontend only invokes an internal `/api/polish` endpoint, while the newly created `server.ts` Express backend safely handles the actual secret keys and `@google/genai` logic under the hood. You can now safely deploy this repository to full-stack container platforms without exposing your private API keys to the browser inspector.
