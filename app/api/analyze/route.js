import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import clientPromise from "@/lib/mongodb";
import { NextResponse } from "next/server";

export async function POST(request) {
  console.log("📥 POST /api/analyze iniciado");

  const session = await getServerSession(authOptions);
  if (!session) {
    console.warn("⚠️ Usuario no autenticado");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  console.log("✅ Sesión obtenida para:", session.user.email);

  const formData = await request.formData();
  const file = formData.get("file");
  if (!file) {
    console.error("❌ No se recibió archivo");
    return NextResponse.json({ error: "No file received" }, { status: 400 });
  }
  console.log("📷 Archivo recibido:", file.name || "[sin nombre]", "Tipo:", file.type);

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const base64 = buffer.toString("base64");
  console.log("📦 Imagen convertida a base64 (primeros 30 caracteres):", base64.slice(0, 30));

  let foodLabel = "";

  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
  const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

  if (!GEMINI_API_KEY) {
    console.error("❌ ERROR: GEMINI_API_KEY no está configurada.");
    return NextResponse.json({ error: "GEMINI_API_KEY no configurada. Por favor, revisa tus variables de entorno." }, { status: 500 });
  }

  try {
    console.log("🚀 Enviando imagen a Gemini API...");

    const prompt = "Describe la comida principal en esta imagen con una etiqueta concisa (ej. 'Hamburguesa con papas', 'Ensalada de pollo').";

    const geminiPayload = {
      contents: [
        {
          role: "user",
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType: file.type,
                data: base64,
              },
            },
          ],
        },
      ],
    };

    const geminiRes = await fetch(GEMINI_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(geminiPayload),
    });

    if (!geminiRes.ok) {
      const errorText = await geminiRes.text();
      console.error(`❌ Error en la respuesta de Gemini API (Status: ${geminiRes.status}):`, errorText);
      return NextResponse.json({ error: `Gemini API error: ${errorText}` }, { status: geminiRes.status });
    }

    const geminiData = await geminiRes.json();
    console.log("🔎 Respuesta cruda de Gemini:", JSON.stringify(geminiData, null, 2));

    foodLabel = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || "";

    if (!foodLabel) {
      console.warn("⚠️ Gemini no detectó comida o no pudo generar una etiqueta.");
      return NextResponse.json({ error: "No se detectó comida en la imagen o el análisis fue inconcluso." }, { status: 400 });
    }

    console.log("🍱 Gemini detectó:", foodLabel);
  } catch (err) {
    console.error("❌ Error al usar Gemini API:", err);
    return NextResponse.json({ error: "No se pudo analizar la imagen con Gemini API. Verifica tu API Key y la configuración." }, { status: 500 });
  }

  console.log("🥬 Buscando información nutricional para:", foodLabel);

  let nutritionData;
  let foodData;

  try {
    const nutritionRes = await fetch(`https://trackapi.nutritionix.com/v2/natural/nutrients`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-app-id": process.env.NUTRITIONIX_APP_ID,
        "x-app-key": process.env.NUTRITIONIX_APP_KEY,
      },
      body: JSON.stringify({ query: foodLabel }),
    });

    if (nutritionRes.ok) {
      nutritionData = await nutritionRes.json();
      foodData = nutritionData.foods?.[0];
    } else {
      const errorText = await nutritionRes.text();
      console.warn(`⚠️ Primer intento Nutritionix (Status: ${nutritionRes.status}): ${errorText}`);
    }
  } catch (err) {
    console.warn("⚠️ Error en el primer intento de Nutritionix:", err);
  }

  if (!foodData) {
    console.log(`♻️ Primer intento de Nutritionix falló para "${foodLabel}". Intentando simplificar la búsqueda...`);
    const simplifiedFoodLabel = foodLabel.split(" con ")[0].trim();
    if (simplifiedFoodLabel && simplifiedFoodLabel !== foodLabel) {
      console.log("🥬 Buscando información nutricional simplificada para:", simplifiedFoodLabel);
      try {
        const nutritionResSimplified = await fetch(`https://trackapi.nutritionix.com/v2/natural/nutrients`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-app-id": process.env.NUTRITIONIX_APP_ID,
            "x-app-key": process.env.NUTRITIONIX_APP_KEY,
          },
          body: JSON.stringify({ query: simplifiedFoodLabel }),
        });

        if (nutritionResSimplified.ok) {
          nutritionData = await nutritionResSimplified.json();
          foodData = nutritionData.foods?.[0];
        } else {
          const errorText = await nutritionResSimplified.text();
          console.warn(`⚠️ Segundo intento Nutritionix (Status: ${nutritionResSimplified.status}): ${errorText}`);
        }
      } catch (err) {
        console.warn("⚠️ Error en el segundo intento de Nutritionix:", err);
      }
    }
  }

  if (!foodData) {
    console.warn("⚠️ No se encontró información nutricional para:", foodLabel);
    return NextResponse.json({ error: "No nutrition data found", label: foodLabel }, { status: 404 });
  }

  console.log("📊 Respuesta de Nutritionix:", JSON.stringify(nutritionData, null, 2));

  // Preparar y Guardar Datos de la Comida
  const meal = {
    food: foodData.food_name,
    calories: Math.round(foodData.nf_calories),
    protein: Math.round(foodData.nf_protein),
    carbs: Math.round(foodData.nf_total_carbohydrate),
    fat: Math.round(foodData.nf_total_fat),
    userEmail: session.user.email, // <-- CAMBIO AQUÍ: Ahora guarda como userEmail
    createdAt: new Date(),
  };

  console.log("📥 Guardando comida detectada en MongoDB:", meal);

  try {
    const client = await clientPromise;
    const db = client.db();
    const result = await db.collection("meals").insertOne(meal); // Asegúrate de que el resultado se maneje
    console.log("✅ Comida registrada exitosamente con ID:", result.insertedId);
    // Devuelve el objeto meal completo, incluyendo el _id generado por MongoDB
    return NextResponse.json({ ...meal, _id: result.insertedId.toString() });
  } catch (dbError) {
    console.error("❌ Error al guardar en MongoDB:", dbError);
    return NextResponse.json({ error: "Error al guardar la comida en la base de datos." }, { status: 500 });
  }
}
