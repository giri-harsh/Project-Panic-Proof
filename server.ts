import 'dotenv/config';
import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

/**
 * Production-ready Gemini API wrapper with:
 * - Proper error handling for 429, 503, 404
 * - Exponential backoff retry logic
 * - Model fallback chain
 * - Comprehensive logging
 * - Request throttling awareness
 */

interface GeminiError extends Error {
  status?: number;
  code?: string;
  message: string;
}

// Models in order of preference
const MODELS = {
  PRIMARY: "gemini-2.5-flash",
  FALLBACK_1: "gemini-3.5-flash",
  FALLBACK_2: "gemini-flash-latest",
  FALLBACK_3: "gemini-3.1-flash-lite"
};

const MODEL_CHAIN = [
  MODELS.PRIMARY,
  MODELS.FALLBACK_1,
  MODELS.FALLBACK_2,
  MODELS.FALLBACK_3
];

const RISK_PREDICTION_MODEL_CHAIN = [
  "gemini-2.5-flash",
  "gemini-3.5-flash",
  "gemini-flash-latest",
  "gemini-3.1-flash-lite"
];

// Rate limiting configuration
const RATE_LIMIT_CONFIG = {
  FREE_TIER_RPM: 15,        // Free tier: 15 requests per minute
  INITIAL_RETRY_DELAY: 1000, // 1 second
  MAX_RETRIES: 3,
  BACKOFF_MULTIPLIER: 2
};

/**
 * Sleep helper for retry logic
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Determine if error is retryable
 */
function isRetryableError(error: any): boolean {
  const code = error.code || error.message;
  
  // 503 UNAVAILABLE - transient server error
  if (code.includes('UNAVAILABLE') || code.includes('503')) {
    return true;
  }
  
  // 429 RESOURCE_EXHAUSTED - quota exceeded (retryable after quota reset)
  if (code.includes('RESOURCE_EXHAUSTED') || code.includes('429')) {
    return true;
  }
  
  // 404 NOT_FOUND - model doesn't exist (not retryable)
  if (code.includes('NOT_FOUND') || code.includes('404')) {
    return false;
  }
  
  // Default: don't retry unknown errors
  return false;
}

/**
 * Get retry delay based on error type
 */
function getRetryDelay(error: any, attempt: number): number {
  const code = error.code || error.message;
  
  // For 429 (quota exhausted), wait longer
  if (code.includes('RESOURCE_EXHAUSTED') || code.includes('429')) {
    // Don't retry if quota is truly exhausted (limit: 0)
    if (error.message.includes('limit: 0')) {
      return 0; // Signal: don't retry
    }
    return RATE_LIMIT_CONFIG.INITIAL_RETRY_DELAY * Math.pow(RATE_LIMIT_CONFIG.BACKOFF_MULTIPLIER, attempt) * 2;
  }
  
  // For 503 (service overloaded), exponential backoff
  if (code.includes('UNAVAILABLE') || code.includes('503')) {
    return RATE_LIMIT_CONFIG.INITIAL_RETRY_DELAY * Math.pow(RATE_LIMIT_CONFIG.BACKOFF_MULTIPLIER, attempt);
  }
  
  return 0;
}

/**
 * Initialize Gemini AI client
 */
function createGeminiClient(apiKey: string) {
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is missing");
  }
  
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'panic-proof-app/1.0',
      }
    }
  });
}

/**
 * Generate content with retry logic and model fallback
 */
async function generateWithFallback(
  ai: ReturnType<typeof createGeminiClient>,
  prompt: string,
  config: {
    responseMimeType: string;
    responseSchema: any;
  },
  context: string = "unknown",
  modelChain: string[] = MODEL_CHAIN
): Promise<string> {
  let lastError: GeminiError | null = null;
  
  for (const model of modelChain) {
    let retryCount = 0;
    
    while (retryCount <= RATE_LIMIT_CONFIG.MAX_RETRIES) {
      try {
        console.log(`[${context}] Attempting model: ${model} (retry ${retryCount})`);
        
        const response = await ai.models.generateContent({
          model: model,
          contents: {
            parts: [{ text: prompt }]
          },
          config
        });
        
        const text = response.text;
        if (!text) {
          throw new Error("Empty response from AI");
        }
        
        console.log(`[${context}] ✅ Success with model: ${model}`);
        return text;
        
      } catch (error: any) {
        lastError = error;
        
        const errorCode = error.code || error.message || 'UNKNOWN';
        const errorStatus = error.status || 'no-status';
        
        console.error(`[${context}] ❌ Model ${model} failed:`, {
          status: errorStatus,
          code: errorCode,
          message: error.message,
          retryAttempt: retryCount,
          timestamp: new Date().toISOString()
        });
        
        // Check if error is retryable
        if (!isRetryableError(error)) {
          console.warn(`[${context}] Error is not retryable, moving to next model`);
          break;
        }
        
        // Get retry delay
        const delay = getRetryDelay(error, retryCount);
        
        if (delay === 0) {
          console.warn(`[${context}] Quota exhausted (limit: 0), cannot retry`);
          break;
        }
        
        if (retryCount < RATE_LIMIT_CONFIG.MAX_RETRIES) {
          console.log(`[${context}] Retrying in ${delay}ms...`);
          await sleep(delay);
          retryCount++;
        } else {
          console.warn(`[${context}] Max retries reached for model ${model}`);
          break;
        }
      }
    }
  }
  
  // All models failed
  console.error(`[${context}] ❌ All models failed. Last error:`, {
    code: lastError?.code,
    message: lastError?.message
  });
  
  throw new Error(`All Gemini models failed: ${lastError?.message || 'unknown error'}`);
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Validate Gemini setup on startup
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("❌ FATAL: GEMINI_API_KEY not found in environment variables");
    process.exit(1);
  }
  console.log("✅ GEMINI_API_KEY loaded from environment");

  // Initialize Gemini client once
  let geminiClient: ReturnType<typeof createGeminiClient>;
  try {
    geminiClient = createGeminiClient(apiKey);
    console.log("✅ Gemini AI client initialized");
  } catch (error) {
    console.error("❌ Failed to initialize Gemini client:", error);
    process.exit(1);
  }

  // API route: Prioritize tasks
  app.post("/api/tasks/prioritize", async (req, res) => {
    try {
      const { tasks, profile, mood } = req.body;

      const prompt = `
      You are an AI task scheduler.
      Given the following list of pending tasks, the user's primary personality trait, and their CURRENT MOOD,
      analyze the tasks (their titles, estimated times, types) and determine the optimal execution order.
      Return the tasks ordered by priority, and provide a brief explanation for why this ordering is optimal based on the user's personality trait and current mood.
      
      User Primary Trait: ${profile?.primaryType || 'General'}
      User Secondary Trait: ${profile?.secondaryType || 'General'}
      Current Mood: ${mood || 'Not specified'}
      
      Tasks:
      ${JSON.stringify(tasks, null, 2)}
      `;

      try {
        const text = await generateWithFallback(geminiClient, prompt, {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              orderedTaskIds: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "The IDs of the tasks in the recommended execution order."
              },
              explanation: {
                type: Type.STRING,
                description: "A brief explanation of the prioritization."
              }
            },
            required: ["orderedTaskIds", "explanation"]
          }
        }, "PRIORITIZE");
        
        const data = JSON.parse(text);
        res.json(data);
      } catch (error: any) {
        // Fallback response when AI fails
        console.warn("Using fallback for prioritization");
        res.json({
          orderedTaskIds: tasks.map((t: any) => t.id),
          explanation: "AI service is temporarily unavailable. Showing tasks in original order."
        });
      }
    } catch (error) {
      console.error("Prioritize endpoint error:", error);
      res.status(500).json({ error: "Failed to prioritize tasks" });
    }
  });

  // API route: Break down task
  app.post("/api/tasks/breakdown", async (req, res) => {
    try {
      const { task } = req.body;

      const prompt = `
      You are an AI task break-down assistant.
      Break down the following task into 3-5 manageable, actionable subtasks.
      
      Task Title: ${task.title}
      Task Type: ${task.type}
      Est Time: ${task.estTime} mins
      `;

      try {
        const text = await generateWithFallback(geminiClient, prompt, {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              subtasks: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING }
                  },
                  required: ["title"]
                },
                description: "An array of subtasks."
              }
            },
            required: ["subtasks"]
          }
        }, "BREAKDOWN");
        
        const data = JSON.parse(text);
        res.json(data);
      } catch (error: any) {
        // Fallback response when AI fails
        console.warn("Using fallback for task breakdown");
        res.json({
          subtasks: [
            { title: "Review requirements and context" },
            { title: "Draft initial approach" },
            { title: "Execute the main task" },
            { title: "Review and refine" }
          ]
        });
      }
    } catch (error) {
      console.error("Breakdown endpoint error:", error);
      res.status(500).json({ error: "Failed to break down task" });
    }
  });

  // Health check endpoint
  app.get("/health", (req, res) => {
    res.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      gemini: {
        configured: !!apiKey,
        models: MODEL_CHAIN
      }
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📊 Models available: ${MODEL_CHAIN.join(', ')}`);
    console.log(`⏱️  Free tier limit: ${RATE_LIMIT_CONFIG.FREE_TIER_RPM} requests/minute`);
  });
}

startServer().catch(error => {
  console.error("Failed to start server:", error);
  process.exit(1);
});
