'use server'

import OpenAI from "openai";

// --- DATOS HARDCODEADOS (Lo que pidió tu coworker) ---
// Simulamos que un alumno A1 quiere hablar en Español
const TEST_LEVEL = "A1";
const TEST_LANGUAGE = "Spanish";
const TEST_MESSAGES = [
  { role: "user", content: "Hola, me llamo Juan. ¿Cómo estás?" }
];

// --- TU LÓGICA CLONADA ---

// Reemplazo simple para tu función retry que no tenemos aquí
async function retry(fn, retries = 3) {
  try {
    return await fn();
  } catch (error) {
    if (retries > 0) return retry(fn, retries - 1);
    throw error;
  }
}

// OJO: Aquí usamos la key específica para Campus que pusiste en tu .env nuevo
const apiKey = process.env.API_CAMPUS; 
const openai = new OpenAI({ apiKey });
const MODEL_ID = "gpt-5-mini"; // Mantengo tu modelo (asumiendo que tienes acceso)

const SYSTEM_PROMPT = `
You are a professional language tutor for Further Campus.
ACT SHORT AND CONCISE FOR TESTING PURPOSES.
Just reply confirming you are active and ready to teach Spanish at level A1.
`;

function sanitize(text) {
  if (!text) return "";
  return text
    .replace(/<[^>]+>/g, " ")
    .replace(/\*/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

// Esta es la función que llamarás desde tu botón de test
export async function testCampusChat() {
  try {
    console.log("🔵 Iniciando Test de Campus Chat...");

    const systemPrompt = SYSTEM_PROMPT
      .replace(/{{LEVEL}}/g, TEST_LEVEL)
      .replace(/{{LANGUAGE}}/g, TEST_LANGUAGE);

    const openaiMessages = [
      { role: "system", content: systemPrompt },
      ...TEST_MESSAGES.map((m) => ({
        role: m.role,
        content: sanitize(m.content),
      })),
    ];

    // Clonamos la llamada exacta
    const stream = await retry(
      () =>
        openai.chat.completions.create({
          model: MODEL_ID,
          messages: openaiMessages,
          stream: true,
        }),
      3
    );

    // --- DIFERENCIA CLAVE PARA EL TEST ---
    // En la app real devuelves un Response stream.
    // Aquí, para el test, vamos a consumir el stream y devolver el texto final
    // para verificar que la respuesta tenga sentido.
    
    let fullResponse = "";
    
    for await (const chunk of stream) {
        const text = chunk.choices[0]?.delta?.content || "";
        fullResponse += text;
    }

    // Si llegamos aquí, es un ÉXITO
    return { 
        success: true, 
        message: "Test Exitoso: OpenAI respondió correctamente.", 
        responseFromAI: fullResponse 
    };

  } catch (err) {
    console.error("🔥 ERROR EN TEST:", err);
    return { 
        success: false, 
        message: "Falló el test: " + err.message 
    };
  }
}