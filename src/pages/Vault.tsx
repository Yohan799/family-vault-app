import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const Vault = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to the new vault home
    navigate("/vault/home", { replace: true });
  }, [navigate]);

  return null;
};

export default Vault;
