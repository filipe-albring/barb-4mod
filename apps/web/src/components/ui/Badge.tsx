import React from 'react';

export interface BadgeProps {
    variant?: 'primary' | 'success' | 'warning' | 'danger' | 'neutral';
    children: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({ variant = 'neutral', children }) => {
    return <span className={`badge badge-${variant}`}>{children}</span>;
};
