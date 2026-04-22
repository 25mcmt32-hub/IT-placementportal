import { useNavigate } from "react-router-dom";

function Hero() {
  const navigate = useNavigate();

  return (
    <div className="hero">

      <div className="hero-left">
        <h1>
          One Stop Portal for Placements & Internships
        </h1>
        <p>
          Welcome to University of Hyderabad Placement Portal
        </p>
      </div>

      <div className="hero-right">
        <button onClick={() => navigate("/student")}>
          Student
        </button>

        <button onClick={() => navigate("/faculty")}>
          Faculty Coordinator
        </button>

        <button onClick={() => navigate("/coordinator")}>
          Student Coordinator
        </button>
      </div>

    </div>
  );
}

export default Hero;