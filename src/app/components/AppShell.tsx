'use client'

import { ReactNode, useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import { Menu } from 'lucide-react'
import { User } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import Sidebar, { MenuItem } from './Sidebar'
import ThemeToggle from './ThemeToggle'

interface AppShellProps {
    user: User | null
    onLogout: () => void
    title: string
    items?: MenuItem[]
    activeTab?: string
    actions?: ReactNode
    children: ReactNode
}

/** Shared dashboard frame: sidebar + sticky header + content column. */
export default function AppShell({ user, onLogout, title, items, activeTab, actions, children }: AppShellProps) {
    const [open, setOpen] = useState(false)
    const [collapsed, setCollapsed] = useState(false)

    useEffect(() => {
        try { setCollapsed(localStorage.getItem('physioflow_sidebar') === 'collapsed') } catch { } // eslint-disable-line react-hooks/set-state-in-effect -- hydrate persisted preference
    }, [])
    const toggleCollapse = () => {
        setCollapsed(c => {
            try { localStorage.setItem('physioflow_sidebar', c ? 'expanded' : 'collapsed') } catch { }
            return !c
        })
    }

    return (
        <div className="min-h-dvh bg-background">
            <Sidebar user={user} onLogout={onLogout} isOpen={open} onClose={() => setOpen(false)} items={items} activeTab={activeTab} collapsed={collapsed} onToggleCollapse={toggleCollapse} />
            <div className={cn('transition-[padding] duration-300 ease-in-out', collapsed ? 'md:pl-16' : 'md:pl-60')}>
                <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b bg-background/80 px-4 backdrop-blur md:px-6">
                    <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setOpen(true)} aria-label="Open menu">
                        <Menu className="size-4" />
                    </Button>
                    <h1 className="truncate text-base font-semibold">{title}</h1>
                    <div className="ml-auto flex items-center gap-2">
                        {actions}
                        <ThemeToggle />
                    </div>
                </header>
                <main className="mx-auto w-full max-w-6xl p-4 md:p-6">{children}</main>
            </div>
        </div>
    )
}
