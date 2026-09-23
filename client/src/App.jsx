import { Routes, Route, Link } from 'react-router-dom';
import Landing from './pages/Landing.jsx';
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import NavBar from './components/NavBar.jsx';

function NotFound() {
  return (
    <>
      <NavBar />
      <main className="page narrow">
        <h1>Page not found</h1>
        <p>That address does not exist in AI Capsule.</p>
        <Link className="btn btn-primary" to="/">
          Go to the home page
        </Link>
      </main>
    </>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route
        path="/dashboard"
        element={<ProtectedRoute>{(user) => <Dashboard user={user} />}</ProtectedRoute>}
      />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
