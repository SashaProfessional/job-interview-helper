import React from 'react';

interface ButtonProps {
  onClick: () => void;
  disabled?: boolean;
  isLoading?: boolean;
  children: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({
  onClick,
  disabled = false,
  isLoading = false,
  children,
}) => {
  return (
    <button
      className={`button ${isLoading ? 'loading' : ''} ${disabled ? 'disabled' : ''}`}
      onClick={onClick}
      disabled={disabled || isLoading}
    >
      {children}
    </button>
  );
};

export default Button;
