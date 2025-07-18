import GoogleProvider from "next-auth/providers/google"
import CredentialsProvider from "next-auth/providers/credentials"
import { MongoDBAdapter } from "@next-auth/mongodb-adapter"
import clientPromise from "./mongodb"
import { connectToDatabase } from "@/lib/mongodb"
import bcrypt from "bcryptjs"

export const authOptions = {
  adapter: MongoDBAdapter(clientPromise),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      
      async authorize(credentials) {
  const { db } = await connectToDatabase()
  console.log("Intentando iniciar sesión con:", credentials)

  const user = await db.collection("users").findOne({ email: credentials.email })
  if (!user) {
    console.log("Usuario no encontrado")
    return null
  }

  console.log("Usuario encontrado:", user)

  const isValid = await bcrypt.compare(credentials.password, user.password)

  if (!isValid) {
    console.log("Contraseña incorrecta")
    return null
  }

  console.log("Login exitoso")

  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
  }
}

    }),
  ],
  pages: {
    signIn: "/auth/signin",
  },
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async session({ session, token }) {
      if (token && session.user) session.user.id = token.sub
      return session
    },
  },
}
