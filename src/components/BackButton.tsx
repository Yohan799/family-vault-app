import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface BackButtonProps {
  to?: string;
  className?: string;
  iconClassName?: string;
}

const BackButton = ({ to, className = "", iconClassName = "" }: BackButtonProps) => {
  const navigate = useNavigate();

  const handleBack = () => {
    if (to) {
      navigate(to);
      return;
    }
    
    // Check if there's browser history to go back to
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      // Fallback to dashboard if no history
      navigate('/dashboard');
    }
  };

  return (
    <button
      onClick={handleBack}
      className={`min-w-[44px] min-h-[44px] p-2.5 flex items-center justify-center hover:bg-accent rounded-full transition-colors cursor-pointer touch-action-manipulation ${className}`}
      style={{ touchAction: 'manipulation' }}
      aria-label="Go back"
    >
      <ArrowLeft className={`w-5 h-5 text-foreground ${iconClassName}`} />
    </button>
  );
};

export default BackButton;
