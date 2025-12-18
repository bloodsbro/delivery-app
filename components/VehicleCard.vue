<template>
  <div class="bg-gray-900 text-gray-100 rounded-lg shadow-md p-6 border border-gray-800 flex flex-col justify-between h-full cursor-pointer" @click="$emit('select', vehicle)">
    <div>
      <h3 class="text-xl font-bold text-gray-100 mb-2 flex justify-between">{{ vehicle.model }} <img src="@/assets/icons/edit.svg" style="width: 24px; height: 24px" ></h3>
      <p class="text-sm text-gray-400 mb-4">
        <span :class="['px-2 py-1 rounded-full text-xs font-semibold', statusClass]">
          {{ statusDisplay }}
        </span>
      </p>
      
      <ul class="text-gray-300 text-sm space-y-1">
        <li><strong>Тип:</strong> {{ typeDisplay }}</li>
        <li><strong>Номерний знак:</strong> {{ vehicle.licensePlate }}</li>
        <li><strong>Вантажопідйомність:</strong> {{ vehicle.capacity }} кг</li>
        <li v-if="vehicle.driverName"><strong>Водій:</strong> {{ vehicle.driverName }}</li>
        <li v-if="statusDisplay === 'У доставці'"><strong>замовлення:</strong> 1,3,6,11</li>
      </ul>
    </div>
    <div v-if="showActions" class="mt-4 flex justify-end">
      <button class="text-sm px-3 py-1 rounded bg-red-600 text-white hover:bg-red-700" @click.stop="$emit('delete', vehicle.id)">Видалити</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Vehicle } from '~/types/vehicle';

const props = defineProps<{
  vehicle: Vehicle;
  showActions?: boolean;
}>();
defineEmits(['select', 'delete'])

const typeDisplay = computed(() => {
  switch (props.vehicle.type) {
    case 'car': return 'Легковий автомобіль';
    case 'motorcycle': return 'Мотоцикл';
    case 'van': return 'Фургон';
    default: return props.vehicle.type;
  }
});

const statusDisplay = computed(() => {
  switch (props.vehicle.status) {
    case 'available': return 'Доступний';
    case 'in_delivery': return 'У доставці';
    case 'maintenance': return 'На обслуговуванні';
    default: return props.vehicle.status;
  }
});

const statusClass = computed(() => {
  switch (props.vehicle.status) {
    case 'available': return 'bg-green-900/40 text-green-300';
    case 'in_delivery': return 'bg-blue-900/40 text-blue-300';
    case 'maintenance': return 'bg-red-900/40 text-red-300';
    default: return 'bg-gray-800 text-gray-300';
  }
});
</script>
