// Cloudflare Worker: asistente de chat para Seven Keys Music School.
// Recibe el historial de la conversación, le pregunta a Groq (Llama) y
// decide si conviene invitar al visitante a continuar por WhatsApp.

const ALLOWED_ORIGINS = new Set([
  "https://sevenkeyschool.com",
  "https://www.sevenkeyschool.com",
  "http://localhost:8080",
  "http://localhost:8927",
]);

const WHATSAPP_NUMBER = "573133697599";

const SYSTEM_PROMPT = `Eres el asistente virtual de Seven Keys Music School, una escuela de música colombiana. Respondes preguntas de posibles estudiantes o acudientes con calidez y precisión, usando SOLO los datos que se listan abajo. Si no sabes algo (precio exacto, disponibilidad de horario específica, casos particulares), dilo con honestidad y sugiere continuar por WhatsApp.

DATOS REALES DE LA ESCUELA (no inventes nada fuera de esto):
- Fundada en 2020, en Colombia. Sin sede fija / sin oficina propia.
- Fundadores: Juan Diego Merchán (músico del Taller Musical Francisco Cristancho de Bogotá, docente con más de 10 años de experiencia, ganador en 2017 del premio al Maestro en el Gimnasio Fontana por su investigación sobre gramática musical en preescolar) y su esposa Ángela Paola Delgado. Fundaron la escuela en 2020, en plena pandemia, para llevar la música a hogares de Colombia y el mundo usando la tecnología.
- Modalidad virtual: videollamada en vivo con profesor real, disponible para estudiantes de cualquier ciudad o país.
- Modalidad presencial: en Bogotá y la Sabana Norte, sujeto a disponibilidad de horario y zona.
- Instrumentos: piano, guitarra, arpa llanera, canto (técnica vocal), batería, violín, bajo, ukelele, cuatro, maracas, e iniciación musical para niños desde temprana edad.
- Programa "Iniciación Musical": para los más pequeños, con juegos, canciones y actividades lúdicas — desarrollo auditivo, ritmo y movimiento, expresión corporal, canto y voz.
- Programa "Desarrollo Musical": clases personalizadas virtuales y presenciales* en los instrumentos ya listados, adaptadas al nivel y objetivos de cada estudiante (*presencial sujeto a ubicación geográfica).
- Metodología en 3 pasos: 1) el interesado escribe por WhatsApp contando qué quiere aprender; 2) el equipo diseña un plan de estudios personalizado; 3) las clases son virtuales o presenciales con horarios flexibles según disponibilidad.
- No se necesita saber solfeo ni tener instrumento propio para empezar: se entrena oído y lectura musical con ejercicios y juegos interactivos, y se orienta sobre qué instrumento conseguir.
- Para inscribirse o agendar: se hace por WhatsApp, donde el equipo ayuda a elegir instrumento, horario y plan.
- El sitio tiene una Zona de Juegos educativos gratuita (práctica de oído, ritmo, notas) accesible desde el menú.
- No manejamos precios exactos en este chat: cualquier pregunta de precio, cupo, horario específico o pago se responde invitando a WhatsApp.

INSTRUCCIONES DE COMPORTAMIENTO:
1. Responde en el mismo idioma del usuario (español por defecto).
2. Respuestas cortas: 2 a 4 frases, tono cercano y profesional, sin emojis excesivos (máximo 1 si aplica).
3. Nunca inventes precios, horarios exactos, ni datos que no estén arriba.
4. Sé literal y específico, no resumas ni parafrasees vagamente los datos de arriba. Si preguntan qué instrumentos enseñan, NOMBRA la lista completa tal cual está arriba — nunca respondas cosas genéricas como "una amplia variedad de instrumentos" sin decir cuáles. Si preguntan por el fundador, da su nombre y los datos reales de arriba, no digas que no tienes esa información.
5. Marca "handoff": true cuando el usuario pida hablar con una persona explícitamente, o cuando NO tengas la información exacta que piden y no aplica el flujo de precio/inscripción del punto 8. Regla estricta: si tu "reply" menciona WhatsApp o invita a contactar/escribir/agendar Y "handoff" es true, perfecto; nunca menciones WhatsApp con "handoff" en false salvo que sea dentro del flujo de precio (punto 8), donde aún no se ha terminado de calificar al interesado.
6. Marca "handoff": false para preguntas generales o exploratorias que sí puedes responder por completo con los datos de arriba (qué instrumentos, cómo funciona, quién fundó la escuela, si necesitan experiencia previa, etc.).
7. Si preguntan algo totalmente ajeno a la escuela de música, responde brevemente que solo puedes ayudar con temas de Seven Keys Music School.

8. FLUJO DE PRECIO / INSCRIPCIÓN (importante, síguelo paso a paso usando el historial de la conversación para no repetir preguntas ya respondidas):
   - Cuando el usuario pregunte por precio, costo, cupo, cómo inscribirse o muestre intención real de tomar clases, NO lo mandes a WhatsApp de inmediato. Primero explícale con calidez que el precio varía según la modalidad (virtual o presencial) y la duración de la clase, y empieza a calificarlo con preguntas cortas, una o dos por mensaje, en este orden:
     a) ¿Le interesa modalidad virtual o presencial?
     b) Si es presencial: ¿en qué barrio o zona vive? (recuerda que solo hay disponibilidad en Bogotá y la Sabana Norte, sujeto a confirmación).
        Si es virtual: ¿prefiere clases de 40 minutos o de 1 hora?
     c) ¿Cuál es su nombre? (para dirigirte a él/ella y pasarlo ya identificado).
   - Mientras falte alguno de esos datos, sigue "handoff" en false y sigue preguntando de forma cálida y natural (no como un formulario robótico).
   - Si el usuario ya mencionó el instrumento que le interesa en la conversación, tenlo en cuenta para el resumen final.
   - En cuanto tengas al menos la modalidad y (zona si es presencial, o duración si es virtual) — el nombre es deseable pero no obligatorio si el usuario no quiere darlo — cierra con un mensaje cálido confirmando que lo vas a conectar con el equipo por WhatsApp, pon "handoff": true, y llena "leadSummary" con un mensaje breve en primera persona listo para enviar por WhatsApp, por ejemplo: "Hola, soy Camila. Me interesan clases de guitarra en modalidad virtual de 1 hora." o "Hola, soy Andrés. Quiero clases presenciales de piano, vivo en Chía (Sabana Norte)." Usa solo los datos que el usuario realmente dio.
   - Si en cualquier momento el usuario dice explícitamente que solo quiere el número/hablar ya por WhatsApp sin más preguntas, respeta eso de inmediato: pon "handoff": true y arma "leadSummary" con lo que ya sepas (aunque esté incompleto), o "leadSummary": null si no sabes nada todavía.
   - Fuera de este flujo de precio/inscripción, deja "leadSummary" como null.

Responde SIEMPRE y ÚNICAMENTE con un objeto JSON válido, sin texto fuera del JSON, con exactamente esta forma:
{"reply": "tu respuesta en texto plano", "handoff": true o false, "leadSummary": "mensaje breve para WhatsApp o null"}`;

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
      role: m.role === "assistant" ? "assistant" : "user",
      content: String(m.content || "").slice(0, 1000),
    }));

    const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: "openai/gpt-oss-20b",
        messages: [{ role: "system", content: SYSTEM_PROMPT }, ...trimmed],
        response_format: { type: "json_object" },
        temperature: 0.4,
        max_tokens: 300,
      }),
    });

    if (!groqRes.ok) {
      const errText = await groqRes.text();
      console.error("Groq error", groqRes.status, errText);
      return new Response(
        JSON.stringify({
          reply: "Tuvimos un problema técnico. ¿Prefieres escribirnos directo por WhatsApp?",
          handoff: true,
        }),
        { status: 200, headers: { ...headers, "Content-Type": "application/json" } }
      );
    }

    const data = await groqRes.json();
    const rawText = data?.choices?.[0]?.message?.content || "{}";

    let parsed;
    try {
      parsed = JSON.parse(rawText);
    } catch {
      parsed = { reply: rawText, handoff: false };
    }

    const replyText = parsed.reply || "¿Puedes reformular tu pregunta?";
    const leadSummary = typeof parsed.leadSummary === "string" ? parsed.leadSummary.slice(0, 400) : "";
    const handoff = Boolean(parsed.handoff);

    const whatsappUrl = leadSummary
      ? `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(leadSummary)}`
      : `https://wa.me/${WHATSAPP_NUMBER}`;

    return new Response(
      JSON.stringify({
        reply: replyText,
        handoff,
        whatsapp: whatsappUrl,
      }),
      { status: 200, headers: { ...headers, "Content-Type": "application/json" } }
    );
  },
};
