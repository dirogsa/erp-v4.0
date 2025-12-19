import React from 'react';

const Select = ({
    label,
    value,
    onChange,
    options = [],
    placeholder = 'Seleccione...',
    required = false,
    disabled = false,
    error,
    helperText,
    ...props
}) => {
    return (
        <div style={{ marginBottom: '1rem' }}>
            {label && (
                <label style={{
                    display: 'block',
                    marginBottom: '0.5rem',
                    fontWeight: '500',
                    color: error ? '#ef4444' : '#e2e8f0'
                }}>
                    {label} {required && <span style={{ color: '#ef4444' }}>*</span>}
                </label>
            )}
            <select
                value={value}
                onChange={onChange}
                required={required}
                disabled={disabled}
                style={{
                    width: '100%',
                    padding: '0.5rem',
                    borderRadius: '0.375rem',
                    border: error ? '1px solid #ef4444' : '1px solid #334155',
                    backgroundColor: disabled ? '#1e293b' : '#0f172a',
                    color: '#e2e8f0',
                    fontSize: '1rem',
                    opacity: disabled ? 0.6 : 1,
                    cursor: disabled ? 'not-allowed' : 'pointer',
                }}
                {...props}
            >
                <option value="">{placeholder}</option>
                {options.map((option, index) => (
                    <option key={index} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </select>
            {(error || helperText) && (
                <small style={{
                    display: 'block',
                    marginTop: '0.25rem',
                    color: error ? '#ef4444' : '#94a3b8',
                    fontSize: '0.875rem'
                }}>
                    {error || helperText}
                </small>
            )}
        </div>
    );
};

export default Select;
