import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label: string;
    error?: string;
    helperText?: string;
}

export const Input: React.FC<InputProps> = ({
    label,
    id,
    name,
    error,
    helperText,
    required,
    className = '',
    ...props
}) => {
    const inputId = id ?? name;
    return (
        <div className={`field ${className}`}>
            <label htmlFor={inputId}>
                {label} {required && <span className="text-danger">*</span>}
            </label>
            <input
                id={inputId}
                name={name}
                required={required}
                aria-invalid={Boolean(error)}
                aria-describedby={error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined}
                {...props}
            />
            {helperText && !error && (
                <span id={`${inputId}-helper`} className="field-hint">
                    {helperText}
                </span>
            )}
            {error && (
                <span id={`${inputId}-error`} className="field-error" role="alert">
                    {error}
                </span>
            )}
        </div>
    );
};
