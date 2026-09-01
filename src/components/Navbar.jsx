import { Link, NavLink } from 'react-router-dom'
import Mascot from './Mascot.jsx'

const links = [
  { to: '/', label: 'Home', end: true },
  { to: '/explore', label: 'Explore' },
  { to: '/3d-gallery', label: '3D Gallery' },
  { to: '/about', label: 'About' },
]

export default function Navbar() {
  return (
    <header className="nav">
      <div className="container nav-inner">
        <Link to="/" className="brand">
          <Mascot size={40} />
          <span className="brand-text">
            <strong>GrinKingdom</strong>
            <small>Species Kingdom</small>
          </span>
        </Link>
        <nav className="nav-links" aria-label="Main navigation">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end}
              className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}
            >
              {l.label}
            </NavLink>
          ))}
        </nav>
      </div>
    </header>
  )
}
