import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AdminToolbar } from './admin-toolbar'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login?redirect=/admin')
  }

  await supabase.rpc('sync_profile')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, email')
    .eq('id', user.id)
    .maybeSingle()

  if (!profile || profile.role !== 'admin') {
    redirect('/dashboard?notice=admin_only')
  }

  return (
    <div className="pt-24 min-h-[90vh]">
      <div className="bg-red-500/10 text-red-400 text-center text-xs py-2 font-bold uppercase tracking-widest sticky top-16 z-40 backdrop-blur-md border-b border-red-500/20">
        Tryb administratora — zmiany są widoczne od razu dla klientów sklepu
      </div>
      <AdminToolbar email={profile.email || user.email || ''} />
      <div className="pb-16">{children}</div>
    </div>
  )
}
