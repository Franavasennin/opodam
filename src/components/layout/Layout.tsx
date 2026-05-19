import { Outlet } from 'react-router-dom'
import { BottomNav } from './BottomNav'
import { SideNav } from './SideNav'
import { BotonMusica } from '../audio/BotonMusica'

export function Layout() {
  return (
    <div className="flex min-h-screen">
      <SideNav />
      <main className="flex-1 pb-20 md:pb-0 overflow-y-auto bg-slate-50">
        <Outlet />
      </main>
      <BottomNav />
      <BotonMusica />
    </div>
  )
}
