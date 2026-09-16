'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { User } from '@/lib/auth'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { LayoutDashboard, Activity, Utensils, TrendingUp, LogOut, X, LucideIcon } from 'lucide-react'

export interface MenuItem {
    id: string
    label: string
    icon: LucideIcon
    href?: string
    onClick?: () => void
}

interface SidebarProps {
    user: User | null
    onLogout: () => void
    isOpen: boolean
    onClose: () => void
    items?: MenuItem[]
    activeTab?: string
}

const defaultMenuItems: MenuItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, href: '/patient' },
    { id: 'exercise', label: 'Exercise', icon: Activity, href: '/exercise' },
    { id: 'diet', label: 'Diet Plan', icon: Utensils, href: '/patient?tab=diet' },
    { id: 'progress', label: 'Progress', icon: TrendingUp, href: '/patient?tab=progress' },
]

export default function Sidebar({ user, onLogout, isOpen, onClose, items = defaultMenuItems, activeTab }: SidebarProps) {
    const pathname = usePathname()
    const initials = (user?.name || 'G').split(' ').map(s => s[0]).join('').slice(0, 2).toUpperCase()

    return (
        <>
            {isOpen && <div className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm md:hidden" onClick={onClose} />}

            <aside
                className={cn(
                    'fixed inset-y-0 left-0 z-50 flex w-60 flex-col border-r bg-sidebar text-sidebar-foreground transition-transform duration-200 md:translate-x-0',
                    isOpen ? 'translate-x-0' : '-translate-x-full'
                )}
            >
                <div className="flex h-14 items-center justify-between px-4">
                    <Link href="/" className="flex items-center gap-2 font-semibold">
                        <Activity className="size-5" />
                        PhysioFlow
                    </Link>
                    <Button variant="ghost" size="icon" className="md:hidden" onClick={onClose} aria-label="Close menu">
                        <X className="size-4" />
                    </Button>
                </div>
                <Separator />

                <nav className="flex-1 space-y-1 overflow-y-auto p-3">
                    {items.map(item => {
                        const isActive = activeTab
                            ? activeTab === item.id
                            : !!item.href && (pathname === item.href || (item.href !== '/patient' && pathname?.startsWith(item.href)))
                        const cls = cn(
                            'flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                            isActive
                                ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                                : 'text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground'
                        )
                        const inner = (
                            <>
                                <item.icon className="size-4" />
                                {item.label}
                            </>
                        )
                        return item.href ? (
                            <Link key={item.id} href={item.href} className={cls} onClick={onClose}>
                                {inner}
                            </Link>
                        ) : (
                            <button key={item.id} type="button" className={cls} onClick={() => { item.onClick?.(); onClose() }}>
                                {inner}
                            </button>
                        )
                    })}
                </nav>

                <Separator />
                <div className="space-y-2 p-3">
                    <div className="flex items-center gap-2.5 rounded-md px-2 py-1.5">
                        <Avatar className="size-8">
                            <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                            <p className="truncate text-sm font-medium leading-tight">{user?.name || 'Guest'}</p>
                            <p className="text-xs capitalize text-muted-foreground">{user?.role || 'user'}</p>
                        </div>
                    </div>
                    <Button variant="ghost" className="w-full justify-start text-muted-foreground hover:text-destructive" onClick={onLogout}>
                        <LogOut className="size-4" />
                        Logout
                    </Button>
                </div>
            </aside>
        </>
    )
}
