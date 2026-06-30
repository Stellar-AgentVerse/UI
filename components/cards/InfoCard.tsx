interface InfoCardProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
}

const InfoCard: React.FC<InfoCardProps> = ({ title, description, icon }) => {
  return (
    <div 
      className="glass-card rounded-2xl p-8 transition-all duration-200 group cursor-default glass-card-hover"
    >
      <div className="mb-4 text-accent transition-transform duration-200 group-hover:scale-105">
        {icon ? icon : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
        )}
      </div>
      <h3 className="mb-2 text-xl font-semibold text-primary transition-colors group-hover:text-accent">{title}</h3>
      <p className="leading-relaxed text-on-surface-variant">{description}</p>
    </div>
  );
};

export default InfoCard;
