import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'danger' | 'outline';
    isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
    children,
    variant = 'primary',
    isLoading = false,
    disabled,
    className = '',
    ...props
}) => {
    const variantClass = `btn-${variant}`;
    return (
        <button
            className={`btn ${variantClass} ${className}`}
            disabled={disabled || isLoading}
            {...props}
        >
            {isLoading ? <span className="btn-spinner">Processando...</span> : children}
        </button>
    );
};
