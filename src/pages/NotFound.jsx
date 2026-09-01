import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="notfound">
      <h1>🕳️ 404</h1>
      <p>This species seems to be… extinct? Or it never existed. Let's get you home.</p>
      <Link className="btn btn-primary" to="/">
        ← Back home
      </Link>
    </div>
  )
}
