import React, { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
    const [cart, setCart] = useState(() => {
        const savedCart = localStorage.getItem('shop_cart');
        return savedCart ? JSON.parse(savedCart) : [];
    });

    useEffect(() => {
        localStorage.setItem('shop_cart', JSON.stringify(cart));
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

    const getItemPrice = (item) => {
        let discount = 0;
        if (item.quantity >= 24) discount = item.discount_24_pct || 0;
        else if (item.quantity >= 12) discount = item.discount_12_pct || 0;
        else if (item.quantity >= 6) discount = item.discount_6_pct || 0;

        const price = item.price || 0;
        return price * (1 - (discount / 100));
    };

    const cartTotal = cart.reduce((sum, item) => sum + (getItemPrice(item) * item.quantity), 0);
    const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

    return (
        <CartContext.Provider value={{
            cart,
            addToCart,
            removeFromCart,
            updateQuantity,
            clearCart,
            cartTotal,
            cartCount,
            getItemPrice
        }}>
            {children}
        </CartContext.Provider>
    );
};
