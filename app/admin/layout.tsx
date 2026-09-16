import { createClient } from '@/lib/supabase/server'
import { redirect, unstable_rethrow } from 'next/navigation'
import { AdminToolbar } from './admin-toolbar'
import { isAdminRole } from '@/lib/roles'
import { isAdminEmail } from '@/lib/admin-emails'

type Profile = { role: string | null; email: string | null }

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  let userId: string | null = null
  let userEmail: string | null = null
  let profile: Profile | null = null
  let problem: string | null = null

  try {
    const supabase = await createClient()

    const { data: userData, error: userErr } = await supabase.auth.getUser()
    if (userErr) {
      problem = `Nie udało się odczytać sesji: ${userErr.message}`
    } else {
      userId = userData.user?.id ?? null
      userEmail = userData.user?.email ?? null
    }

    if (userId) {
      const { error: rpcErr } = await supabase.rpc('sync_profile')
      if (rpcErr) {
        console.error('[admin layout] sync_profile:', rpcErr.message)
      }

      const { data, error: profileErr } = await supabase
        .from('profiles')
        .select('role, email')
        .eq('id', userId)
        .maybeSingle()

      if (profileErr) {
        console.error('[admin layout] profiles:', profileErr.message)
      } else {
        profile = data as Profile | null
      }
    }
  } catch (err) {
    unstable_rethrow(err)
    problem = err instanceof Error ? err.message : String(err)
    console.error('[admin layout] wyjątek:', err)
  }

  if (problem) {
    return (
      <div className="pt-32 px-4 max-w-3xl mx-auto">
        <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-8 text-red-300">
          <h2 className="text-xl font-bold mb-4">Nie udało się sprawdzić uprawnień</h2>
          <pre className="text-sm overflow-auto p-4 bg-black/50 rounded-lg whitespace-pre-wrap">
            {problem}
          </pre>
          <p className="text-sm text-red-200/70 mt-4">
            Spróbuj wylogować się i zalogować ponownie. Jeśli błąd wraca, przyślij tę treść.
          </p>
        </div>
      </div>
    )
  }

  if (!userId) {
    redirect('/login?redirect=/admin')
  }

  const allowed = isAdminRole(profile?.role) || isAdminEmail(userEmail)
  if (!allowed) {
    redirect('/dashboard?notice=admin_only')
  }

  return (
    <div className="pt-24 min-h-[90vh]">
      <div className="bg-red-500/10 text-red-400 text-center text-xs py-2 font-bold uppercase tracking-widest sticky top-16 z-40 backdrop-blur-md border-b border-red-500/20">
        Tryb administratora — zmiany są widoczne od razu dla klientów sklepu
      </div>
      <AdminToolbar email={profile?.email || userEmail || ''} />
      <div className="pb-16">{children}</div>
    </div>
  )
}
