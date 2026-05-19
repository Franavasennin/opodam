// src/components/layout/RutaProtegida.tsx
// AUTH DESACTIVADO — esta version deja pasar siempre.
// La logica de sesion/perfil original se reactivara mas adelante.
export function RutaProtegida({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
