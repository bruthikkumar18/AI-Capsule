import { Link } from 'react-router-dom';

export default function NavBar({ children }) {
  return (
    <header className="nav">
      <Link to="/" className="brand" aria-label="AI Capsule home">
        <span className="brand-mark" aria-hidden="true" />
        AI Capsule
      </Link>
      <nav className="nav-actions">{children}</nav>
    </header>
  );
}
