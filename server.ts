import "dotenv/config";
import express from "express";
import path from "path";
import { GoogleGenAI, Type } from "@google/genai";
import OpenAI from "openai";
import { getAuth } from "firebase-admin/auth";
import "./firebase-admin.ts";
import { adminDb } from "./firebase-admin.ts";

async function startServer() {
  const app = express();
  const PORT = parseInt(process.env.PORT || "3000", 10);

  app.use(express.json());

  // =========================================================================
  // AI Provider Configuration
  // 默认使用 Gemini，如果你想切换为其他大模型，可以注释掉 Gemini 部分并取消下方对应代码的注释。
  // =========================================================================

  // --- [1] The Default: Google Gemini ---
  let aiClient: GoogleGenAI | null = null;
  const getAIClient = (): GoogleGenAI | null => {
    if (!aiClient) {
      const key = process.env.GEMINI_API_KEY;
      if (!key) {
        console.warn('GEMINI_API_KEY is missing. AI polishing will be disabled.');
        return null;
      }
      aiClient = new GoogleGenAI({
        apiKey: key,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });
    }
    return aiClient;
  };

  /*
  // --- [2] Kimi (Moonshot) 接入示例 ---
  // 需要在 .env 配置 MOONSHOT_API_KEY
  const openaiClient = process.env.MOONSHOT_API_KEY ? new OpenAI({
    apiKey: process.env.MOONSHOT_API_KEY,
    baseURL: "https://api.moonshot.cn/v1",
  }) : null;
  const MODEL_NAME = "moonshot-v1-8k";
  */

  /*
  // --- [3] DeepSeek 接入示例 ---
  // 需要在 .env 配置 DEEPSEEK_API_KEY
  const openaiClient = process.env.DEEPSEEK_API_KEY ? new OpenAI({
    apiKey: process.env.DEEPSEEK_API_KEY,
    baseURL: "https://api.deepseek.com",
  }) : null;
  const MODEL_NAME = "deepseek-chat";
  */

  /*
  // --- [4] MiniMax 接入示例 ---
  // 需要在 .env 配置 MINIMAX_API_KEY
  const openaiClient = process.env.MINIMAX_API_KEY ? new OpenAI({
    apiKey: process.env.MINIMAX_API_KEY,
    baseURL: "https://api.minimax.chat/v1",
  }) : null;
  const MODEL_NAME = "abab6.5t-chat";
  */

  /*
  // --- [5] 智谱 (Zhipu/GLM) 接入示例 ---
  // 需要在 .env 配置 ZHIPU_API_KEY
  const openaiClient = process.env.ZHIPU_API_KEY ? new OpenAI({
    apiKey: process.env.ZHIPU_API_KEY,
    baseURL: "https://open.bigmodel.cn/api/paas/v4",
  }) : null;
  const MODEL_NAME = "glm-4";
  */

  /*
  // --- [6] ChatGPT (OpenAI) 接入示例 ---
  // 需要在 .env 配置 OPENAI_API_KEY
  const openaiClient = process.env.OPENAI_API_KEY ? new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  }) : null;
  const MODEL_NAME = "gpt-4o-mini";
  */

  app.post("/api/polish", async (req, res) => {
    const { original } = req.body;
    if (!original || typeof original !== "string" || original.trim().length === 0) {
      return res.status(400).json({ error: "Missing original text" });
    }

    // ---- Authentication ----
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ error: "请先登录以使用魔法能量" });
    }

    const idToken = authHeader.slice(7);
    let uid: string;
    try {
      const decoded = await getAuth().verifyIdToken(idToken);
      uid = decoded.uid;
    } catch {
      return res.status(401).json({ error: "登录凭证已失效，请重新登录" });
    }

    // ---- Daily Limit Check ----
    const today = new Date().toISOString().split("T")[0];
    const usageRef = adminDb.collection("usage").doc(uid);
    let todayCount = 0;

    try {
      const usageDoc = await usageRef.get();
      if (usageDoc.exists) {
        const data = usageDoc.data()!;
        if (data.lastUseDate === today) {
          todayCount = data.todayCount || 0;
        }
      }
    } catch (err) {
      console.error("[Usage Check] Firestore read failed:", err);
    }

    if (todayCount >= 2) {
      return res.status(429).json({
        error: "今日冥想盆的提取魔法能量已耗尽，请您明日再来梳理思绪。",
        code: "DAILY_LIMIT_EXCEEDED",
      });
    }

    const ai = getAIClient();
    if (!ai) {
      return res.status(503).json({ error: "AI Service not configured" });
    }

    try {
      const prompt = `作为一个专业的文字整理助手，请处理以下记录：
"${original}"

请完成以下两项任务：
1. polished: 整理这段文字，转为逻辑通顺的书面或干净口语文本。剔除语气词如"呃"、"那个"、"就是"等，梳理语序，保留核心意思。
2. title: 根据整理后的内容，提取一个极度简明、精准的短语作为主旨标题(不超过10个字)。不加标点。`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          temperature: 0.1,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              polished: {
                type: Type.STRING,
                description: "处理好之后的通顺连贯的文本，去除口水话。"
              },
              title: {
                type: Type.STRING,
                description: "简明精准的主旨标题，不超过10字。"
              }
            },
            required: ["polished", "title"]
          }
        },
      });

      const responseText = response.text || "{}";
      const data = JSON.parse(responseText);

      // ---- Update usage count ----
      try {
        await usageRef.set({ lastUseDate: today, todayCount: todayCount + 1 });
      } catch (err) {
        console.error("[Usage Update] Firestore write failed:", err);
      }

      res.json({
        polished: data.polished?.trim() || "",
        title: data.title?.trim() || ""
      });
    } catch (err: any) {
      if (err.message && (err.message.includes("API key not valid") || err.message.includes("API_KEY_INVALID"))) {
        console.warn("AI polish endpoint error: Invalid API Key provided. AI fallback will be used.");
        return res.status(401).json({ error: "Invalid API Key" });
      }
      console.error("AI polish error:", err.message || err);
      res.status(500).json({ error: "Failed to process text" });
    }
  });

  // Vite middleware for development or static serving for production
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.use((req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
