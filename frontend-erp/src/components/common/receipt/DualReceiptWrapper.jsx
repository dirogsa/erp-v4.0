import React from 'react';
import './receipt.css';

const DualReceiptWrapper = ({ children, format = 'A4_DUAL', ...props }) => {
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
            // incluyendo format y los de conversión de moneda
            return React.cloneElement(child, { format, ...props });
        });
    };

    const childrenWithProps = injectProps(children);

    return (
        <div className={isSingle ? "single-receipt-container" : "dual-receipt-container"}>
            {/* Original Copy (or Single Copy) */}
            <div className={isSingle ? "receipt-half single" : "receipt-half original"}>
                <div className="watermark-text">
                    {isSingle ? (props.isCargo ? "CARGO" : "") : "ORIGINAL"}
                </div>
                <div className="receipt-content-wrapper">
                    {childrenWithProps}
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
                            {childrenWithProps}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default DualReceiptWrapper;
