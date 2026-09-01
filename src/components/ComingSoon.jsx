import { Link } from 'react-router-dom'
import Mascot from './Mascot.jsx'

export default function ComingSoon({ title, milestone, children }) {
  return (
    <section className="coming">
      <div className="container coming-card">
        <Mascot size={88} />
        <h1 className="coming-title">{title}</h1>
        <p className="coming-sub">{children}</p>
        {milestone && <span className="chip">Up next: {milestone}</span>}
        <div className="hero-cta" style={{ justifyContent: 'center' }}>
          <Link className="btn btn-primary" to="/">
            ← Back home
          </Link>
        </div>
      </div>
    </section>
  )
}
