interface MainTitleProps {
  children: React.ReactNode;
  className?: string;
}

const MainTitle: React.FC<MainTitleProps> = ({ children, className = '' }) => {
  return (
    <h1 
      className={`font-heading text-5xl font-semibold tracking-tight text-primary md:text-7xl ${className}`}
    >
      {children}
    </h1>
  );
};

export default MainTitle;
