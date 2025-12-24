'use server'

import { GoogleGenerativeAI } from "@google/generative-ai";

// --- 1. DATOS HARDCODEADOS (El examen simulado) ---
const TEST_PAYLOAD = {
  email: "alumno_test@further.com",
  // Simulamos 1 ejercicio de Texto (Writing)
  textExercises: {
    "ex_writing_01": {
      sectionId: "writing_sec",
      prompt: "Write a short paragraph about your last vacation. Include where you went and what you did.",
      answer: "Last summer I go to Brazil. It was very beautiful. I went to the beach everyday and drink coconut water.", // Tiene errores gramaticales a propósito
      maxPoints: 20,
      rubric: "Evaluar gramática (uso de pasado simple), vocabulario y coherencia. Descontar puntos por errores de verbo 'go' en lugar de 'went'.",
      model: "gemini-2.5-flash"
    }
  },
  // Simulamos 1 ejercicio de Listening
  listeningExercises: {
    "ex_listening_01": {
      sectionId: "listening_sec",
      title: "Airport Announcements",
      answer: "The flight is delayed due to bad weather.",
      plays: 1, // Escuchó 1 vez
      maxPoints: 10,
      rubric: "La respuesta debe mencionar 'delayed' y 'weather'.",
      model: "gemini-2.5-flash"
    }
  }
};

// --- 2. LÓGICA CLONADA (Helpers) ---

function normalizeModel(input) {
  const SUPPORTED = new Set([
    "gemini-2.5-flash",
    "gemini-2.5-pro",
    "gemini-2.0-flash",
  ]);
  const m = String(input || "").trim().toLowerCase();
  if (m.startsWith("gemini-1.5-pro")) return "gemini-2.5-pro";
  if (m.startsWith("gemini-1.5-flash")) return "gemini-2.5-flash";
  if (SUPPORTED.has(m)) return m;
  return "gemini-2.5-flash";
}

async function gradeOneWithGemini({ model, rubric = "", maxScore = 20, answer = "", prompt = "" }) {
  // OJO: Asegúrate que esta variable coincida con tu .env
  const apiKey = process.env.API_EXAMS || process.env.API_EXAMS;
  
  if (!apiKey) throw new Error("Falta GEMINI_API_KEY2 en el servidor");

  const resolvedModel = normalizeModel(model);
  const genAI = new GoogleGenerativeAI(apiKey);
  
  const m = genAI.getGenerativeModel({
    model: resolvedModel,
    generationConfig: { responseMimeType: "application/json" },
  });

  const instruction = `Sos un profesor evaluador. Analizá la respuesta del estudiante según la rúbrica.
Devolvé sólo JSON: { "score": número entre 0 y ${Number(maxScore)}, "feedback": "texto breve y claro" }`;

  const userPayload = `Rúbrica: ${rubric || "(no provista)"}\n\nPrompt: ${prompt}\n\nRespuesta del estudiante: ${answer}`;

  const result = await m.generateContent(`${instruction}\n\n${userPayload}`);
  const raw = typeof result?.response?.text === "function" ? result.response.text() : "";

  if (!raw) throw new Error("Sin respuesta del modelo");

  const cleaned = raw.replace(/```json|```/g, "").trim();
  let numericScore = 0;
  let cleanFeedback = "";

  try {
    const parsed = JSON.parse(cleaned || "{}");
    numericScore = Number(parsed.score ?? 0);
    cleanFeedback = String(parsed.feedback ?? "").trim();
  } catch {
    const mScore = raw.match(/score\s*[:=]\s*(\d+(\.\d+)?)/i);
    if (mScore) numericScore = Number(mScore[1]);
    cleanFeedback = (raw || "").slice(0, 400).trim();
  }

  const max = Math.max(1, Number(maxScore) || 20);
  if (!Number.isFinite(numericScore)) numericScore = 0;
  numericScore = Math.max(0, Math.min(numericScore, max));

  return {
    score: numericScore,
    maxScore: max,
    feedback: cleanFeedback || "Sin feedback proporcionado",
    model: resolvedModel,
  };
}

// --- 3. FUNCIÓN PRINCIPAL DE TEST (El Handler transformado) ---

export async function testExamsEvaluate() {
  console.log("🔵 Iniciando Test de Evaluación de Exámenes (Gemini)...");

  try {
    const { textExercises, listeningExercises } = TEST_PAYLOAD;
    const feedbackByExerciseId = {};
    let aiScoreBonus = 0;

    // --- PROCESO TEXTO ---
    for (const [exerciseId, data] of Object.entries(textExercises || {})) {
      const graded = await gradeOneWithGemini({
        model: data.model,
        rubric: data.rubric,
        maxScore: data.maxPoints,
        answer: data.answer,
        prompt: data.prompt,
      });

      aiScoreBonus += Number(graded.score || 0);
      feedbackByExerciseId[exerciseId] = `${graded.feedback} (Puntos IA: ${graded.score}/${graded.maxScore})`;
    }

    // --- PROCESO LISTENING ---
    for (const [exerciseId, data] of Object.entries(listeningExercises || {})) {
      const rubricWithListeningContext = `
Evaluación de comprensión auditiva.
- El estudiante escuchó el audio ${data.plays} vez/veces.
- Tenía un máximo de 2 reproducciones.
- Considerá claridad, información clave entendida y gramática general.
${data.rubric || ""}`.trim();

      const graded = await gradeOneWithGemini({
        model: data.model,
        rubric: rubricWithListeningContext,
        maxScore: data.maxPoints,
        answer: data.answer,
        prompt: data.title || "Listening comprehension task",
      });

      aiScoreBonus += Number(graded.score || 0);
      feedbackByExerciseId[exerciseId] = `${graded.feedback} (Puntos IA: ${graded.score}/${graded.maxScore})`;
    }

    // Retorno exitoso
    return {
        success: true,
        message: "Evaluación completada con éxito.",
        detalles: {
            puntosTotalesIA: aiScoreBonus,
            feedbackGenerado: feedbackByExerciseId
        }
    };

  } catch (err) {
    console.error("🔥 Error en Test Exams Evaluate:", err);
    return {
      success: false,
      message: "Falló la evaluación: " + err.message
    };
  }
}