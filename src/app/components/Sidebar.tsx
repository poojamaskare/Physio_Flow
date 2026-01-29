
'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { User } from '@/lib/auth'
import {
    LayoutDashboard,
    Activity,
    Utensils,
    TrendingUp,
    LogOut,
    UserCircle,
    X,
    LucideIcon
} from 'lucide-react'

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
    items?: MenuItem[] // Optional: if provided, uses these instead of default
    activeTab?: string // Optional: for state-based highlighting
}

const defaultMenuItems: MenuItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, href: '/patient' },
    { id: 'exercise', label: 'Exercise', icon: Activity, href: '/exercise' },
    { id: 'diet', label: 'Diet Plan', icon: Utensils, href: '/patient?tab=diet' },
    { id: 'progress', label: 'Progress', icon: TrendingUp, href: '/patient?tab=progress' },
]

export default function Sidebar({ user, onLogout, isOpen, onClose, items = defaultMenuItems, activeTab }: SidebarProps) {
    const pathname = usePathname()

    return (
        <>
            {/* Mobile Overlay */}
            {isOpen && (
                <div 
                    className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm"
                    onClick={onClose}
                />
            )}

            {/* Sidebar */}
            <aside className={`
                fixed top-0 left-0 h-full w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-white/10 
                flex flex-col z-50 transition-transform duration-300 ease-in-out
                ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0
            `}>
                {/* Header */}
                <div className="p-6 border-b border-slate-200 dark:border-white/10 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Activity size={28} className="text-cyan-600 dark:text-cyan-400" />
                        <span className="text-xl font-bold bg-gradient-to-r from-cyan-600 to-teal-500 dark:from-cyan-400 dark:to-teal-400 bg-clip-text text-transparent">
                            PhysioFlow
                        </span>
                    </div>
                    {/* Mobile Close Button */}
                    <button onClick={onClose} className="md:hidden text-slate-500 hover:text-slate-900 dark:hover:text-white">
                        <X size={24} />
                    </button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 p-4 space-y-2 mt-4 overflow-y-auto">
                    {items.map((item) => {
                        // Determine active state: either by href match or activeTab prop
                        const isActive = activeTab 
                            ? activeTab === item.id 
                            : (item.href && pathname === item.href) || (item.href && pathname?.startsWith(item.href) && item.href !== '/patient')

                        const content = (
                            <>
                                <item.icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                                <span className={`font-medium ${isActive ? 'font-bold' : ''}`}>{item.label}</span>
                            </>
                        )

                        const className = `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 cursor-pointer ${isActive
                            ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/25'
                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white'
                            }`

                        if (item.href) {
                            return (
                                <Link 
                                    key={item.id} 
                                    href={item.href} 
                                    className={className}
                                    onClick={() => onClose()} // Close on mobile navigation
                                >
                                    {content}
                                </Link>
                            )
                        } else {
                            return (
                                <div 
                                    key={item.id} 
                                    onClick={() => {
                                        if (item.onClick) item.onClick()
                                        onClose()
                                    }}
                                    className={className}
                                >
                                    {content}
                                </div>
                            )
                        }
                    })}
                </nav>

                {/* Footer */}
                <div className="p-4 border-t border-slate-200 dark:border-white/10">
                    <div className="flex items-center gap-3 mb-4 p-2">
                        <div className="w-10 h-10 rounded-full bg-cyan-500/10 flex items-center justify-center text-cyan-500">
                            <UserCircle size={28} />
                        </div>
                        <div className="overflow-hidden">
                            <p className="font-medium text-sm text-slate-900 dark:text-white leading-tight truncate">{user?.name || 'Guest User'}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 capitalize">{user?.role || 'User'}</p>
                        </div>
                    </div>

                    <button
                        onClick={onLogout}
                        className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-slate-500 dark:text-slate-400 hover:bg-red-50 dark:hover:bg-red-900/10 hover:text-red-500 transition-all font-medium"
                    >
                        <LogOut size={20} />
                        Logout
                    </button>
                </div>
            </aside>
        </>
    )
}
