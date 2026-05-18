interface TagProps {
  label: string;
  selected?: boolean;
  onClick?: () => void;
}

export const Tag = ({ label, selected = false, onClick }: TagProps) => {
  const baseStyles = 'inline-flex items-center px-3 py-1 rounded-full text-sm font-medium transition-colors cursor-pointer';
  const selectedStyles = selected
    ? 'bg-primary-100 text-primary-800 hover:bg-primary-200'
    : 'bg-gray-100 text-gray-800 hover:bg-gray-200';

  return (
    <span
      className={`${baseStyles} ${selectedStyles}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {label}
    </span>
  );
}; 