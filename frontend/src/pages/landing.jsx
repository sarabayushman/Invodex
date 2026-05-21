import { Link } from "react-router-dom";

function Landing() {
  return (
    <main className="landing-page">
      <p>landing page</p>
      <Link className="button landing-login" to="/login">Login</Link>
    </main>
  );
}

export default Landing;
