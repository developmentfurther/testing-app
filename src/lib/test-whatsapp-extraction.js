'use server'

import OpenAI from "openai";

// --- 1. CONFIGURACIÓN Y HELPERS ---
const apiKey = process.env.API_WHATSAPP;
const openai = apiKey ? new OpenAI({ apiKey }) : null;

function stripCodeFences(text = "") {
  let t = String(text || "").trim();
  if (t.startsWith("```")) {
    t = t
      .replace(/^```[a-zA-Z]*\n?/, "")
      .replace(/```$/, "")
      .trim();
  }
  return t;
}

function getResponseText(resp) {
  if (!resp) return "";
  if (typeof resp.output_text === "string") return resp.output_text;
  try {
    const out = Array.isArray(resp.output) ? resp.output : [];
    for (const item of out) {
      const content = Array.isArray(item?.content) ? item.content : [];
      for (const c of content) {
        if (typeof c?.text === "string") return c.text;
        if (c?.type === "output_text" && typeof c?.text === "string")
          return c.text;
      }
    }
  } catch {}
  return "";
}

// --- 2. DATOS HARDCODEADOS ---
const TEST_CONVERSATION_ID = "whatsapp-test-session-999";
const TEST_TOPIC = "consulta_b2c";
const TEST_HISTORY = [
  { from: "user", text: "Hola, buen día. Quería averiguar para clases de inglés." },
  { from: "bot", text: "¡Hola! 👋 Soy Mr. Further. ¿Es para vos o para una empresa?" },
  { from: "user", text: "Es para mi nene, tiene 10 años." },
  { from: "bot", text: "¿Va al colegio actualmente? ¿Tiene conocimientos previos?" },
  { from: "user", text: "Si, va al San Andrés. Sabe un poquito, lo básico del cole." },
  { from: "bot", text: "Perfecto. ¿Buscas modalidad online o presencial?" },
  { from: "user", text: "Presencial por favor, somos de Saavedra." }
];

// --- 3. LÓGICA DE TEST ---
export async function testWhatsappExtraction() {
  console.log("🔵 Iniciando Test de Extracción WhatsApp...");

  if (!openai) return { success: false, message: "Falta OPENAI_API_KEY" };

  try {
    const conversationText = TEST_HISTORY.map((m) => {
        const from = (m.from || "user").toString();
        const text = (m.text || "").toString().replace(/\s+/g, " ").trim();
        return `[${from}] ${text}`;
    }).join("\n");

    const prompt = `
Sos Mr.Further, el asistente virtual de Further English.
Tu tarea es analizar esta conversación y devolver JSON estructurado.

Contexto:
- ID: ${TEST_CONVERSATION_ID}
- Historial:
${conversationText}

Devolvé JSON válido según el esquema.
`;

    // --- SCHEMA CORREGIDO ---
    const schema = {
      type: "object",
      additionalProperties: false,
      required: ["mode", "segment", "analytics", "b2b", "b2c", "resumen"],
      properties: {
        mode: { type: "string", enum: ["bot", "human"] },
        segment: { anyOf: [{ type: "string", enum: ["b2b", "b2c"] }, { type: "null" }] },
        analytics: {
          type: "object",
          additionalProperties: false,
          required: ["nombre", "sexo", "edad", "zona", "profesion", "empresa"],
          properties: {
            nombre: { type: "string" },
            sexo: { type: "string" },
            edad: { anyOf: [{ type: "number" }, { type: "null" }] },
            zona: { type: "string", enum: ["CABA", "GBA", "Interior", "Latam", "Otro", ""] },
            profesion: { type: "string" },
            empresa: { type: "string" },
          },
        },
        // 👇 AQUÍ ESTABA EL ERROR: Faltaba 'required'
        b2b: {
           type: "object", 
           additionalProperties: false, 
           required: ["empresa"], // 
           properties: { 
               empresa: {type:"string"} 
           } 
        },
        b2c: {
          type: "object",
          additionalProperties: false,
          required: ["modalidad", "sede", "para", "nombreNinio", "grado", "colegio", "inglesPrevio"],
          properties: {
            modalidad: { anyOf: [{ type: "string", enum: ["presencial", "online"] }, { type: "null" }] },
            sede: { anyOf: [{ type: "string", enum: ["Saavedra", "Parque Patricios"] }, { type: "null" }] },
            para: { anyOf: [{ type: "string", enum: ["adulto", "niño"] }, { type: "null" }] },
            nombreNinio: { type: "string" },
            grado: { type: "string" },
            colegio: { type: "string" },
            inglesPrevio: { anyOf: [{ type: "string", enum: ["si", "no"] }, { type: "null" }] },
          },
        },
        resumen: { type: "string" },
      },
    };

    // Llamada a la API
    const resp = await openai.responses.create({
      model: "gpt-5-mini", // Asegúrate que este modelo soporta 'strict: true'
      input: [{ role: "user", content: prompt }],
      text: {
        format: {
          type: "json_schema",
          name: "extract_info",
          strict: true,
          schema,
        },
      },
    });

    const rawText = getResponseText(resp);
    const cleaned = stripCodeFences(rawText);
    const parsed = JSON.parse(cleaned);

    const validation = {
        esB2C: parsed.segment === "b2c",
        esNinio: parsed.b2c?.para === "niño",
        sedeDetectada: parsed.b2c?.sede === "Saavedra"
    };

    const pasoTest = Object.values(validation).every(v => v === true);

    return {
        success: pasoTest,
        message: pasoTest ? "Extracción Correcta" : "Datos extraídos incorrectos",
        datosExtraidos: parsed
    };

  } catch (err) {
    console.error("🔥 Error en WhatsApp Extraction:", err);
    return {
      success: false,
      message: "Error técnico: " + err.message
    };
  }
}