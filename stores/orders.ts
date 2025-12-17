import { defineStore } from 'pinia';
import type { Order, NewOrder } from '~/types/order';

interface OrderState {
  orders: Order[];
}

export const useOrderStore = defineStore('orders', {
  state: (): OrderState => ({
    orders: [],
  }),
  actions: {
    async fetchOrders() {
      const data = await $fetch<Order[]>('/api/orders');
      this.orders = data;
    },
    async createOrder(newOrder: NewOrder & { deliveryLat?: number; deliveryLng?: number }) {
      const { data, error } = await useFetch<Order>('/api/orders/create', {
        method: 'POST',
        body: newOrder,
      });
      if (data.value) {
        this.orders.push(data.value);
        return data.value;
      }
      if (error.value) {
        console.error('Error creating order:', error.value);
        throw error.value;
      }
    },
    async updateOrderStatus(orderId: string, status: Order['status']) {
      const { data, error } = await useFetch<Order>(`/api/orders/${orderId}`, {
        method: 'PUT',
        body: { status },
      });
      if (data.value) {
        const index = this.orders.findIndex(order => order.id === orderId);
        if (index !== -1) {
          this.orders[index] = data.value;
        }

        return data.value;
      }
      if (error.value) {
        console.error('Error updating order status:', error.value);
        throw error.value;
      }
    },
  },
});
