import React from 'react';

export interface SelectOption {
    value: string;
    label: string;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
    label: string;
    options: SelectOption[];
    error?: string;
    placeholder?: string;
}

export const Select: React.FC<SelectProps> = ({
    label,
    id,
    name,
    options,
    error,
    placeholder = 'Selecione uma opção...',
    required,
    className = '',
    ...props
}) => {
    const selectId = id ?? name;
    return (
        <div className={`field ${className}`}>
            <label htmlFor={selectId}>
                {label} {required && <span className="text-danger">*</span>}
            </label>
            <select
                id={selectId}
                name={name}
                required={required}
                aria-invalid={Boolean(error)}
                aria-describedby={error ? `${selectId}-error` : undefined}
                {...props}
            >
                {placeholder && <option value="">{placeholder}</option>}
                {options.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                        {opt.label}
                    </option>
                ))}
            </select>
            {error && (
                <span id={`${selectId}-error`} className="field-error" role="alert">
                    {error}
                </span>
            )}
        </div>
    );
};
