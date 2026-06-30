'use client';

interface PrimaryButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string; // Allow custom styling
}

const PrimaryButton: React.FC<PrimaryButtonProps> = ({ children, onClick, className = '' }) => {
  return (
    <button
      onClick={onClick}
      className={`focus-ring inline-flex items-center justify-center rounded-full bg-accent px-6 py-3 font-semibold text-on-primary shadow-[0_12px_40px_rgba(95,251,241,0.18)] transition-all duration-200 hover:brightness-110 active:scale-95 ${className}`}
    >
      {children}
    </button>
  );
};

export default PrimaryButton;
