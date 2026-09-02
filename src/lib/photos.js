// GrinKingdom — real species photos (client-side, no backend).
// Pulls freely-licensed real photographs for any species from:
//   1. GBIF occurrence media  (api.gbif.org — CC-licensed field photos)
//   2. Wikipedia REST summary (fallback — the article's lead image)
// Results are cached in localStorage, de-duplicated and throttled through a
// small request queue so the page never stampedes the APIs.

import { useEffect, useRef, useState, useSyncExternalStore } from 'react'

/* ═══════════════════════ helpers ═══════════════════════ */

const GBIF = 'https://api.gbif.org/v1'
const WIKI = 'https://en.wikipedia.org/api/rest_v1/page/summary'

const fetchJson = (url, timeoutMs = 12000) => {
  const ctl = typeof AbortController !== 'undefined' ? new AbortController() : null
  const timer = ctl ? setTimeout(() => ctl.abort(), timeoutMs) : null
  return fetch(url, ctl ? { signal: ctl.signal } : undefined)
    .then((r) => (timer && clearTimeout(timer), r.ok ? r.json() : Promise.reject(new Error(r.status))))
    .catch((e) => {
      if (timer) clearTimeout(timer)
      throw e
    })
}

/* Map a raw license string (GBIF enum or Creative Commons URL) to a readable
   label + link. Unknown / all-rights-reserved licenses return null and the
   image is skipped — we only show images we are allowed to show. */
export function normalizeLicense(raw) {
  if (!raw) return null
  const s = String(raw).toLowerCase()
  if (s.includes('cc0') || s.includes('publicdomain') || s.includes('public domain') || s === 'pdm')
    return { label: 'Public domain', url: 'https://creativecommons.org/publicdomain/zero/1.0/' }
  if (s.includes('by-nc-sa'))
    return { label: 'CC BY-NC-SA', url: 'https://creativecommons.org/licenses/by-nc-sa/4.0/' }
  if (s.includes('by-nc'))
    return { label: 'CC BY-NC', url: 'https://creativecommons.org/licenses/by-nc/4.0/' }
  if (s.includes('by-sa'))
    return { label: 'CC BY-SA', url: 'https://creativecommons.org/licenses/by-sa/4.0/' }
  if (s.includes('by'))
    return { label: 'CC BY', url: 'https://creativecommons.org/licenses/by/4.0/' }
  return null
}

/* Ask well-behaved hosts for a smaller variant of an image (falls back to the
   original in the UI whenever the variant 404s). */
export function smallVariant(url) {
  if (!url) return url
  try {
    // iNaturalist S3:  .../photos/<id>/original.jpeg → medium.jpeg
    let m = url.match(/^(https:\/\/inaturalist(?:-open-data)?\.s3\.amazonaws\.com\/photos\/\d+\/)original(\.\w+)(?:\?.*)?$/i)
    if (m) return `${m[1]}medium${m[2]}`
    // Flickr static:  .../<id>_<secret>.jpg → _m.jpg (240px)
    m = url.match(/^(https:\/\/live\.staticflickr\.com\/\d+\/\d+_[0-9a-f]+)(\.\w+)$/i)
    if (m) return `${m[1]}_m${m[2]}`
    // Wikimedia Commons: /commons/a/ab/File.jpg → /commons/thumb/a/ab/File.jpg/640px-File.jpg
    m = url.match(/^(https:\/\/upload\.wikimedia\.org\/wikipedia\/commons\/)((?:[0-9a-f]\/[0-9a-f]{2})\/)([^/]+)$/i)
    if (m) return `${m[1]}thumb/${m[2]}${encodeURIComponent(decodeURIComponent(m[3]))}/640px-${encodeURIComponent(decodeURIComponent(m[3]))}`
    return url
  } catch {
    return url
  }
}

/* ═══════════════════════ request queue ═══════════════════════ */
/* Max 4 photo lookups in flight at once, shared by every card & page. */

const MAX_ACTIVE = 4
let activeCount = 0
const waitingQueue = []
const acquire = () =>
  new Promise((resolve) => (activeCount < MAX_ACTIVE ? ((activeCount += 1), resolve()) : waitingQueue.push(resolve)))
const release = () => {
  const next = waitingQueue.shift()
  if (next) next()
  else activeCount = Math.max(0, activeCount - 1)
}

/* ═══════════════════════ localStorage cache ═══════════════════════ */

const CACHE_KEY = 'gk-photos-v1'
const CACHE_TTL = 10 * 24 * 3600 * 1000 // 10 days
const CACHE_MAX = 400 // entries — keeps localStorage tiny

function readStorage() {
  try {
    return typeof localStorage !== 'undefined' ? JSON.parse(localStorage.getItem(CACHE_KEY) || '{}') : {}
  } catch {
    return {}
  }
}
function writeStorage(map) {
  try {
    if (typeof localStorage === 'undefined') return
    const entries = Object.entries(map)
    if (entries.length > CACHE_MAX) {
      entries
        .sort((a, b) => (a[1].t || 0) - (b[1].t || 0))
        .slice(0, entries.length - CACHE_MAX)
        .forEach(([k]) => delete map[k])
    }
    localStorage.setItem(CACHE_KEY, JSON.stringify(map))
  } catch {
    /* quota / private mode — ignore */
  }
}

let memoryCache = readStorage()
const inflight = new Map()

/* ═══════════════════════ sources ═══════════════════════ */

async function gbifPhotos(sci) {
  // 1 — resolve the scientific name to a GBIF species key
  const match = await fetchJson(`${GBIF}/species/match?name=${encodeURIComponent(sci)}`)
  if (!match || match.matchType === 'NONE' || !match.usageKey) return []
  if (match.rank && match.rank !== 'SPECIES' && match.rank !== 'SUBSPECIES') return []
  if (typeof match.confidence === 'number' && match.confidence < 80) return []
  // 2 — pull occurrences of that species that carry images
  const data = await fetchJson(
    `${GBIF}/occurrence/search?taxonKey=${match.usageKey}&mediaType=StillImage&limit=100`
  ).catch(() => null)
  const results = data?.results || []
  const out = []
  const seen = new Set()
  for (const occ of results) {
    if (out.length >= 12) break
    // keep only photos really identified as this species (not a look-alike subtaxon)
    const rightTaxon =
      occ.taxonKey === match.usageKey ||
      occ.speciesKey === match.usageKey ||
      occ.acceptedTaxonKey === match.usageKey ||
      occ.synonym === true
    if (!rightTaxon) continue
    for (const m of occ.media || []) {
      if (!m || m.type !== 'StillImage' || !m.identifier) continue
      const lic = normalizeLicense(m.license)
      if (!lic) continue
      if (seen.has(m.identifier)) continue
      seen.add(m.identifier)
      out.push({
        id: `gbif-${occ.key}-${seen.size}`,
        url: m.identifier,
        small: smallVariant(m.identifier),
        license: lic.label,
        licenseUrl: lic.url,
        credit: m.rightsHolder || m.creator || m.publisher?.title || 'GBIF contributor',
        source: 'GBIF',
        sourceUrl: occ.key ? `https://www.gbif.org/occurrence/${occ.key}` : 'https://www.gbif.org/',
      })
      if (out.length >= 12) break
    }
  }
  return out
}

async function wikipediaPhoto(sci, commonName) {
  const attempt = async (title) => {
    if (!title) return null
    const sum = await fetchJson(`${WIKI}/${encodeURIComponent(title.replace(/\s+/g, '_'))}`).catch(() => null)
    if (!sum || !sum.originalimage?.source) return null
    const page = sum.content_urls?.desktop?.page || 'https://en.wikipedia.org/'
    return {
      id: `wiki-${sum.pageid || title}`,
      url: sum.originalimage.source,
      small: sum.thumbnail?.source || smallVariant(sum.originalimage.source),
      license: 'Free license',
      licenseUrl: page,
      credit: sum.titles?.normalized || title,
      source: 'Wikipedia',
      sourceUrl: page,
    }
  }
  return (await attempt(sci)) || (await attempt(commonName))
}

/* ═══════════════════════ public API ═══════════════════════ */

export async function getSpeciesPhotos(species) {
  const sci = (species.sci || '').trim()
  if (!sci) return []
  const key = sci.toLowerCase()
  const hit = memoryCache[key]
  if (hit && Date.now() - hit.t < CACHE_TTL) return hit.p
  if (inflight.has(key)) return inflight.get(key)

  const task = (async () => {
    await acquire()
    try {
      let photos = []
      try {
        photos = await gbifPhotos(sci)
      } catch {
        photos = []
      }
      if (photos.length === 0) {
        const wiki = await wikipediaPhoto(sci, species.name).catch(() => null)
        if (wiki) photos = [wiki]
      }
      memoryCache[key] = { t: Date.now(), p: photos }
      writeStorage(memoryCache)
      return photos
    } finally {
      release()
      inflight.delete(key)
    }
  })()

  inflight.set(key, task)
  return task
}

/* ── React hooks ─────────────────────────────────────────── */

export function useSpeciesPhotos(species, enabled = true) {
  const [state, setState] = useState({ loading: !!enabled, photos: [], error: false })
  useEffect(() => {
    if (!enabled) {
      setState({ loading: false, photos: [], error: false })
      return
    }
    let cancelled = false
    setState({ loading: true, photos: [], error: false })
    getSpeciesPhotos(species)
      .then((photos) => !cancelled && setState({ loading: false, photos, error: false }))
      .catch(() => !cancelled && setState({ loading: false, photos: [], error: true }))
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [species?.slug, enabled])
  return state
}

/* Lazy-load helper: true once the element scrolls near the viewport. */
export function useInView(ref, rootMargin = '300px') {
  const [inView, setInView] = useState(false)
  useEffect(() => {
    if (inView) return
    const el = ref?.current
    if (!el) return
    if (typeof IntersectionObserver === 'undefined') {
      setInView(true)
      return
    }
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setInView(true)
          obs.disconnect()
        }
      },
      { rootMargin }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [ref, inView, rootMargin])
  return inView
}

/* ── "real photos in cards" preference (site-wide toggle) ── */

const PREF_KEY = 'gk-real-photos'
let prefValue = (() => {
  try {
    const v = typeof localStorage !== 'undefined' ? localStorage.getItem(PREF_KEY) : null
    return v === null ? true : v === '1' // default: ON
  } catch {
    return true
  }
})()
const prefListeners = new Set()
const prefSubscribe = (fn) => {
  prefListeners.add(fn)
  return () => prefListeners.delete(fn)
}

export function isRealPhotosOn() {
  return prefValue
}
export function setRealPhotos(v) {
  prefValue = !!v
  try {
    if (typeof localStorage !== 'undefined') localStorage.setItem(PREF_KEY, v ? '1' : '0')
  } catch {
    /* ignore */
  }
  prefListeners.forEach((fn) => fn())
}
export function useRealPhotosPref() {
  return useSyncExternalStore(prefSubscribe, () => prefValue, () => true)
}
