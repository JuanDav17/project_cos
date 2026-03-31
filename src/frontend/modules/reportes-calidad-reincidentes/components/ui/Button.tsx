import React from 'react';
import { classNames } from '@reincidentes/lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary';
}

export const Button: React.FC<ButtonProps> = ({ children, variant = 'primary', className, ...props }) => {
  const variants: Record<NonNullable<ButtonProps['variant']>, string> = {
    primary: 'rri-button-primary',
    secondary: 'rri-button-secondary',
  };

  return (
    <button
      className={classNames('rri-button', variants[variant], className)}
      {...props}
    >
      {children}
    </button>
  );
};
