'use client'

import { ReactNode } from 'react'
import Link from 'next/link'
import { Activity } from 'lucide-react'
import ThemeToggle from './ThemeToggle'

/** Centered auth card with brand header; shared by login and signup. */
export default function AuthLayout({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
    return (
        <div className="flex min-h-dvh flex-col bg-background">
            <header className="flex h-14 items-center justify-between px-4 md:px-6">
                <Link href="/" className="flex items-center gap-2 font-semibold">
                    <Activity className="size-5" />
                    PhysioFlow
                </Link>
                <ThemeToggle />
            </header>
            <main className="flex flex-1 items-center justify-center p-4">
                <div className="w-full max-w-sm">
                    <div className="mb-6 space-y-1">
                        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
                        <p className="text-sm text-muted-foreground">{subtitle}</p>
                    </div>
                    {children}
                </div>
            </main>
        </div>
    )
}
