import clientPromise from "@/lib/mongodb"
import { hash } from "bcryptjs"
import { NextResponse } from "next/server"

export async function POST(req) {
  const { email, password, name } = await req.json()
  if (!email || !password || !name) {
    return NextResponse.json({ error: "Faltan datos" }, { status: 400 })
  }

  const client = await clientPromise
  const db = client.db()

  const existingUser = await db.collection("users").findOne({ email })
  if (existingUser) {
    return NextResponse.json({ error: "El correo ya está registrado" }, { status: 400 })
  }

  const hashedPassword = await hash(password, 10)
  await db.collection("users").insertOne({ email, hashedPassword, name })

  return NextResponse.json({ message: "Usuario creado correctamente" })
}
