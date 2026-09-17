'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { User } from '@/lib/auth'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { LayoutDashboard, Activity, Utensils, TrendingUp, LogOut, X, LucideIcon, PanelLeftClose, PanelLeftOpen } from 'lucide-react'

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
    collapsed?: boolean
    onToggleCollapse?: () => void
}

const defaultMenuItems: MenuItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, href: '/patient' },
    { id: 'exercise', label: 'Exercise', icon: Activity, href: '/exercise' },
    { id: 'diet', label: 'Diet Plan', icon: Utensils, href: '/patient?tab=diet' },
    { id: 'progress', label: 'Progress', icon: TrendingUp, href: '/patient?tab=progress' },
]

export default function Sidebar({ user, onLogout, isOpen, onClose, items = defaultMenuItems, activeTab, collapsed = false, onToggleCollapse }: SidebarProps) {
    const pathname = usePathname()
    const initials = (user?.name || 'G').split(' ').map(s => s[0]).join('').slice(0, 2).toUpperCase()

    return (
        <>
            {isOpen && <div className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm md:hidden" onClick={onClose} />}

            <aside
                className={cn(
                    'fixed inset-y-0 left-0 z-50 flex flex-col border-r bg-sidebar text-sidebar-foreground transition-[transform,width] duration-300 ease-in-out md:translate-x-0',
                    isOpen ? 'translate-x-0' : '-translate-x-full',
                    collapsed ? 'w-60 md:w-16' : 'w-60'
                )}
            >
                <div className={cn('flex h-14 items-center justify-between px-3', collapsed && 'md:justify-center md:px-0')}>
                    <Link href="/" className={cn('flex items-center gap-2 overflow-hidden pl-1 font-semibold whitespace-nowrap', collapsed && 'md:hidden')}>
                        <Activity className="size-5 shrink-0" />
                        <span>PhysioFlow</span>
                    </Link>
                    <Button variant="ghost" size="icon" className="md:hidden" onClick={onClose} aria-label="Close menu">
                        <X className="size-4" />
                    </Button>
                    {onToggleCollapse && (
                        <Tooltip>
                            <TooltipTrigger render={<Button variant="ghost" size="icon" className="hidden text-muted-foreground md:inline-flex" onClick={onToggleCollapse} aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'} />}>
                                {collapsed ? <PanelLeftOpen className="size-4" /> : <PanelLeftClose className="size-4" />}
                            </TooltipTrigger>
                            <TooltipContent side="right">{collapsed ? 'Expand' : 'Collapse'}</TooltipContent>
                        </Tooltip>
                    )}
                </div>
                <Separator />

                <nav className="flex-1 space-y-1 overflow-y-auto p-3">
                    {items.map(item => {
                        const isActive = activeTab
                            ? activeTab === item.id
                            : !!item.href && (pathname === item.href || (item.href !== '/patient' && pathname?.startsWith(item.href)))
                        const cls = cn(
                            'flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors',
                            collapsed && 'md:justify-center md:px-0',
                            isActive
                                ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                                : 'text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground'
                        )
                        const inner = (
                            <>
                                <item.icon className="size-4 shrink-0" />
                                <span className={cn(collapsed && 'md:hidden')}>{item.label}</span>
                            </>
                        )
                        const el = item.href ? (
                            <Link href={item.href} className={cls} onClick={onClose}>{inner}</Link>
                        ) : (
                            <button type="button" className={cls} onClick={() => { item.onClick?.(); onClose() }}>{inner}</button>
                        )
                        return collapsed ? (
                            <Tooltip key={item.id}>
                                <TooltipTrigger render={<div />}>{el}</TooltipTrigger>
                                <TooltipContent side="right">{item.label}</TooltipContent>
                            </Tooltip>
                        ) : (
                            <div key={item.id}>{el}</div>
                        )
                    })}
                </nav>

                <Separator />
                <div className="space-y-2 p-3">
                    <div className={cn('flex items-center gap-2.5 rounded-md px-2 py-1.5', collapsed && 'md:justify-center md:px-0')}>
                        <Avatar className="size-8 shrink-0">
                            <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                        </Avatar>
                        <div className={cn('min-w-0', collapsed && 'md:hidden')}>
                            <p className="truncate text-sm font-medium leading-tight">{user?.name || 'Guest'}</p>
                            <p className="text-xs capitalize text-muted-foreground">{user?.role || 'user'}</p>
                        </div>
                    </div>
                    <Button variant="ghost" className={cn('w-full justify-start text-muted-foreground hover:text-destructive', collapsed && 'md:justify-center md:px-0')} onClick={onLogout} aria-label="Logout">
                        <LogOut className="size-4 shrink-0" />
                        <span className={cn(collapsed && 'md:hidden')}>Logout</span>
                    </Button>
                </div>
            </aside>
        </>
    )
}
