'use server'

import OpenAI from "openai";

const apiKey = process.env.API_WEB;
const N8N_WEBHOOK_URL_CONVERSATIONAL = process.env.N8N_WEBHOOK_URL_CONVERSATIONAL;

const MODEL = "gpt-4o-mini";

/* -------------------------------------------
   DATOS HARDCODEADOS
-------------------------------------------- */

const TEST_USER = {
  name: "Test Automation User",
  city: "Córdoba",
  email: "test.conversationalclub@further.test",
  motivation: "I want to improve my speaking skills."
};

/* -------------------------------------------
   TEST PRINCIPAL
-------------------------------------------- */

export async function testConversationalClub() {

  console.log("🔵 Iniciando Test Conversational Club...");

  if (!apiKey) {
    return { success: false, message: "Falta API_WEB" };
  }

  if (!N8N_WEBHOOK_URL_CONVERSATIONAL) {
    return { success: false, message: "Falta N8N_WEBHOOK_URL_CONVERSATIONAL" };
  }

  try {

    const client = new OpenAI({ apiKey });

    /* ---------------------------------------------------
       1️⃣ FORZAMOS GENERACIÓN DE JSON FINAL
    ---------------------------------------------------- */

    const systemPrompt = `
You are the Conversational Club assistant.

Collected data:
Name: ${TEST_USER.name}
City: ${TEST_USER.city}
Email: ${TEST_USER.email}
Motivation: ${TEST_USER.motivation}

The user reviewed the summary and answered: YES.

Return ONLY strict JSON:
{
  "action": "finalize_registration",
  "name": "...",
  "city": "...",
  "email": "...",
  "motivation": "..."
}
No markdown.
`;

    const completion = await client.chat.completions.create({
      model: MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: "YES" }
      ],
      temperature: 0.1
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
      throw new Error(`OpenAI no devolvió JSON válido. Recibido: ${raw}`);
    }

    /* ---------------------------------------------------
       2️⃣ VALIDACIONES ESTRICTAS
    ---------------------------------------------------- */

    if (parsed.action !== "finalize_registration") {
      throw new Error(`Action inválida: ${parsed.action}`);
    }

    if (!parsed.name || parsed.name.split(" ").length < 2) {
      throw new Error("Nombre inválido.");
    }

    if (!parsed.email.includes("@")) {
      throw new Error("Email inválido.");
    }

    if (!parsed.city) {
      throw new Error("City faltante.");
    }

    if (!parsed.motivation) {
      throw new Error("Motivation faltante.");
    }

    /* ---------------------------------------------------
       3️⃣ LLAMADA REAL A WEBHOOK
    ---------------------------------------------------- */

    const response = await fetch(N8N_WEBHOOK_URL_CONVERSATIONAL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
  action: "submit_form",
  isTest: true,
  ...parsed
}),

      cache: "no-store"
    });

    if (!response.ok) {
      throw new Error(`Error HTTP n8n: ${response.status}`);
    }

    const text = await response.text();

    if (!text) {
      throw new Error("n8n no devolvió contenido.");
    }

    let webhookResult;

    try {
      webhookResult = JSON.parse(text);
    } catch {
      throw new Error(`n8n no devolvió JSON válido: ${text}`);
    }

    if (!webhookResult.reply) {
      throw new Error("n8n no devolvió campo reply.");
    }

    /* ---------------------------------------------------
       ✅ TODO OK
    ---------------------------------------------------- */

    return {
      success: true,
      message: "Conversational Club OK",
      output: {
        generatedJSON: parsed,
        webhookReply: webhookResult.reply
      }
    };

  } catch (err) {

    console.error("🔥 ERROR CONVERSATIONAL CLUB:", err);

    return {
      success: false,
      message: err.message
    };
  }
}
