import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy-initialize Gemini client to avoid startup crashes if key is missing
let aiInstance: GoogleGenAI | null = null;

function getGenAI(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is not configured in Secrets / Settings.");
  }
  if (!aiInstance) {
    aiInstance = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiInstance;
}

// 1. AI Coach Chat Endpoint
app.post("/api/coach/ask", async (req: any, res: any) => {
  try {
    const { messages, vibe, isEmergency, currentTaskContext } = req.body;
    const ai = getGenAI();

    let systemPrompt = "You are 'S.O.S Coach', an ultra-supportive yet hyper-focused crisis productivity AI assistant for the 'Last Minute Life Saver' application.\n\n";
    
    if (vibe === 'drill_sergeant') {
      systemPrompt += "VIBE: DRILL SERGEANT. Tone is strict, direct, and high-intensity. Use tough love. Call out excuses. Tell the user exactly what to do. Use exclamation points and keep paragraphs to 1-2 powerful sentences. Order them to work immediately!";
    } else if (vibe === 'comforting_friend') {
      systemPrompt += "VIBE: COMFORTING FRIEND. Tone is deeply warm, validating, and compassionate. Reduce their shame/guilt first. Remind them that they are human and can do this. Break paralyzing tasks into microscopically small, stress-free actions (e.g., 'just write one single sentence').";
    } else if (vibe === 'hyper_logical') {
      systemPrompt += "VIBE: HYPER LOGICAL. Tone is scientific, objective, and analytical. Frame productivity as a flow optimization problem. Use precise numbers, prioritization matrices, time-boxing techniques, and eliminate non-essential work. Be concise and crisp.";
    } else { // extreme_urgency
      systemPrompt += "VIBE: EXTREME URGENCY. Tone is high-adrenaline, countdown-focused, and rapid. Speak like a rescue team coordinator. Use short phrases, fast bullets, and focus 100% on high-speed shortcuts, scoop reduction, and fast actions. Every second counts!";
    }

    if (isEmergency) {
      systemPrompt += "\n\nCRITICAL CONTEXT: EMERGENCY PANIC MODE IS ON. The user has extremely tight deadlines. Cut out pleasantries, greetings, and long concluding statements. Give an immediate, bulleted battle plan for the next 30 minutes. Focus on blocking distractions and starting immediately.";
    }

    if (currentTaskContext) {
      systemPrompt += `\n\nActive Task Context: ${JSON.stringify(currentTaskContext)}`;
    }

    let contentsPayload;
    if (Array.isArray(messages) && messages.length > 0) {
      contentsPayload = messages.map((m: any) => ({
        role: m.sender === 'user' ? 'user' : 'model',
        parts: [{ text: m.text }]
      }));
    } else {
      contentsPayload = [{ role: 'user', parts: [{ text: "Hello! I have some critical work due soon and I am stressing out. Help me!" }] }];
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: contentsPayload,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.75,
      }
    });

    res.json({ text: response.text });
  } catch (error: any) {
    console.error("Error in /api/coach/ask:", error);
    res.status(500).json({ error: error.message || "Failed to communicate with AI Coach" });
  }
});

// 2. AI Schedule Generation Endpoint
app.post("/api/schedule/generate", async (req: any, res: any) => {
  try {
    const { tasks, availableHours } = req.body;
    const ai = getGenAI();

    const hours = availableHours || 8;
    const prompt = `Generate a highly structured crisis scheduling timeline (Schedule Blocks) for the next ${hours} hours to tackle the pending tasks.
Tasks list: ${JSON.stringify(tasks)}
Current Time: ${new Date().toISOString()}

Follow these safety rules:
1. Generate blocks starting from the current time.
2. Structure the blocks as study/work intervals (e.g. 45-50 min of work) followed by short recovery breaks (5-10 min).
3. Associate blocks with a taskId from the tasks list if it is a task-focused block.
4. Provide a super actionable 'activity' description for each block (e.g., 'Draft intro paragraph and outline', 'Write index.css styles').
5. Output the schedule strictly matching the JSON schema.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              taskId: { type: Type.STRING, description: "ID of the corresponding task if applicable, or null/empty" },
              taskTitle: { type: Type.STRING, description: "Simple title of the block or task" },
              startTime: { type: Type.STRING, description: "ISO 8601 datetime string representing start of block" },
              endTime: { type: Type.STRING, description: "ISO 8601 datetime string representing end of block" },
              isBreak: { type: Type.BOOLEAN, description: "True if this is a rest/recharge interval, False for work" },
              activity: { type: Type.STRING, description: "Clear, single micro-step for the user to execute during this block" }
            },
            required: ["taskTitle", "startTime", "endTime", "isBreak", "activity"]
          }
        },
        temperature: 0.4,
      }
    });

    const textResult = response.text;
    if (!textResult) {
      throw new Error("No schedule returned from Gemini API");
    }
    const blocks = JSON.parse(textResult.trim());
    res.json({ blocks });
  } catch (error: any) {
    console.error("Error in /api/schedule/generate:", error);
    res.status(500).json({ error: error.message || "Failed to generate AI schedule" });
  }
});

// 3. AI Deadline Prediction & Rescue Plan Endpoint
app.post("/api/deadline/predict", async (req: any, res: any) => {
  try {
    const { tasks } = req.body;
    const ai = getGenAI();

    const prompt = `Perform a high-precision crisis risk prediction on these tasks to calculate the percentage chance of missing their deadlines.
Current Time: ${new Date().toISOString()}
Tasks list: ${JSON.stringify(tasks)}

Considerations:
1. Compare remaining hours until the deadline with the estimatedMinutes.
2. Factor in the difficulty and priority of the tasks.
3. Completed tasks should always have a 0% chance of missing.
4. Overdue tasks must have a 100% chance.
5. Provide a sharp, data-driven reason for the risk, and a high-impact 'rescue suggestion' (e.g., scope reduction, template usage, draft-only).`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              taskId: { type: Type.STRING, description: "The ID of the task analyzed" },
              taskTitle: { type: Type.STRING, description: "The title of the task" },
              chanceOfMissing: { type: Type.INTEGER, description: "Risk percentage from 0 to 100 of missing the deadline" },
              reason: { type: Type.STRING, description: "Direct bottleneck reason (e.g., 'Requires 6 hours of coding, but deadline is in 2 hours')" },
              suggestion: { type: Type.STRING, description: "A high-impact crisis rescue step to salvaging the deadline" }
            },
            required: ["taskId", "taskTitle", "chanceOfMissing", "reason", "suggestion"]
          }
        },
        temperature: 0.3,
      }
    });

    const textResult = response.text;
    if (!textResult) {
      throw new Error("No predictions returned from Gemini API");
    }
    const predictions = JSON.parse(textResult.trim());
    res.json({ predictions });
  } catch (error: any) {
    console.error("Error in /api/deadline/predict:", error);
    res.status(500).json({ error: error.message || "Failed to predict deadline risks" });
  }
});

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", geminiConfigured: !!process.env.GEMINI_API_KEY });
});

// Vite Middleware for Asset Serving & Static Site Fallback
async function main() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

main().catch((err) => {
  console.error("Failed to start server:", err);
});
