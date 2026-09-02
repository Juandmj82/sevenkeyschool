// Cloudflare Worker: asistente de chat para Seven Keys Music School.
// Recibe el historial de la conversación, le pregunta a Gemini y decide
// si conviene invitar al visitante a continuar por WhatsApp.

const ALLOWED_ORIGINS = new Set([
  "https://sevenkeyschool.com",
  "https://www.sevenkeyschool.com",
  "http://localhost:8080",
  "http://localhost:8927",
]);

const WHATSAPP_NUMBER = "573133697599";

const SYSTEM_INSTRUCTION = `Eres el asistente virtual de Seven Keys Music School, una escuela de música colombiana. Respondes preguntas de posibles estudiantes o acudientes con calidez y precisión, usando SOLO los datos que se listan abajo. Si no sabes algo (precio exacto, disponibilidad de horario específica, casos particulares), dilo con honestidad y sugiere continuar por WhatsApp.

DATOS REALES DE LA ESCUELA (no inventes nada fuera de esto):
- Fundada en 2020, en Colombia. Sin sede fija / sin oficina propia.
- Modalidad virtual: videollamada en vivo con profesor real, disponible para estudiantes de cualquier ciudad o país.
- Modalidad presencial: en Bogotá y la Sabana Norte, sujeto a disponibilidad de horario y zona.
- Instrumentos: piano, guitarra, arpa llanera, canto (técnica vocal), batería, violín, bajo, ukelele, cuatro, maracas, e iniciación musical para niños desde temprana edad.
- No se necesita saber solfeo ni tener instrumento propio para empezar: se entrena oído y lectura musical con ejercicios y juegos interactivos, y se orienta sobre qué instrumento conseguir.
- Para inscribirse o agendar: se hace por WhatsApp, donde el equipo ayuda a elegir instrumento, horario y plan.
- El sitio tiene una Zona de Juegos educativos gratuita (práctica de oído, ritmo, notas) accesible desde el menú.
- No manejamos precios exactos en este chat: cualquier pregunta de precio, cupo, horario específico o pago se responde invitando a WhatsApp.

INSTRUCCIONES DE COMPORTAMIENTO:
1. Responde en el mismo idioma del usuario (español por defecto).
2. Respuestas cortas: 2 a 4 frases, tono cercano y profesional, sin emojis excesivos (máximo 1 si aplica).
3. Nunca inventes precios, horarios exactos, nombres de profesores o promociones que no estén arriba.
4. Marca "handoff": true cuando el usuario muestre intención real de inscribirse, pida precio, pida agendar, pregunte por disponibilidad específica, o pida hablar con una persona. En ese caso, en tu respuesta invita amablemente a continuar por WhatsApp (sin inventar que ya lo hiciste tú).
5. Marca "handoff": false para preguntas generales o exploratorias (qué instrumentos, cómo funciona, si necesitan experiencia previa, etc.) — sigue respondiendo tú mientras el usuario solo esté explorando.
6. Si preguntan algo totalmente ajeno a la escuela de música, responde brevemente que solo puedes ayudar con temas de Seven Keys Music School.`;

const RESPONSE_SCHEMA = {
  type: "OBJECT",
  properties: {
    reply: { type: "STRING", description: "Respuesta en texto plano para mostrar al usuario." },
    handoff: { type: "BOOLEAN", description: "true si conviene invitar a continuar por WhatsApp ahora." },
  },
  required: ["reply", "handoff"],
};

function corsHeaders(origin) {
  const allowOrigin = ALLOWED_ORIGINS.has(origin) ? origin : "";
  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Vary": "Origin",
  };
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";
    const headers = corsHeaders(origin);

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers });
    }

    if (request.method !== "POST") {
      return new Response("Method not allowed", { status: 405, headers });
    }

    if (!ALLOWED_ORIGINS.has(origin)) {
      return new Response(JSON.stringify({ error: "origin not allowed" }), {
        status: 403,
        headers: { ...headers, "Content-Type": "application/json" },
      });
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return new Response(JSON.stringify({ error: "invalid json" }), {
        status: 400,
        headers: { ...headers, "Content-Type": "application/json" },
      });
    }

    const messages = Array.isArray(body.messages) ? body.messages : [];
    if (messages.length === 0) {
      return new Response(JSON.stringify({ error: "messages required" }), {
        status: 400,
        headers: { ...headers, "Content-Type": "application/json" },
      });
    }

    // Cap history and message length to keep cost/abuse bounded.
    const trimmed = messages.slice(-12).map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: String(m.content || "").slice(0, 1000) }],
    }));

    const geminiUrl =
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

    const geminiRes = await fetch(geminiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": env.GEMINI_API_KEY,
      },
      body: JSON.stringify({
        contents: trimmed,
        systemInstruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: RESPONSE_SCHEMA,
          temperature: 0.4,
          maxOutputTokens: 300,
        },
      }),
    });

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      console.error("Gemini error", geminiRes.status, errText);
      return new Response(
        JSON.stringify({
          reply: "Tuvimos un problema técnico. ¿Prefieres escribirnos directo por WhatsApp?",
          handoff: true,
        }),
        { status: 200, headers: { ...headers, "Content-Type": "application/json" } }
      );
    }

    const data = await geminiRes.json();
    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || "{}";

    let parsed;
    try {
      parsed = JSON.parse(rawText);
    } catch {
      parsed = { reply: rawText, handoff: false };
    }

    return new Response(
      JSON.stringify({
        reply: parsed.reply || "¿Puedes reformular tu pregunta?",
        handoff: Boolean(parsed.handoff),
        whatsapp: `https://wa.me/${WHATSAPP_NUMBER}`,
      }),
      { status: 200, headers: { ...headers, "Content-Type": "application/json" } }
    );
  },
};
