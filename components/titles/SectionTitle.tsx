interface SectionTitleProps {
  children: React.ReactNode;
  className?: string;
}

const SectionTitle: React.FC<SectionTitleProps> = ({ children, className = '' }) => {
  return (
    <div className={`relative inline-block ${className}`}>
        <h2 
        className="mb-2 font-heading text-3xl font-semibold text-primary md:text-4xl"
        >
        {children}
        </h2>
        <div className="h-1 w-1/3 rounded-full bg-accent"></div>
    </div>
  );
};

export default SectionTitle;
