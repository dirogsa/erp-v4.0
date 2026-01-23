import React from 'react';
import './receipt.css';

const DualReceiptWrapper = ({ children, format = 'A4_DUAL', ...props }) => {
    const isFull = format === 'A4_FULL';
    const isSingle = format === 'A5_SINGLE';

    // Helper recursivo para inyectar props a través de divs contenedores
    const injectProps = (nodes) => {
        return React.Children.map(nodes, child => {
            if (!React.isValidElement(child)) return child;

            // Si es un elemento DOM (div, span, etc), bajamos recursivamente
            if (typeof child.type === 'string') {
                return React.cloneElement(child, {
                    children: injectProps(child.props.children)
                });
            }

            // Si es un Componente React (ej. ReceiptTemplate), inyectamos los props
            return React.cloneElement(child, { format, ...props });
        });
    };

    const childrenWithProps = injectProps(children);

    // Dynamic class based on format
    let containerClass = "dual-receipt-container";
    if (isSingle) containerClass = "single-receipt-container";
    if (isFull) containerClass = "full-receipt-container";

    return (
        <div className={containerClass}>
            {/* Original Copy (or Single Copy) */}
            <div className={isFull ? "receipt-half full" : (isSingle ? "receipt-half single" : "receipt-half original")}>
                <div className="watermark-text">
                    {isFull ? "" : (isSingle ? (props.isCargo ? "CARGO" : "") : "ORIGINAL")}
                </div>
                <div className="receipt-content-wrapper">
                    {childrenWithProps}
                </div>
            </div>

            {!isSingle && !isFull && (
                <>
                    {/* Cut Line */}
                    <div className="cut-line" />

                    {/* Copy - Bottom Half */}
                    <div className="receipt-half copy">
                        <div className="watermark-text">CARGO / COPIA</div>
                        <div className="receipt-content-wrapper">
                            {childrenWithProps}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default DualReceiptWrapper;
