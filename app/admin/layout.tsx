import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AdminToolbar } from './admin-toolbar'
import { isAdminRole } from '@/lib/roles'
import { isAdminEmail } from '@/lib/admin-emails'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
}
