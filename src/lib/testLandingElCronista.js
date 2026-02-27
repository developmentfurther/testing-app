'use server'
export async function testLandingElCronista() {
  const webhookUrl = process.env.N8N_WEBHOOK_URL_EL_CRONISTA;

  if (!webhookUrl) {
    return {
      success: false,
      message: "N8N_WEBHOOK_URL_EL_CRONISTA is not defined",
    };
  }

  // El Cronista: máquina de estados, idioma hardcodeado "Inglés", sin source, sin experienciaIdioma
  const payload = {
    nombreCompleto: "Test Usuario",
    emailCorporativo: "test@furthercorporate.com",
    idioma: "Inglés",
    disponibilidadHoraria: "Monday to Friday, 09:00-18:00",
    objetivo: "Improve business communication",
    timestamp: new Date().toISOString(),
  };

  const res = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    return {
      success: false,
      message: `N8N responded with status ${res.status}`,
    };
  }

  const json = await res.json();

  if (json?.status !== "ok") {
    return {
      success: false,
      message: `Unexpected response: ${JSON.stringify(json)}`,
    };
  }

  return {
    success: true,
    message: "El Cronista webhook OK",
    output: json,
  };
}