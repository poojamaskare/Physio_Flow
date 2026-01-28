'use client'

import { motion } from 'framer-motion'
import { useTheme } from './ThemeProvider'
import { Moon, Sun } from 'lucide-react'

export default function ThemeToggle({ className = '' }: { className?: string }) {
    const { theme, toggleTheme } = useTheme()
    const isDark = theme === 'dark'

    return (
        <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={toggleTheme}
            className={`p-2.5 rounded-xl border shadow-sm hover:shadow-md transition-all ${isDark
                    ? 'bg-slate-800 border-white/10 text-cyan-400'
                    : 'bg-white border-slate-200 text-slate-500 hover:text-cyan-600'
                } ${className}`}
            aria-label="Toggle theme"
        >
            <motion.div
                initial={false}
                animate={{ rotate: isDark ? 0 : 180 }}
                transition={{ duration: 0.3 }}
            >
                {isDark ? (
                    <Moon className="w-5 h-5" />
                ) : (
                    <Sun className="w-5 h-5" />
                )}
            </motion.div>
        </motion.button>
    )
}
