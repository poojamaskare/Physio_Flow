'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { TrendingUp } from 'lucide-react'

interface DailyProgress {
    date: string
    count: number
    dayName: string
}

interface ProgressChartProps {
    userId: string
}

export default function ProgressChart({ userId }: ProgressChartProps) {
    const [weeklyData, setWeeklyData] = useState<DailyProgress[]>([])
    const [loading, setLoading] = useState(true)
    const [maxCount, setMaxCount] = useState(1)

    useEffect(() => {
        fetchWeeklyProgress()
    }, [userId])

    const fetchWeeklyProgress = async () => {
        try {
            // Get last 7 days
            const days: DailyProgress[] = []
            const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

            for (let i = 6; i >= 0; i--) {
                const date = new Date()
                date.setDate(date.getDate() - i)
                const dateStr = date.toISOString().split('T')[0]

                days.push({
                    date: dateStr,
                    count: 0,
                    dayName: dayNames[date.getDay()]
                })
            }

            // Fetch completed exercises for last 7 days
            const sevenDaysAgo = new Date()
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

            const { data, error } = await supabase
                .from('patient_exercise_assignments')
                .select('completed_at')
                .eq('patient_id', userId)
                .eq('status', 'completed')
                .gte('completed_at', sevenDaysAgo.toISOString())

            if (!error && data) {
                // Count completions per day
                data.forEach(item => {
                    if (item.completed_at) {
                        const completedDate = item.completed_at.split('T')[0]
                        const dayEntry = days.find(d => d.date === completedDate)
                        if (dayEntry) {
                            dayEntry.count++
                        }
                    }
                })
            }

            const max = Math.max(...days.map(d => d.count), 1)
            setMaxCount(max)
            setWeeklyData(days)
        } catch (err) {
            console.error('Error fetching progress:', err)
        } finally {
            setLoading(false)
        }
    }

    const totalThisWeek = weeklyData.reduce((sum, d) => sum + d.count, 0)

    if (loading) {
        return (
            <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-sm border border-slate-200 dark:border-white/5 animate-pulse">
                <div className="h-40 bg-slate-100 dark:bg-slate-700 rounded-xl"></div>
            </div>
        )
    }

    return (
        <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-sm border border-slate-200 dark:border-white/5">
            <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2">
                    <TrendingUp size={20} className="text-cyan-500" />
                    Weekly Activity
                </h3>
                <span className="text-sm text-slate-500 dark:text-slate-400">
                    {totalThisWeek} exercise{totalThisWeek !== 1 ? 's' : ''} this week
                </span>
            </div>

            {/* Bar Chart */}
            <div className="flex items-end justify-between gap-2 h-32">
                {weeklyData.map((day, index) => {
                    const heightPercent = maxCount > 0 ? (day.count / maxCount) * 100 : 0
                    const isToday = index === weeklyData.length - 1

                    return (
                        <div key={day.date} className="flex-1 flex flex-col items-center gap-2">
                            {/* Bar */}
                            <div className="w-full flex flex-col items-center justify-end h-24">
                                <div
                                    className={`w-full max-w-[40px] rounded-t-lg transition-all duration-500 ${day.count > 0
                                            ? isToday
                                                ? 'bg-gradient-to-t from-cyan-500 to-teal-400'
                                                : 'bg-gradient-to-t from-cyan-500/70 to-teal-400/70'
                                            : 'bg-slate-100 dark:bg-slate-700'
                                        }`}
                                    style={{
                                        height: `${Math.max(heightPercent, 8)}%`,
                                        minHeight: '8px'
                                    }}
                                />
                                {day.count > 0 && (
                                    <span className="text-xs font-bold text-cyan-500 mt-1">
                                        {day.count}
                                    </span>
                                )}
                            </div>

                            {/* Day label */}
                            <span className={`text-xs font-medium ${isToday
                                    ? 'text-cyan-500'
                                    : 'text-slate-400 dark:text-slate-500'
                                }`}>
                                {day.dayName}
                            </span>
                        </div>
                    )
                })}
            </div>

            {/* Streak indicator */}
            {totalThisWeek > 0 && (
                <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700">
                    <p className="text-sm text-slate-500 dark:text-slate-400 text-center">
                        🔥 Keep up the great work! Consistency is key.
                    </p>
                </div>
            )}
        </div>
    )
}
