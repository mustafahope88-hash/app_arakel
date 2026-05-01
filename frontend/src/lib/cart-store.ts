import { create } from 'zustand';

export interface CartItem {
  productId: number;
  name: string;
  price: number;
  quantity: number;
  imageUrl: string | null;
}

interface CartState {
  items: CartItem[];
  discount: number;
  paymentMethod: 'cash' | 'card';
  addItem: (product: Omit<CartItem, 'quantity'>) => void;
  removeItem: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  clearCart: () => void;
  setDiscount: (discount: number) => void;
  setPaymentMethod: (method: 'cash' | 'card') => void;
  getSubtotal: () => number;
  getTotal: () => number;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  discount: 0,
  paymentMethod: 'cash',

  addItem: (product) => {
    const items = get().items;
    const existing = items.find((item) => item.productId === product.productId);

    if (existing) {
      set({
        items: items.map((item) =>
          item.productId === product.productId
            ? { ...item, quantity: item.quantity + 1 }
            : item
        ),
      });
    } else {
      set({ items: [...items, { ...product, quantity: 1 }] });
    }
  },

  removeItem: (productId) => {
    set({ items: get().items.filter((item) => item.productId !== productId) });
  },

  updateQuantity: (productId, quantity) => {
    if (quantity <= 0) {
      set({ items: get().items.filter((item) => item.productId !== productId) });
    } else {
      set({
        items: get().items.map((item) =>
          item.productId === productId ? { ...item, quantity } : item
        ),
      });
    }
  },

  clearCart: () => {
    set({ items: [], discount: 0, paymentMethod: 'cash' });
  },

  setDiscount: (discount) => {
    set({ discount: Math.max(0, discount) });
  },

  setPaymentMethod: (paymentMethod) => {
    set({ paymentMethod });
  },

  getSubtotal: () => {
    return get().items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  },

  getTotal: () => {
    const subtotal = get().getSubtotal();
    return subtotal - get().discount;
  },
}));