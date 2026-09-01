import { useParams } from 'react-router-dom'
import { KINGDOM_MAP } from '../data/kingdoms.js'
import ComingSoon from '../components/ComingSoon.jsx'

export default function KingdomPage() {
  const { kingdomId } = useParams()
  const k = KINGDOM_MAP[kingdomId]
  return (
    <ComingSoon title={k ? `${k.emoji} ${k.name}` : 'Unknown kingdom'} milestone="Milestone 3">
      {k
        ? `A full landing page for ${k.name} — ${k.blurb}`
        : 'This kingdom page is coming soon.'}
    </ComingSoon>
  )
}
