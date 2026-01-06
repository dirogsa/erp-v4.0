import React from 'react';
import './receipt.css';

const DualReceiptWrapper = ({ children, format = 'A4_DUAL' }) => {
    const isSingle = format === 'A5_SINGLE';

    return (
        <div className={isSingle ? "single-receipt-container" : "dual-receipt-container"}>
            {/* Original Copy (or Single Copy) */}
            <div className={isSingle ? "receipt-half single" : "receipt-half original"}>
                <div className="watermark-text">{isSingle ? "" : "ORIGINAL"}</div>
                <div className="receipt-content-wrapper">
                    {children}
                </div>
            </div>

            {!isSingle && (
                <>
                    {/* Cut Line */}
                    <div className="cut-line" />

                    {/* Copy - Bottom Half */}
                    <div className="receipt-half copy">
                        <div className="watermark-text">CARGO / COPIA</div>
                        <div className="receipt-content-wrapper">
                            {children}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default DualReceiptWrapper;
