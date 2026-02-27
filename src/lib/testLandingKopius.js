'use server'
export async function testLandingKopius() {
  const webhookUrl = process.env.N8N_WEBHOOK_URL_KOPIUS;

  if (!webhookUrl) {
    return {
      success: false,
      message: "N8N_WEBHOOK_URL_KOPIUS is not defined",
    };
  }

  const payload = {
    action: "register_user",
    nombreCompleto: "Test Usuario",
    emailCorporativo: "test@furthercorporate.com",
    idioma: "English",
    experienciaIdioma: null,
    disponibilidadHoraria: "Monday to Friday, 09:00-18:00",
    objetivo: "Improve business communication",
    source: "kopius",
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
    message: "Kopius webhook OK",
    output: json,
  };
}