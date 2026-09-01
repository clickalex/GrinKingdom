import { useParams, Link } from 'react-router-dom'
import ComingSoon from '../components/ComingSoon.jsx'

export default function SpeciesDetail() {
  const { slug } = useParams()
  return (
    <ComingSoon title={`Species: ${slug}`} milestone="Milestone 4 + 5">
      This is where the magic happens — a rich detail page with the rotatable 3D viewer, quick
      facts, scientific classification, "did you know?" fun facts and related species.{' '}
      <Link to="/explore">Back to Explore →</Link>
    </ComingSoon>
  )
}
