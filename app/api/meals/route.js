
import { NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"
import { getToken } from "next-auth/jwt"



export async function GET(req) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })

  if (!token || !token.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const client = await clientPromise
    const db = client.db()

    const meals = await db
      .collection("meals")
      .find({ userEmail: token.email })
      .sort({ createdAt: -1 })
      .toArray()

    // Serializar correctamente los campos antes de enviarlos
    const serializedMeals = meals.map((meal) => ({
      ...meal,
      _id: meal._id.toString(),
      createdAt: meal.createdAt?.toISOString?.() ?? null,
    }))

    return NextResponse.json(serializedMeals)
  } catch (err) {
    console.error("Error al obtener meals:", err)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}


export async function POST(req) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })

  if (!token || !token.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await req.json()

    const client = await clientPromise
    const db = client.db() // o .db("SmartDietAI") si querés ser explícito

    const meal = {
      ...body,
      userEmail: token.email,
      createdAt: new Date(),
    }

    const result = await db.collection("meals").insertOne(meal)

    return NextResponse.json({ success: true, mealId: result.insertedId })
  } catch (err) {
    console.error("Error al guardar comida:", err)
    return NextResponse.json({ error: "Error al guardar comida" }, { status: 500 })
  }
}

