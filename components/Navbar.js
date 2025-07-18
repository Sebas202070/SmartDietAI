
"use client"

import { useSession, signOut } from "next-auth/react"
import Link from "next/link"
import { Sparkles, LogOut, LogIn, UserPlus } from 'lucide-react'; // Importa iconos de lucide-react

export default function Navbar() {
  const { data: session, status } = useSession()

  return (
    <nav className="w-full bg-gradient-to-r from-green-500 to-emerald-600 px-6 py-4 flex justify-between items-center shadow-lg relative z-10">
      <Link href="/" className="flex items-center text-2xl font-extrabold text-white tracking-tight hover:text-gray-100 transition-colors duration-300">
        <Sparkles className="h-7 w-7 mr-2 text-yellow-300" /> {/* Icono de Sparkles */}
        SmartDietAI
      </Link>

      {status === "loading" ? (
        // Muestra un spinner o un mensaje de carga mientras se verifica la sesión
        <div className="flex items-center">
          <svg className="animate-spin h-5 w-5 text-white mr-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span className="text-white text-sm">Cargando...</span>
        </div>
      ) : session ? (
        // Si el usuario está autenticado
        <div className="flex items-center space-x-4">
          <span className="text-white text-lg font-medium">Hola, {session.user.name || session.user.email.split('@')[0]}</span>
          <Link href="/dashboard" className="bg-white text-green-600 px-4 py-2 rounded-full font-semibold hover:bg-gray-100 transition-all duration-300 shadow-md">
            Dashboard
          </Link>
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="bg-red-500 text-white px-4 py-2 rounded-full font-semibold hover:bg-red-600 transition-all duration-300 shadow-md flex items-center"
          >
            <LogOut className="h-5 w-5 mr-1" />
            Cerrar sesión
          </button>
        </div>
      ) : (
        // Si el usuario no está autenticado
        <div className="flex space-x-3">
          <Link
            href="/auth/signin"
            className="bg-white text-green-600 px-4 py-2 rounded-full font-semibold hover:bg-gray-100 transition-all duration-300 shadow-md flex items-center"
          >
            <LogIn className="h-5 w-5 mr-1" />
            Iniciar sesión
          </Link>
          <Link
            href="/auth/register"
            className="border border-white text-white px-4 py-2 rounded-full font-semibold hover:bg-white hover:text-green-600 transition-all duration-300 shadow-md flex items-center"
          >
            <UserPlus className="h-5 w-5 mr-1" />
            Registrarse
          </Link>
        </div>
      )}
    </nav>
  )
}
