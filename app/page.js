"use client"
import { useSession } from "next-auth/react"
import Link from "next/link"; // Importa Link para los botones

export default function Home() {
  const { status } = useSession();

  return (
    <div className="relative min-h-[calc(100vh-80px)] bg-gradient-to-br from-green-100 via-blue-100 to-purple-100 flex flex-col items-center justify-center text-center px-4 py-8 sm:py-16 overflow-hidden">
      {/* Elementos de fondo decorativos (opcional, para un toque visual) */}
      <div className="absolute top-0 left-0 w-32 h-32 sm:w-48 sm:h-48 bg-green-300 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob"></div>
      <div className="absolute top-0 right-0 w-32 h-32 sm:w-48 sm:h-48 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-2000"></div>
      <div className="absolute bottom-0 left-1/4 w-32 h-32 sm:w-48 sm:h-48 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-4000"></div>

      <div className="relative z-10 max-w-4xl mx-auto">
        <h1 className="text-4xl sm:text-5xl md:text-7xl font-extrabold text-gray-900 mb-4 sm:mb-6 leading-tight animate-fade-in-up">
          SmartDietAI <span className="text-green-600">🍽️</span>
        </h1>
        <p className="text-base sm:text-lg md:text-2xl text-gray-700 max-w-2xl mx-auto mb-8 sm:mb-10 animate-fade-in-up animation-delay-500">
          Tu asistente de nutrición personal impulsado por IA. Escanea tu comida y obtén un análisis completo de calorías y macronutrientes al instante.
        </p>

        {status === "authenticated" ? (
          <Link
            href="/dashboard"
            className="inline-block bg-green-600 text-white text-lg sm:text-xl font-bold px-8 py-3 sm:px-10 sm:py-4 rounded-full shadow-lg hover:bg-green-700 transition-all duration-300 transform hover:scale-105 animate-fade-in-up animation-delay-1000"
          >
            Ir a tu Dashboard
          </Link>
        ) : (
          <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center animate-fade-in-up animation-delay-1000">
            <Link
              href="/auth/register"
              className="bg-green-600 text-white text-lg sm:text-xl font-bold px-6 py-3 sm:px-8 sm:py-4 rounded-full shadow-lg hover:bg-green-700 transition-all duration-300 transform hover:scale-105"
            >
              ¡Empieza Gratis!
            </Link>
            <Link
              href="/api/auth/signin?callbackUrl=/dashboard"
              className="border-2 border-green-600 text-green-700 text-lg sm:text-xl font-bold px-6 py-3 sm:px-8 sm:py-4 rounded-full shadow-lg hover:bg-green-50 transition-all duration-300 transform hover:scale-105"
            >
              Iniciar Sesión
            </Link>
          </div>
        )}
      </div>

      {/* Estilos para animaciones de fondo */}
      <style jsx>{`
        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }

        @keyframes fadeInFromBottom {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-blob {
          animation: blob 7s infinite cubic-bezier(0.68, -0.55, 0.27, 1.55);
        }

        .animate-fade-in-up {
          animation: fadeInFromBottom 0.8s ease-out forwards;
          opacity: 0; /* Inicia invisible */
        }

        .animation-delay-500 {
          animation-delay: 0.5s;
        }
        .animation-delay-1000 {
          animation-delay: 1s;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  )
}
