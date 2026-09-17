'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Bell, Dumbbell } from 'lucide-react'

interface Item { id: string; assigned_at: string; sets: number; reps_per_set: number; exercise?: { name: string } | null }

const SEEN_KEY = 'physioflow_notifs_seen'
const timeAgo = (iso: string) => {
    const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000)
    if (m < 1) return 'just now'
    if (m < 60) return `${m}m ago`
    const h = Math.floor(m / 60)
    if (h < 24) return `${h}h ago`
    return `${Math.floor(h / 24)}d ago`
}

/** Patient bell: new exercise assignments since the bell was last opened. No notifications table —
 *  "unread" = assigned_at newer than a timestamp kept in localStorage. */
export default function NotificationBell({ patientId }: { patientId: string }) {
    const [items, setItems] = useState<Item[]>([])
    const [seenAt, setSeenAt] = useState<number>(() => {
        try { return Number(localStorage.getItem(SEEN_KEY) || 0) } catch { return 0 }
    })

    const load = useCallback(async () => {
        const { data } = await supabase
            .from('patient_exercises')
            .select('id, assigned_at, sets, reps_per_set, exercise:exercises(name)')
            .eq('patient_id', patientId)
            .order('assigned_at', { ascending: false })
            .limit(10)
        setItems((data as unknown as Item[]) || [])
    }, [patientId])

    useEffect(() => {
        void load() // eslint-disable-line react-hooks/set-state-in-effect -- setItems runs after an await, not synchronously
        // Live updates when the doctor assigns something; needs Realtime enabled on patient_exercises.
        const channel = supabase
            .channel(`assignments-${patientId}`)
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'patient_exercises', filter: `patient_id=eq.${patientId}` }, load)
            .subscribe()
        const onFocus = () => load()
        window.addEventListener('focus', onFocus)
        return () => { supabase.removeChannel(channel); window.removeEventListener('focus', onFocus) }
    }, [patientId, load])

    const unread = items.filter(i => new Date(i.assigned_at).getTime() > seenAt).length

    const onOpenChange = (open: boolean) => {
        if (!open) return
        const now = Date.now()
        setSeenAt(now)
        try { localStorage.setItem(SEEN_KEY, String(now)) } catch { }
    }

    return (
        <Popover onOpenChange={onOpenChange}>
            <PopoverTrigger render={<Button variant="ghost" size="icon-lg" aria-label={`Notifications${unread ? `, ${unread} unread` : ''}`} className="relative" />}>
                <Bell className="size-5" />
                {unread > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold leading-none text-white ring-2 ring-background">
                        {unread > 9 ? '9+' : unread}
                    </span>
                )}
            </PopoverTrigger>
            <PopoverContent align="end" className="w-80 p-0">
                <div className="border-b px-3 py-2 text-sm font-medium">Notifications</div>
                {items.length === 0 ? (
                    <p className="px-3 py-6 text-center text-sm text-muted-foreground">No notifications yet.</p>
                ) : (
                    <ul className="max-h-80 divide-y overflow-y-auto">
                        {items.map(i => {
                            const isNew = new Date(i.assigned_at).getTime() > seenAt
                            return (
                                <li key={i.id}>
                                    <Link href="/exercise" className="flex items-start gap-3 px-3 py-2.5 hover:bg-muted/60">
                                        <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md bg-muted"><Dumbbell className="size-3.5" /></div>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm">
                                                New exercise: <span className="font-medium">{i.exercise?.name || 'Exercise'}</span>
                                            </p>
                                            <p className="text-xs text-muted-foreground">{i.sets} sets · {i.reps_per_set} reps · {timeAgo(i.assigned_at)}</p>
                                        </div>
                                        {isNew && <span className="mt-2 size-2 shrink-0 rounded-full bg-destructive" />}
                                    </Link>
                                </li>
                            )
                        })}
                    </ul>
                )}
            </PopoverContent>
        </Popover>
    )
}
