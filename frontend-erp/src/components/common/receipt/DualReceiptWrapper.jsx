import React from 'react';
import './receipt.css';

const DualReceiptWrapper = ({ children, title }) => {
    // Clone children to inject props if needed, though mostly controlled by CSS
    // We render the children twice. 
    // The second time we might want to pass a prop like "isCopy" if the child supports it to change text.

    // Check if children is a valid React element before cloning


    return (
        <div className="dual-receipt-container">
            {/* Original - Top Half */}
            <div className="receipt-half original">
                <div className="watermark-text">ORIGINAL</div>
                <div className="receipt-content-wrapper">
                    {children}
                </div>
            </div>

            {/* Cut Line */}
            <div className="cut-line">
                <span className="cut-icon">✂</span>
            </div>

            {/* Copy - Bottom Half */}
            <div className="receipt-half copy">
                <div className="watermark-text">CARGO / COPIA</div>
                <div className="receipt-content-wrapper">
                    {children}
                </div>
            </div>
        </div>
    );
};

export default DualReceiptWrapper;
