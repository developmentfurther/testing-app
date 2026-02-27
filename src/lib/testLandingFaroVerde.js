'use server'
export async function testLandingFaroVerde() {
  const webhookUrl = process.env.N8N_WEBHOOK_URL_FARO_VERDE;

  if (!webhookUrl) {
    return {
      success: false,
      message: "N8N_WEBHOOK_URL_FARO_VERDE is not defined",
    };
  }

  // Faro Verde: tiene campo unidad, sin experienciaIdioma, sin source
  const payload = {
    action: "register_user",
    nombreCompleto: "Test Usuario",
    emailCorporativo: "test@furthercorporate.com",
    unidad: "Agro",
    idioma: "English",
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
    message: "Faro Verde webhook OK",
    output: json,
  };
}