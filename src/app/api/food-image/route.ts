import { NextRequest, NextResponse } from 'next/server'

// Looks up one food photo on Pexels for a dish name. Key stays server-side.
// Responses are cached by Next's data cache for 30 days per query, so each dish costs one API call.
export async function GET(req: NextRequest) {
    const q = req.nextUrl.searchParams.get('q')?.trim()
    if (!q) return NextResponse.json({ url: null }, { status: 400 })
    const key = process.env.PEXELS_API_KEY
    if (!key) return NextResponse.json({ url: null, error: 'PEXELS_API_KEY not set' }, { status: 500 })

    const res = await fetch(
        `https://api.pexels.com/v1/search?query=${encodeURIComponent(q + ' food')}&per_page=1&orientation=square`,
        { headers: { Authorization: key }, next: { revalidate: 60 * 60 * 24 * 30 } }
    )
    if (!res.ok) return NextResponse.json({ url: null }, { status: 502 })
    const data = await res.json()
    const photo = data.photos?.[0]
    return NextResponse.json(
        photo ? { url: photo.src.medium, alt: photo.alt, credit: photo.photographer, creditUrl: photo.url } : { url: null },
        { headers: { 'Cache-Control': 'public, max-age=2592000' } }
    )
}
