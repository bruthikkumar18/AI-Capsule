import { Link } from 'react-router-dom';
import NavBar from '../components/NavBar.jsx';

export default function Landing() {
  return (
    <>
      <NavBar>
        <Link className="btn btn-ghost" to="/login">
          Sign in
        </Link>
      </NavBar>

      <main>
        <section className="hero">
          <div className="hero-copy">
            <h1>Keep the prompts that worked.</h1>
            <p className="lead">
              AI Capsule is a private library for the prompts you use with ChatGPT, Copilot,
              Gemini and Claude. Save each prompt with its project, version, a summary of the
              answer and whether it helped, so the good ones are there next time.
            </p>
            <div className="hero-actions">
              <Link className="btn btn-primary" to="/login">
                Sign in with GitHub
              </Link>
              <a className="btn btn-ghost" href="#how">
                See how it works
              </a>
            </div>
          </div>

          <figure className="capsule-demo" aria-label="Example prompt record">
            <div className="capsule-shell">
              <div className="capsule-top">
                <span className="pill pill-version">v3</span>
                <span className="pill">Debugging</span>
                <span className="pill pill-good">Good</span>
              </div>
              <p className="capsule-project">SmartFarm Irrigation</p>
              <p className="capsule-title">Debug cloud deployment</p>
              <pre className="capsule-prompt">
                My Node server starts locally but crashes on Render with "port already in use".
                What should my start command and PORT handling look like?
              </pre>
              <p className="capsule-summary">
                Use process.env.PORT and remove the hard-coded port. Worked first try.
              </p>
            </div>
            <figcaption className="muted">One capsule: the prompt, the answer, the verdict.</figcaption>
          </figure>
        </section>

        <section id="how" className="how">
          <h2>How it works</h2>
          <ol className="steps">
            <li>
              <h3>Sign in with GitHub</h3>
              <p>No new password. Your GitHub account identifies you, and your records stay yours.</p>
            </li>
            <li>
              <h3>Save a capsule</h3>
              <p>Paste the prompt, note the project and version, and summarise what the AI answered.</p>
            </li>
            <li>
              <h3>Review and improve</h3>
              <p>Mark prompts as reviewed or improved, rate them, and edit them as you learn what works.</p>
            </li>
          </ol>
        </section>
      </main>

      <footer className="footer muted">AI Capsule, CSE3CWA / CSE5006 Assignment 3</footer>
    </>
  );
}
