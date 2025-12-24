'use server'

// --- 1. CLONAMOS LA LÓGICA (Reglas y URL) ---

// URL del Webhook (Idealmente en tu .env, pero dejamos el fallback del código original)
const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL;

// Esta regla es lo que le da "personalidad" al bot en n8n
const BACKEND_RULE_HINT =
  "You are Mr Further, Further Academy virtual assistant. Always answer in English (switch to Spanish only if user explicitly asks). Keep answers as short as possible to save tokens. Always return simple valid HTML (<p>, <ul><li>, <strong>, <u>, <br>), never markdown. Focus on: how Further Academy works, courses, how to access/buy/activate, basic usage, and suggest human contact for payments, billing or edge cases.";

// --- 2. DATOS HARDCODEADOS ---
const TEST_SESSION_ID = "test-session-central-app-v1";
const TEST_MESSAGE = "What is Further Academy?"; // Pregunta simple del FAQ
const TEST_HISTORY = []; // Simulamos que es el primer mensaje

export async function testAcademyChat() {

  if (!N8N_WEBHOOK_URL) {
    return {
      success: false,
      message: "❌ Falta N8N_WEBHOOK_URL en .env"
    };
  }
  try {
    console.log("🔵 Iniciando Test de Academy (n8n Webhook)...");

    // --- BLOQUE DE CÓDIGO CLONADO (La llamada Fetch) ---
    const response = await fetch(N8N_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: TEST_MESSAGE,
        history: TEST_HISTORY,
        sessionId: TEST_SESSION_ID,
        rules: BACKEND_RULE_HINT,
      }),
      // Cache: no-store es importante en Next 15/16 para que no cachee el test
      cache: 'no-store' 
    });

    if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
    }

    const raw = await response.text();
    let botText = "";
    let parsed = null;

    // Lógica de fallback clonada del componente original
    try {
        parsed = JSON.parse(raw);
    } catch {
        parsed = null;
    }

    if (parsed && typeof parsed === "object") {
        botText =
          parsed.reply ||
          parsed.text ||
          parsed.result ||
          parsed.output ||
          raw ||
          "No se entendió la respuesta JSON";
    } else {
        botText = raw;
    }
    // ---------------------------------------------------

    // Validamos que haya respondido algo coherente
    // Como el bot devuelve HTML, buscamos etiquetas o texto clave
    const esValido = botText && botText.length > 5;

    return {
      success: esValido,
      message: esValido ? "n8n respondió correctamente" : "Respuesta vacía o inválida",
      respuestaIA: botText,
    };

  } catch (err) {
    console.error("🔥 ERROR EN ACADEMY CHAT:", err);
    return {
      success: false,
      message: err.message || "Error conectando con n8n"
    };
  }
}