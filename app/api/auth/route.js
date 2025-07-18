import { connectToDatabase } from "@/lib/mongodb"
import bcrypt from "bcryptjs"

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end()

  const { email, password } = req.body

  const { db } = await connectToDatabase()

  const user = await db.collection("users").findOne({ email })

  if (!user) return res.status(401).json({ error: "Usuario no encontrado" })

  const isValid = await bcrypt.compare(password, user.hashedPassword)

  if (!isValid) return res.status(401).json({ error: "Contraseña incorrecta" })

  return res.status(200).json({
    id: user._id.toString(),
    name: user.name,
    email: user.email,
  })
}
