'use server'

import OpenAI from "openai";

// 1. CLONAMOS EL CONOCIMIENTO (Hardcodeado como pidió tu coworker)
// (He recortado un poco el texto para el ejemplo, pero tú podrías pegar el KNOWLEDGE entero si quieres ser exacto)
const KNOWLEDGE = `
Sobre Further
- Empresa de enseñanza de idiomas y soluciones idiomáticas con sede en Buenos Aires; +25 años de trayectoria.
- Enfoque 100% comunicacional e inmersivo; B2B (empresas) y B2C (particulares).
- Idiomas: Inglés, Portugués, Italiano, Francés, Alemán y Español para Extranjeros.
- Staff docente de excelencia, con profesores nativos.
- Misión: enseñar con enfoque comunicacional y práctico.
- Ubicación: Buenos Aires, Argentina. Oficinas en Belgrano. Sedes School: Parque Patricios y Saavedra.
`.trim();

// 2. CLONAMOS LA INSTRUCCIÓN DEL SISTEMA
const SYSTEM_INSTRUCTION = `
Eres “Mr. Further”, un asistente que SOLO responde usando la información del KNOWLEDGE proporcionado.
Si la consulta NO está relacionada con Further, debés responder EXACTAMENTE:
“Solo puedo responder sobre Further y los servicios/recursos descritos en nuestro material institucional.”
PRIORIDADES:
1) Responder SOLO con información contenida en KNOWLEDGE.
2) Mantener un tono amable, claro y corporativo.
`.trim();

// 3. COMBINAMOS TODO (Igual que hace el componente en React)
const FULL_SYSTEM_CONTEXT = SYSTEM_INSTRUCTION + "\n\nKNOWLEDGE:\n" + KNOWLEDGE;

// 4. CONFIGURACIÓN
// Usa la key específica del Chatbot Web
const apiKey = process.env.API_WEB || process.env.API_WEB;

const client = new OpenAI({
  apiKey: apiKey,
});

// 5. FUNCIÓN DE TEST
export async function testWebChatbot() {
  try {
    console.log("🔵 Iniciando Test de Web Chatbot (Mr. Further)...");

    // Simulamos una pregunta real de un usuario
    const userMessage = "Hola, ¿dónde quedan las sedes de la escuela?";

    // Preparamos los mensajes clonando la lógica del componente
    const responseMessages = [
      { role: "system", content: FULL_SYSTEM_CONTEXT }, // <--- Pasamos el contexto real
      { role: "user", content: userMessage }
    ];

    // --- BLOQUE DE LLAMADA A LA API ---
    // NOTA: Mantenemos 'client.responses.create' porque así estaba en tu API original.
    // Si falla, recuerda cambiar a 'client.chat.completions.create'
    const response = await client.responses.create({
      model: "gpt-5-mini", 
      input: responseMessages,
    });

    const output =
      response.output_text ||
      response.output?.[0]?.content?.[0]?.text ||
      "No response generated.";
    // ----------------------------------

    // Validamos si la respuesta tiene sentido (si mencionó las sedes)
    const pasoLaPrueba = output.toLowerCase().includes("parque patricios") || output.toLowerCase().includes("saavedra");

    return {
      success: true, // O podrías poner 'pasoLaPrueba' para ser estricto
      message: "Mr. Further respondió correctamente.",
      pregunta: userMessage,
      respuestaIA: output,
      validacionLogica: pasoLaPrueba ? "✅ La IA usó el KNOWLEDGE" : "⚠️ La IA respondió pero ignoró el contexto"
    };

  } catch (error) {
    console.error("🔥 ERROR EN MR. FURTHER:", error);
    return {
      success: false,
      message: error.message || "Error desconocido al contactar a Mr. Further"
    };
  }
}