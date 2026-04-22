import React from 'react';

const Card = ({ children, style = {}, className = "" }) => {
    return (
        <div 
            className={`custom-card ${className}`}
            style={{
                background: '#1e293b',
                borderRadius: '1.25rem',
                border: '1px solid #334155',
                padding: '1.5rem',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                ...style
            }}
        >
            {children}
        </div>
    );
};

export default Card;
