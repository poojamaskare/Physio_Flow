
'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import { User } from '@/lib/auth'
import {
    LayoutDashboard,
    Activity,
    Utensils,
    TrendingUp,
    LogOut,
    UserCircle
} from 'lucide-react'

interface SidebarProps {
    user: User | null
    onLogout: () => void
}

const menuItems = [
    { name: 'Dashboard', icon: LayoutDashboard, href: '/patient' },
    { name: 'Exercise', icon: Activity, href: '/exercise' },
    { name: 'Diet Plan', icon: Utensils, href: '/patient?tab=diet' },
    { name: 'Progress', icon: TrendingUp, href: '/patient?tab=progress' },
]

export default function Sidebar({ user, onLogout }: SidebarProps) {
    const pathname = usePathname()

    return (
        <aside className="w-64 fixed h-full bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-white/10 flex flex-col z-40 transition-colors duration-300">
            {/* Header - PhysioFlow Branding */}
            <div className="p-6 border-b border-slate-200 dark:border-white/10">
                <div className="flex items-center gap-3">
                    <Activity size={28} className="text-cyan-600 dark:text-cyan-400" />
                    <span className="text-xl font-bold bg-gradient-to-r from-cyan-600 to-teal-500 dark:from-cyan-400 dark:to-teal-400 bg-clip-text text-transparent">
                        PhysioFlow
                    </span>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4 space-y-2 mt-4">
                {menuItems.map((item) => {
                    const isActive = pathname === item.href
                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${isActive
                                ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/25'
                                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white'
                                }`}
                        >
                            <item.icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                            <span className={`font-medium ${isActive ? 'font-bold' : ''}`}>{item.name}</span>
                        </Link>
                    )
                })}
            </nav>

            {/* Footer - User Profile & Logout */}
            <div className="p-4 border-t border-slate-200 dark:border-white/10">
                <div className="flex items-center gap-3 mb-4 p-2">
                    <div className="w-10 h-10 rounded-full bg-cyan-500/10 flex items-center justify-center text-cyan-500">
                        <UserCircle size={28} />
                    </div>
                    <div>
                        <p className="font-medium text-sm text-slate-900 dark:text-white leading-tight">{user?.name || 'Guest User'}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Patient</p>
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
    )
}
