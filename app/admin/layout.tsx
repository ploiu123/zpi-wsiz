import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()

  // 1. Sprawdzamy czy uzytkownik jest zalogowany
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  // 2. Pobieramy role profilu 
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  // 3. Wyrzucamy, jesli nie ma uprawnien admina
  if (!profile || profile.role !== 'admin') {
    redirect('/dashboard') // Uzytkownik zwykly wraca na swoj pulpit
  }

  return (
    <div className="pt-24 pb-16 min-h-[90vh]">
      <div className="bg-red-500/10 text-red-400 text-center text-xs py-1 font-bold uppercase tracking-widest sticky top-16 z-40 backdrop-blur-md">
        Tryb Administratora
      </div>
      {children}
    </div>
  )
}
