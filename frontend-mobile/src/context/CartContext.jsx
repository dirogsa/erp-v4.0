import React, { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
    const [cart, setCart] = useState(() => {
        const savedCart = localStorage.getItem('mobile_cart');
        return savedCart ? JSON.parse(savedCart) : [];
    });

    useEffect(() => {
        localStorage.setItem('mobile_cart', JSON.stringify(cart));
    }, [cart]);

    const addToCart = (product, quantity = 1) => {
        setCart((prevCart) => {
            const existingItem = prevCart.find(item => item.sku === product.sku);
            if (existingItem) {
                return prevCart.map(item =>
                    item.sku === product.sku
                        ? { ...item, quantity: item.quantity + quantity }
                        : item
                );
            }
            return [...prevCart, { ...product, quantity }];
        });
    };

    const removeFromCart = (sku) => {
        setCart((prevCart) => prevCart.filter(item => item.sku !== sku));
    };

    const updateQuantity = (sku, quantity) => {
        if (quantity < 1) return removeFromCart(sku);
        setCart((prevCart) =>
            prevCart.map(item =>
                item.sku === sku ? { ...item, quantity } : item
            )
        );
    };

    const clearCart = () => setCart([]);

    // Loyalty points logic
    const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

    // Total calculation for COMMERCIAL products with AUTOMATED VOLUME DISCOUNTS
    const cartTotal = cart.reduce((sum, item) => {
        if (item.type === 'MARKETING') return sum;
        
        // 1. Dynamic Volume Discount (Synchronized with Backend Tiers)
        let volMultiplier = 1;
        if (item.quantity >= 12) {
            volMultiplier = 1 - ((item.discount_12_pct || 0) / 100);
        } else if (item.quantity >= 6) {
            volMultiplier = 1 - ((item.discount_6_pct || 0) / 100);
        } else if (item.quantity >= 3) {
            volMultiplier = 1 - ((item.discount_3_pct || 0) / 100);
        }
        
        // 2. SKU-Specific Promotional Offer
        const promoMultiplier = 1 - ((item.promo_discount_pct || 0) / 100);
        
        return sum + (item.price * volMultiplier * promoMultiplier * item.quantity);
    }, 0);

    // Total points cost for MARKETING products (prizes)
    const cartPointsCost = cart.reduce((sum, item) => {
        if (item.type !== 'MARKETING') return sum;
        return sum + ((item.points_cost || 0) * item.quantity);
    }, 0);

    return (
        <CartContext.Provider value={{
            cart,
            addToCart,
            removeFromCart,
            updateQuantity,
            clearCart,
            cartTotal,
            cartPointsCost,
            cartCount
        }}>
            {children}
        </CartContext.Provider>
    );
};
