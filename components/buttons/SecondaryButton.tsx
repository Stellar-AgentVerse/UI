'use client';

interface SecondaryButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string; // Allow custom styling
}

const SecondaryButton: React.FC<SecondaryButtonProps> = ({ children, onClick, className = '' }) => {
  return (
    <button
      onClick={onClick}
      className={`focus-ring inline-flex items-center justify-center rounded-full border border-accent/30 bg-transparent px-6 py-3 font-semibold text-accent transition-all duration-200 hover:border-accent/60 hover:bg-accent/10 active:scale-95 ${className}`}
    >
      {children}
    </button>
  );
};

export default SecondaryButton;
