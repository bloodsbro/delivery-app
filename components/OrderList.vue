<template>
  <div class="p-4">
    <h2 class="text-xl font-semibold mb-4">{{ title }}</h2>
    <div v-if="orders.length === 0" class="text-gray-600">
      Замовлень поки що немає.
    </div>
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <OrderItem
        v-for="order in getOrders"
        :key="order.id"
        :order="order"
        :show-admin-controls="showAdminControls"
        :allow-status-edit="props.allowStatusEdit ?? true"
        :selectable="selectable"
        :selected="selectedIds?.has(order.id)"
        @update-status="handleUpdateStatus"
        @toggle-selection="emit('toggle-selection', $event)"
        @order-updated="handleOrderUpdated"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Order } from '~/types/order';

const props = defineProps<{
  orders: Order[];
  title: string;
  showAdminControls?: boolean;
  isAllOrders: boolean;
  allowStatusEdit?: boolean;
  selectable?: boolean;
  selectedIds?: Set<string>;
}>();

const handleOrderUpdated = (payload: { id: string; rest: Partial<Order> }) => {
  const order = props.orders.find(o => o.id === payload.id);
  if (order) {
    Object.assign(order, payload.rest);
    emit('order-updated', payload);
  }
};

const emit = defineEmits(['update-status', 'toggle-selection', 'order-updated']);

const handleUpdateStatus = (payload: { orderId: string; status: Order['status'] }) => {
  emit('update-status', payload);
};

const getOrders = computed(() => {
  if (props.isAllOrders) {
    return props.orders;
  }
  
  return props.orders.filter(order => {
    return order.status !== 'cancelled' && order.status !== 'delivered'
  });
})
</script>
