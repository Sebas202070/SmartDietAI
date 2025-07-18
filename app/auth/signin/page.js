"use client"

import { useEffect, useState } from "react"
import { signIn, useSession } from "next-auth/react"
import { useRouter } from "next/navigation"

export default function SignIn() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState(null)

  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/dashboard")
    }
  }, [status, router])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)

    const res = await signIn("credentials", {
      redirect: false,
      email,
      password,
    })

    if (res.error) {
      setError("Credenciales incorrectas")
    } else {
      router.replace("/dashboard")
    }
  }

  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-6 bg-green-50">
      <h1 className="text-3xl font-bold mb-6 text-green-900">Iniciar sesión en SmartDietAI</h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full max-w-sm bg-white p-6 rounded shadow">
        <input
          type="email"
          placeholder="Correo electrónico"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="border p-2 rounded"
        />
        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="border p-2 rounded"
        />
        {error && <p className="text-red-600">{error}</p>}
        <button
          type="submit"
          className="bg-green-600 text-white py-2 rounded hover:bg-green-700 transition"
        >
          Iniciar sesión
        </button>
        <p className="text-sm text-center mt-4 text-gray-700">
          ¿No estás registrado aún?{" "}
          <a href="/auth/register" className="text-green-700 font-semibold hover:underline">
            Registrate
          </a>
        </p>
      </form>
    </main>
  )
}
