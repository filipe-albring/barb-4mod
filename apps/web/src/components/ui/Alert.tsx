import React from 'react';

export interface AlertProps {
    variant?: 'info' | 'success' | 'warning' | 'error';
    children: React.ReactNode;
    className?: string;
}

export const Alert: React.FC<AlertProps> = ({
    variant = 'info',
    children,
    className = '',
}) => {
    return (
        <div className={`notice ${variant !== 'info' ? variant : ''} ${className}`} role={variant === 'error' ? 'alert' : 'status'}>
            {children}
        </div>
    );
};
