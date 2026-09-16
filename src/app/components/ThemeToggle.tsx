'use client'

import { Moon, Sun } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useTheme } from './ThemeProvider'

export default function ThemeToggle({ className = '' }: { className?: string }) {
    const { theme, toggleTheme } = useTheme()
    return (
        <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Toggle theme" className={className}>
            {theme === 'dark' ? <Moon className="size-4" /> : <Sun className="size-4" />}
        </Button>
    )
}
