'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Sun, Apple, Utensils, Coffee, Moon, CheckCircle2, Lightbulb, LucideIcon } from 'lucide-react'

interface Meal { title: string; items: string[] }
interface Photo { url: string | null; alt?: string; credit?: string; creditUrl?: string }

// Default time + icon per common heading; anything else gets the generic fork/knife with no time.
const MEAL_META: { match: RegExp; time: string; icon: LucideIcon }[] = [
    { match: /breakfast/i, time: '8:00 AM', icon: Sun },
    { match: /mid.?morning|brunch/i, time: '11:00 AM', icon: Apple },
    { match: /lunch/i, time: '1:00 PM', icon: Utensils },
    { match: /evening|snack|tea/i, time: '4:30 PM', icon: Coffee },
    { match: /dinner|night/i, time: '7:30 PM', icon: Moon },
]

/** Parses the doctor's free-text plan: a line ending in ":" starts a meal; "-"/"•" lines are items. */
export function parseDietPlan(text: string): Meal[] {
    const meals: Meal[] = []
    for (const raw of text.split('\n')) {
        const line = raw.trim()
        if (!line) continue
        const heading = line.match(/^(.+?):\s*$/)
        if (heading) { meals.push({ title: heading[1], items: [] }); continue }
        const item = line.replace(/^[-•*]\s*/, '')
        if (meals.length === 0) meals.push({ title: 'Plan', items: [] })
        meals[meals.length - 1].items.push(item)
    }
    return meals
}

// First dish of the first item, e.g. "2 Idli with Sambar / 1 cup Upma" -> "Idli with Sambar"
const dishQuery = (meal: Meal) => (meal.items[0] || meal.title).split('/')[0].replace(/^\d+(\.\d+)?\s*(cups?|glass|pieces?|tbsp|tsp)?\s*/i, '').trim()

function MealCard({ meal }: { meal: Meal }) {
    const meta = MEAL_META.find(m => m.match.test(meal.title))
    const Icon = meta?.icon || Utensils
    const [photo, setPhoto] = useState<Photo | null>(null)

    useEffect(() => {
        let alive = true
        fetch(`/api/food-image?q=${encodeURIComponent(dishQuery(meal))}`)
            .then(r => r.json())
            .then(p => { if (alive) setPhoto(p) })
            .catch(() => { if (alive) setPhoto({ url: null }) })
        return () => { alive = false }
    }, [meal])

    return (
        <Card className="py-0">
            <CardContent className="flex items-center gap-4 p-4">
                <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-muted"><Icon className="size-5" /></div>
                <div className="min-w-0 flex-1">
                    {meta && <span className="mb-1 inline-block rounded-md border px-1.5 py-0.5 text-[10px] text-muted-foreground">{meta.time}</span>}
                    <p className="font-semibold">{meal.title}</p>
                    <ul className="mt-1 list-inside list-disc space-y-0.5 text-sm text-muted-foreground">
                        {meal.items.map((it, i) => <li key={i}>{it}</li>)}
                    </ul>
                </div>
                <div className="relative size-24 shrink-0 overflow-hidden rounded-lg bg-muted sm:size-28">
                    {photo === null ? (
                        <Skeleton className="size-full" />
                    ) : photo.url ? (
                        <Image src={photo.url} alt={photo.alt || meal.title} fill sizes="112px" className="object-cover" />
                    ) : (
                        <div className="flex size-full items-center justify-center text-muted-foreground"><Icon className="size-6" /></div>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}

export default function DietPlanView({ plan, doctorName }: { plan: string | null; doctorName?: string }) {
    const meals = plan ? parseDietPlan(plan) : []

    return (
        <div className="space-y-6">
            <div>
                <p className="text-xs font-medium tracking-wider text-muted-foreground uppercase">Your personalized</p>
                <h2 className="text-3xl font-semibold tracking-tight">Diet plan</h2>
                <p className="mt-1 max-w-lg text-sm text-muted-foreground">
                    Fuel your recovery with the right nutrition.{doctorName ? ` Prescribed by ${doctorName}.` : ''}
                </p>
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
                <div className="space-y-3 lg:col-span-2">
                    {meals.length ? (
                        meals.map((m, i) => <MealCard key={`${m.title}-${i}`} meal={m} />)
                    ) : (
                        <Card><CardContent className="py-10 text-center text-sm text-muted-foreground">No diet plan assigned yet. Stay hydrated and eat balanced meals.</CardContent></Card>
                    )}
                </div>

                <div className="space-y-4">
                    <Card>
                        <CardHeader><CardTitle className="flex items-center gap-2"><CheckCircle2 className="size-4" />General rehabilitation guidelines</CardTitle></CardHeader>
                        <CardContent>
                            <ul className="space-y-2 text-sm text-muted-foreground">
                                {[
                                    'Increase lean protein intake to support muscle and joint tissue repair.',
                                    'Stay hydrated — aim for 8–10 glasses of water daily.',
                                    'Include plenty of fruits, vegetables and whole grains.',
                                    'Avoid processed foods, excess sugar and fried items.',
                                    'Follow the plan consistently for better results.',
                                ].map(t => (
                                    <li key={t} className="flex gap-2"><CheckCircle2 className="mt-0.5 size-4 shrink-0" />{t}</li>
                                ))}
                            </ul>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader><CardTitle className="flex items-center gap-2"><Lightbulb className="size-4" />Remember</CardTitle></CardHeader>
                        <CardContent className="text-sm text-muted-foreground">
                            Nutrition works hand in hand with your exercise and therapy. Stay consistent, listen to your body and keep moving forward.
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
