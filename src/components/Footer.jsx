import { Link } from 'react-router-dom'
import Mascot from './Mascot.jsx'
import { KINGDOMS } from '../data/kingdoms.js'

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-inner">
        <div className="footer-brand">
          <Link to="/" className="brand">
            <Mascot size={34} />
            <span className="brand-text">
              <strong>GrinKingdom</strong>
              <small>Species Kingdom</small>
            </span>
          </Link>
          <p className="footer-note">
            A playful encyclopedia of every kingdom of life — from viruses to humans.
            Made with 🌍 + ❤️.
          </p>
        </div>
        <div className="footer-links">
          <strong>Explore</strong>
          <Link to="/explore">All species</Link>
          <Link to="/3d-gallery">3D Gallery</Link>
          <Link to="/about">About</Link>
        </div>
        <div className="footer-links">
          <strong>Kingdoms</strong>
          {KINGDOMS.map((k) => (
            <Link key={k.id} to={`/kingdom/${k.id}`}>
              {k.emoji} {k.name}
            </Link>
          ))}
        </div>
      </div>
    </footer>
  )
}
