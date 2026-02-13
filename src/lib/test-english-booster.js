'use server'

import OpenAI from "openai";

/* -------------------------------------------
   CONFIG
-------------------------------------------- */

const apiKey = process.env.API_WEB;
const N8N_WEBHOOK_URL_ENGLISH = process.env.N8N_WEBHOOK_URL_ENGLISH;

const MODEL = "gpt-4o-mini";

/* -------------------------------------------
   DATOS HARDCODEADOS (Determinísticos)
-------------------------------------------- */

const TEST_USER = {
  fullName: "Test Automation",
  email: "test.englishbooster@further.test",
  location: "Córdoba",
  modules: [
    "Boost Your Speaking Confidence",
    "Meetings That Flow"
  ]
};

/* -------------------------------------------
   FUNCIÓN PRINCIPAL
-------------------------------------------- */

export async function testEnglishBooster() {

  console.log("🔵 Iniciando Test English Booster...");

  if (!apiKey) {
    return { success: false, message: "Falta API_WEB" };
  }

  if (!N8N_WEBHOOK_URL_ENGLISH) {
    return { success: false, message: "Falta N8N_WEBHOOK_URL_ENGLISH" };
  }

  try {

    const client = new OpenAI({ apiKey });

    /* ---------------------------------------------------
       1️⃣ FORZAMOS GENERACIÓN DE JSON register_user
    ---------------------------------------------------- */

    const systemPrompt = `
You are an AI Assistant for Further Corporate - English Booster.

The user has selected the following modules:
- Boost Your Speaking Confidence
- Meetings That Flow

User data:
Full Name: ${TEST_USER.fullName}
Email: ${TEST_USER.email}
Location: ${TEST_USER.location}

The user has CONFIRMED the registration.

Return ONLY strict JSON:
{
  "action": "register_user",
  "fullName": "...",
  "email": "...",
  "location": "...",
  "modules": [...]
}

Use EXACT module titles.
Do NOT include markdown.
`;

    const completion = await client.chat.completions.create({
      model: MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: "CONFIRM" }
      ]
    });

    const raw = completion.choices[0]?.message?.content || "";

    if (!raw) {
      throw new Error("OpenAI no devolvió contenido.");
    }

    const cleaned = raw.replace(/```json|```/g, "").trim();

    let parsed;

    try {
      parsed = JSON.parse(cleaned);
    } catch {
      throw new Error("El modelo no devolvió JSON válido.");
    }

    /* ---------------------------------------------------
       2️⃣ VALIDACIÓN ESTRICTA DEL JSON
    ---------------------------------------------------- */

    if (parsed.action !== "register_user") {
      throw new Error("Action inválida.");
    }

    if (!Array.isArray(parsed.modules)) {
      throw new Error("Modules no es array.");
    }

    const expectedModules = TEST_USER.modules;

    const modulesValid = expectedModules.every(m =>
      parsed.modules.includes(m)
    );

    if (!modulesValid) {
      throw new Error("Los módulos no coinciden exactamente.");
    }

    if (!parsed.fullName || !parsed.email || !parsed.location) {
      throw new Error("Faltan campos obligatorios.");
    }

    /* ---------------------------------------------------
       3️⃣ LLAMADA REAL A WEBHOOK n8n
    ---------------------------------------------------- */

    const n8nResponse = await fetch(N8N_WEBHOOK_URL_ENGLISH, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(parsed),
      cache: "no-store"
    });

    if (!n8nResponse.ok) {
      throw new Error(`Error HTTP n8n: ${n8nResponse.status}`);
    }

    const textResult = await n8nResponse.text();

    if (!textResult) {
      throw new Error("n8n no devolvió contenido.");
    }

    let jsonResult;

    try {
      jsonResult = JSON.parse(textResult);
    } catch {
      throw new Error("n8n no devolvió JSON válido.");
    }

    if (typeof jsonResult.confirmed !== "number" || typeof jsonResult.waitlisted !== "number") {
  throw new Error("n8n no devolvió estructura esperada (confirmed/waitlisted).");
}

let derivedStatus;

if (jsonResult.confirmed > 0 && jsonResult.waitlisted === 0) {
  derivedStatus = "confirmed";
} 
else if (jsonResult.confirmed > 0 && jsonResult.waitlisted > 0) {
  derivedStatus = "partial";
} 
else if (jsonResult.confirmed === 0 && jsonResult.waitlisted > 0) {
  derivedStatus = "waitlist";
} 
else {
  throw new Error("Respuesta inconsistente de n8n.");
}


    /* ---------------------------------------------------
       ✅ ÉXITO
    ---------------------------------------------------- */

    return {
  success: true,
  message: `English Booster OK (${derivedStatus})`,
  details: {
    generatedJSON: parsed,
    webhookRaw: jsonResult,
    derivedStatus
  }
};


  } catch (err) {

    console.error("🔥 ERROR EN ENGLISH BOOSTER:", err);

    return {
      success: false,
      message: err.message
    };
  }
}
