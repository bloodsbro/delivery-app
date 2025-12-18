<template>
  <div class="border border-gray-800 rounded-xl p-6 shadow-lg bg-gray-900 hover:shadow-xl transition-shadow duration-300 relative text-gray-100">
    <div class="flex justify-between items-start mb-4">
      <div>
        <h3 class="text-xl font-extrabold text-gray-100 mb-1"><img src="@/assets/icons/edit.svg" style="width: 24px; height: 24px; display: inline" > Замовлення #{{ order.id }}</h3>
        <p class="text-sm text-gray-400">Створено: {{ new Date(order.createdAt).toLocaleString() }}</p>
      </div>
      <span :class="['px-3 py-1 rounded-full text-sm font-semibold', statusClass]">
        {{ statusDisplay }}
      </span>
    </div>
    
    <div class="grid grid-cols-1 md:grid-cols-2 gap-2 text-gray-300 text-sm mb-4">
      <p @click="showAdminControls && editUserF(order)"><strong>Клієнт:</strong> {{ order.customerName }} <img src="@/assets/icons/user.svg" style="width: 32px; height: 32px; display: inline" ></p>
      <p><strong>Телефон:</strong> <a :href="`tel:${order.customerPhone}`">{{ order.customerPhone }}</a></p>
      
      <p class="col-span-2"><strong>Адреса:</strong> {{ order.customerAddress }}
        <img src="@/assets/icons/map.svg" alt="Location" class="inline-block w-4 h-4 ml-1" style="width: 32px; height: 32px" >
      </p>
      <p class="col-span-2 text-lg font-bold text-gray-100"><strong>Сума:</strong> {{ order.totalAmount.toFixed(2) }} грн</p>
      <p v-if="order.weight != null" class=""><strong>Вага:</strong> {{ Number(order.weight).toFixed(2) }} кг</p>
      <p v-if="order.volume != null" class=""><strong>Обʼєм:</strong> {{ Number(order.volume).toFixed(3) }} м³</p>
      <p v-if="order.trackingNumber" class=""><strong>ТТН:</strong> {{ order.trackingNumber }}</p>
      <p class="col-span-2"><strong>Кур'єр:</strong> {{ order.courierName || '— Не призначено —' }}</p>
    </div>
    
    <Disclosure v-slot="{ open }">
      <DisclosureButton class="flex w-full justify-between rounded-lg bg-gray-800 px-4 py-2 text-left text-sm font-medium text-gray-100 hover:bg-gray-700 focus:outline-none focus-visible:ring focus-visible:ring-purple-600 focus-visible:ring-opacity-75">
        <span>Деталі замовлення ({{ order.items.length }} товарів)</span>
        <svg :class="[open ? 'rotate-180 transform' : '', 'h-5 w-5 text-gray-500 transition-transform duration-200']" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
        </svg>
      </DisclosureButton>
      <DisclosurePanel class="px-4 pt-4 pb-2 text-sm text-gray-300">
        <h4 class="font-semibold mb-2">Склад замовлення:</h4>
        <ul class="list-disc list-inside space-y-1">
          <li v-for="(item, i) in order.items" :key="i" style="display: flex; justify-content: space-between;">
            {{ item.name }} ({{ item.quantity }} шт. x {{ item.price.toFixed(2) }} грн) = {{ (item.quantity * item.price).toFixed(2) }} грн
            <img v-if="showAdminControls" src="@/assets/icons/close.svg" style="width: 16px; height: 16px; display: inline" class="cursor-pointer" >
          </li>
        </ul>
      </DisclosurePanel>
    </Disclosure>
    
    <div v-if="showAdminControls" class="mt-6 pt-4 border-t border-gray-800">
      <h4 class="font-semibold text-gray-100 mb-2">Редагування замовлення:</h4>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
        <div>
          <label class="block text-xs font-medium text-gray-400 mb-1">Кур'єр</label>
          <select v-model="selectedCourier" class="w-full border border-gray-700 bg-gray-800 text-gray-100 rounded p-2">
            <option :value="''">— Не призначено —</option>
            <option v-for="c in couriers" :key="c.id" :value="c.id">{{ c.user?.first_name }} {{ c.user?.last_name }}</option>
          </select>
          <button class="mt-2 w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700" @click="assignCourier">Призначити кур'єра</button>
        </div>
        <div>
          <label class="block text-xs font-medium text-gray-400 mb-1">Адреса доставки</label>
          <div class="relative">
            <input v-model="addressEdit" class="w-full border border-gray-700 rounded p-2 bg-gray-800 text-gray-100 placeholder-gray-400" @input="onAddressInput" @focus="showAddressDropdown = true" @blur="onAddressBlur" >
            <div v-if="showAddressDropdown && addressSuggestions.length" class="absolute z-20 mt-1 w-full rounded-md bg-gray-900 text-gray-100 shadow-lg border border-gray-700 max-h-48 overflow-auto">
              <div
                v-for="s in addressSuggestions"
                :key="s.place_id"
                class="px-3 py-2 text-sm hover:bg-gray-700 cursor-pointer"
                @mousedown.prevent="applySuggestion(s)"
              >
                {{ s.display_name }}
              </div>
            </div>
          </div>
          <button class="mt-2 w-full bg-green-600 text-white p-2 rounded hover:bg-green-700" @click="saveAddress">Зберегти адресу</button>
        </div>
      </div>
    </div>

    <div v-if="allowStatusEdit" class="mt-6 pt-4 border-t border-gray-800">
      <h4 class="font-semibold text-gray-100 mb-2">Змінити статус:</h4>
      <Listbox v-model="selectedStatus">
        <div class="relative mt-1">
          <ListboxButton class="relative w-full cursor-default rounded-lg bg-gray-900 text-gray-100 py-2 pl-3 pr-10 text-left shadow-md focus:outline-none focus-visible:border-indigo-500 focus-visible:ring-2 focus-visible:ring-indigo-500 sm:text-sm">
            <span class="block truncate">{{ statusOptions.find(opt => opt.value === selectedStatus)?.label }}</span>
            <span class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
              <svg class="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fill-rule="evenodd" d="M10 3a.75.75 0 01.55.22L14.24 7.25a.75.75 0 01-1.06 1.06L10 5.31l-3.19 3.01a.75.75 0 01-1.06-1.06l3.69-3.47A.75.75 0 0110 3z" clip-rule="evenodd" />
              </svg>
            </span>
          </ListboxButton>

          <transition
            leave-active-class="transition ease-in duration-100"
            leave-from-class="opacity-100"
            leave-to-class="opacity-0"
          >
            <ListboxOptions class="absolute mt-1 max-h-60 w-full overflow-auto rounded-md bg-gray-900 py-1 text-base shadow-lg ring-1 ring-gray-700 focus:outline-none sm:text-sm z-10 text-gray-100">
              <ListboxOption
                v-for="statusOption in statusOptions"
                :key="statusOption.value"
                v-slot="{ active, selected }"
                :value="statusOption.value"
                as="template"
              >
                <li
                  :class="[
                    active ? 'bg-gray-800 text-gray-100' : 'text-gray-100',
                    'relative cursor-default select-none py-2 pl-10 pr-4',
                  ]"
                >
                  <span :class="[selected ? 'font-medium' : 'font-normal', 'block truncate']">{{ statusOption.label }}</span>
                  <span v-if="selected" class="absolute inset-y-0 left-0 flex items-center pl-3 text-indigo-400">
                    <svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fill-rule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.052-.143z" clip-rule="evenodd" />
                    </svg>
                  </span>
                </li>
              </ListboxOption>
            </ListboxOptions>
          </transition>
        </div>
      </Listbox>
      <button class="mt-4 w-full bg-indigo-600 text-white p-2.5 rounded-md hover:bg-indigo-700 transition ease-in-out duration-150 font-medium shadow" @click="updateStatus">
        Оновити статус
      </button>
    </div>
    
    <TransitionRoot appear :show="editUserToggle" as="template">
      <Dialog as="div" class="relative z-10" @close="closeEditUserDialog">
        <TransitionChild
          as="template"
          enter="duration-300 ease-out"
          enter-from="opacity-0"
          enter-to="opacity-100"
          leave="duration-200 ease-in"
          leave-from="opacity-100"
          leave-to="opacity-0"
        >
          <div class="fixed inset-0 bg-black bg-opacity-25" />
        </TransitionChild>
        
        <div class="fixed inset-0 overflow-y-auto">
          <div class="flex min-h-full items-center justify-center p-4 text-center">
            <TransitionChild
              as="template"
              enter="duration-300 ease-out"
              enter-from="opacity-0 scale-95"
              enter-to="opacity-100 scale-100"
              leave="duration-200 ease-in"
              leave-from="opacity-100 scale-100"
              leave-to="opacity-0 scale-95"
            >
              <DialogPanel class="w-full max-w-md transform overflow-hidden rounded-2xl bg-gray-900 p-6 text-left align-middle shadow-xl transition-all text-gray-100">
                <DialogTitle as="h3" class="text-lg font-medium leading-6 text-gray-100">
                  Редагування клієнта
                </DialogTitle>
                
                <div class="mt-4 space-y-3">
                  <input v-model="editCustomerName" class="w-full border border-gray-700 rounded p-2 bg-gray-800 text-gray-100 placeholder-gray-400" placeholder="Ім'я та прізвище" >
                  <input v-model="editCustomerPhone" class="w-full border border-gray-700 rounded p-2 bg-gray-800 text-gray-100 placeholder-gray-400" placeholder="Телефон" >
                </div>
                
                <div class="mt-4 flex justify-end gap-3">
                  <button
                    type="button"
                    class="inline-flex justify-center rounded-md border border-transparent bg-gray-700 px-4 py-2 text-sm font-medium text-gray-100 hover:bg-gray-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-500"
                    @click="closeEditUserDialog"
                  >
                    Скасувати
                  </button>
                  <button
                    type="button"
                    class="inline-flex justify-center rounded-md border border-transparent bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2"
                    @click="saveCustomer"
                  >
                    Зберегти
                  </button>
                </div>
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </TransitionRoot>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import type { Order } from '~/types/order';
import {
  Disclosure,
  DisclosureButton,
  DisclosurePanel,
  Listbox,
  ListboxButton,
  ListboxOptions,
  ListboxOption, DialogPanel, DialogTitle, Dialog, TransitionRoot, TransitionChild,
} from '@headlessui/vue';

const editUserToggle = ref(false)

const editCustomerName = ref('')
const editCustomerPhone = ref('')

const editUserF = (order: Order) => {
  editCustomerName.value = order.customerName || ''
  editCustomerPhone.value = order.customerPhone || ''
  editUserToggle.value = true
}

const closeEditUserDialog = () => {
  editUserToggle.value = false;
};

const saveCustomer = async () => {
  const payload = { name: editCustomerName.value, phone: editCustomerPhone.value };
  await useFetch(`/api/admin/orders/${props.order.id}`, { method: 'PUT', body: payload })
  emit('order-updated', { id: props.order.id, ...payload });
  editUserToggle.value = false
}

const props = defineProps<{
  order: Order;
  showAdminControls?: boolean;
  allowStatusEdit?: boolean;
  selectable?: boolean;
  selected?: boolean;
}>();

const emit = defineEmits(['update-status', 'toggle-selection', 'order-updated']);

const selectedStatus = ref(props.order.status);
const addressEdit = ref(props.order.customerAddress)
const addressLat = ref<number | undefined>(props.order.deliveryLat)
const addressLng = ref<number | undefined>(props.order.deliveryLng)
const addressSuggestions = ref<Array<{ place_id: string; display_name: string; lat: string; lon: string }>>([])
const showAddressDropdown = ref(false)
const selectedCourier = ref('')
const couriers = ref<Array<{ id: string; user: { first_name: string; last_name: string } }>>([])
onMounted(async () => {
  if (props.showAdminControls) {
    const data = await $fetch<Array<{ id: string; user: { first_name: string; last_name: string } }>>('/api/couriers')
    couriers.value = data ?? []
  }
  selectedCourier.value = props.order.courierId || ''
})

const statusOptions = [
  { label: 'Очікує', value: 'pending' },
  { label: 'В обробці', value: 'processing' },
  { label: 'Відправлено кур\'єром', value: 'shipped' },
  { label: `Доставлено`, value: 'delivered' },
  { label: 'Скасовано користувачем', value: 'cancelled' },
];

const statusDisplay = computed(() => {
  return statusOptions.find(opt => opt.value === props.order.status)?.label || props.order.status;
});

const statusClass = computed(() => {
  switch (props.order.status) {
    case 'pending': return 'bg-yellow-900/40 text-yellow-300';
    case 'processing': return 'bg-blue-900/40 text-blue-300';
    case 'shipped': return 'bg-purple-900/40 text-purple-300';
    case 'delivered': return 'bg-green-900/40 text-green-300';
    case 'cancelled': return 'bg-red-900/40 text-red-300';
    default: return 'bg-gray-800 text-gray-300';
  }
});

const updateStatus = () => {
  emit('update-status', { orderId: props.order.id, status: selectedStatus.value });
};

const assignCourier = async () => {
  if (!selectedCourier.value) return
  await useFetch('/api/admin/assign', { method: 'POST', body: { orderId: props.order.id, courierId: selectedCourier.value } })
  const picked = couriers.value.find(c => String(c.id) === String(selectedCourier.value))
  if (picked) {
    emit('order-updated', { id: props.order.id, courierId: String(picked.id), courierName: `${picked.user?.first_name || ''} ${picked.user?.last_name || ''}`.trim() })
  }
  selectedStatus.value = 'processing'
  emit('order-updated', { id: props.order.id, status: 'processing' })
  alert('Курʼєра призначено')
}

const saveAddress = async () => {
  await useFetch(`/api/admin/orders/${props.order.id}`, { method: 'PUT', body: { address: addressEdit.value, deliveryLat: addressLat.value, deliveryLng: addressLng.value } })
  emit('order-updated', { id: props.order.id, customerAddress: addressEdit.value, deliveryLat: addressLat.value, deliveryLng: addressLng.value })
  alert('Адресу збережено')
}

let addrTimer: NodeJS.Timeout | null = null
const onAddressInput = () => {
  if (addrTimer) clearTimeout(addrTimer)
  const q = String(addressEdit.value || '').trim()
  if (q.length < 3) { addressSuggestions.value = []; return }
  addrTimer = setTimeout(async () => {
    try {
      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=5&addressdetails=1&countrycodes=ua&accept-language=uk`
      const res = await fetch(url, { headers: { 'Accept': 'application/json' } })
      const json = await res.json()
      addressSuggestions.value = Array.isArray(json) ? json : []
      showAddressDropdown.value = true
    } catch {
      addressSuggestions.value = []
    }
  }, 250)
}

const applySuggestion = (s: { display_name: string; lat: string; lon: string }) => {
  addressEdit.value = s.display_name
  const lat = Number(s.lat)
  const lon = Number(s.lon)
  addressLat.value = Number.isFinite(lat) ? lat : undefined
  addressLng.value = Number.isFinite(lon) ? lon : undefined
  showAddressDropdown.value = false
}

const onAddressBlur = () => {
  setTimeout(() => { showAddressDropdown.value = false }, 100)
}
</script>
