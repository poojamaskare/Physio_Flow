'use client'

import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { cn } from '@/lib/utils'
import { Mic, MicOff, Send, Loader2, Volume2, VolumeX, Bot, RotateCcw } from 'lucide-react'

interface Msg { role: 'user' | 'assistant'; content: string }

// Minimal typing for the Web Speech API (not in lib.dom for all TS targets).
type Recognition = { lang: string; interimResults: boolean; onresult: (e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void; onend: () => void; onerror: () => void; start: () => void; stop: () => void }
const getRecognition = (): Recognition | null => {
    const w = window as unknown as { SpeechRecognition?: new () => Recognition; webkitSpeechRecognition?: new () => Recognition }
    const Ctor = w.SpeechRecognition || w.webkitSpeechRecognition
    return Ctor ? new Ctor() : null
}

/** Floating mic → chat sheet. Speech in via Web Speech API, reply via /api/coach, speech out via speechSynthesis. */
export default function VoiceCoach({ patientId }: { patientId: string }) {
    const [open, setOpen] = useState(false)
    const [messages, setMessages] = useState<Msg[]>([])
    const [input, setInput] = useState('')
    const [listening, setListening] = useState(false)
    const [thinking, setThinking] = useState(false)
    const [muted, setMuted] = useState(false)
    const [supported, setSupported] = useState(true)
    const recRef = useRef<Recognition | null>(null)
    const endRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (!open) return
        fetch(`/api/coach?patientId=${patientId}`).then(r => r.json()).then(d => setMessages(d.messages || [])).catch(() => { })
    }, [open, patientId])

    useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages, thinking])

    const speak = (text: string) => {
        if (muted || typeof speechSynthesis === 'undefined') return
        speechSynthesis.cancel()
        const u = new SpeechSynthesisUtterance(text)
        u.rate = 1
        speechSynthesis.speak(u)
    }

    const send = async (text: string) => {
        const t = text.trim()
        if (!t || thinking) return
        setInput('')
        setMessages(m => [...m, { role: 'user', content: t }])
        setThinking(true)
        try {
            const res = await fetch('/api/coach', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ patientId, message: t }) })
            const data = await res.json()
            const reply = data.reply || data.error || 'Something went wrong.'
            setMessages(m => [...m, { role: 'assistant', content: reply }])
            speak(reply)
        } catch {
            setMessages(m => [...m, { role: 'assistant', content: 'Network error, please try again.' }])
        } finally {
            setThinking(false)
        }
    }

    const clearChat = async () => {
        if (!messages.length || thinking) return
        if (!confirm('Clear this conversation? The helper will forget what you discussed.')) return
        speechSynthesis?.cancel()
        setMessages([])
        await fetch(`/api/coach?patientId=${patientId}`, { method: 'DELETE' }).catch(() => { })
    }

    const toggleMic = () => {
        if (listening) { recRef.current?.stop(); return }
        const rec = getRecognition()
        if (!rec) { setSupported(false); return }
        speechSynthesis?.cancel()
        rec.lang = 'en-IN'
        rec.interimResults = false
        rec.onresult = e => send(e.results[0][0].transcript)
        rec.onend = () => setListening(false)
        rec.onerror = () => setListening(false)
        recRef.current = rec
        setListening(true)
        rec.start()
    }

    return (
        <Sheet open={open} onOpenChange={o => { setOpen(o); if (!o) { recRef.current?.stop(); speechSynthesis?.cancel() } }}>
            <SheetTrigger render={<Button size="lg" className="fixed right-4 bottom-4 z-40 h-12 gap-2 rounded-full pr-5 pl-4 shadow-lg md:right-6 md:bottom-6" aria-label="Open helper" />}>
                <Mic className="size-5" />
                <span className="text-sm font-medium">Need help? I&apos;m here</span>
            </SheetTrigger>
            <SheetContent side="right" className="flex w-full flex-col sm:max-w-md">
                <SheetHeader className="pr-12">
                    <div className="flex items-center justify-between">
                        <SheetTitle className="flex items-center gap-2"><Bot className="size-4" /> Helper</SheetTitle>
                        <Button variant="ghost" size="icon-sm" onClick={clearChat} disabled={!messages.length || thinking} aria-label="Clear conversation" title="Clear conversation">
                            <RotateCcw />
                        </Button>
                    </div>
                    <SheetDescription>Ask about your exercises, progress or diet plan.</SheetDescription>
                </SheetHeader>

                <div className="flex-1 space-y-3 overflow-y-auto px-4">
                    {messages.length === 0 && !thinking && (
                        <p className="py-8 text-center text-sm text-muted-foreground">Try: &ldquo;What&apos;s left for today?&rdquo; or &ldquo;What should I have for lunch?&rdquo;</p>
                    )}
                    {messages.map((m, i) => (
                        <div key={i} className={cn('max-w-[85%] rounded-lg px-3 py-2 text-sm', m.role === 'user' ? 'ml-auto bg-primary text-primary-foreground' : 'bg-muted')}>
                            {m.content}
                        </div>
                    ))}
                    {thinking && <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="size-4 animate-spin" /> Thinking…</div>}
                    <div ref={endRef} />
                </div>

                <form onSubmit={e => { e.preventDefault(); send(input) }} className="flex items-center gap-2 border-t p-4">
                    <Button type="button" variant={listening ? 'destructive' : 'outline'} size="icon" onClick={toggleMic} aria-label={listening ? 'Stop listening' : 'Speak'} title={supported ? undefined : 'Voice input not supported in this browser'}>
                        {listening ? <MicOff className="animate-pulse" /> : <Mic />}
                    </Button>
                    <Input placeholder={listening ? 'Listening…' : 'Type a message'} value={input} onChange={e => setInput(e.target.value)} disabled={thinking} />
                    <Button type="submit" size="icon" disabled={!input.trim() || thinking} aria-label="Send"><Send /></Button>
                    <Button type="button" variant="ghost" size="icon" onClick={() => { setMuted(m => !m); speechSynthesis?.cancel() }} aria-label={muted ? 'Unmute' : 'Mute'}>
                        {muted ? <VolumeX /> : <Volume2 />}
                    </Button>
                </form>
            </SheetContent>
        </Sheet>
    )
}
