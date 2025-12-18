<template>
  <form class="p-4 border border-gray-800 rounded-lg shadow-xl bg-gray-900 text-gray-100" @submit.prevent="openConfirmDialog">
    <h2 class="text-3xl font-extrabold text-gray-100 mb-6 text-center">Створити нове замовлення</h2>
    
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
      <div>
        <label for="customerName" class="block text-sm font-medium text-gray-400 mb-1">Ім'я клієнта</label>
        <input id="customerName" v-model="form.customerName" type="text" class="w-full border-gray-700 bg-gray-800 text-gray-100 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 p-2.5 transition ease-in-out duration-150 placeholder-gray-400" placeholder="Іван Іванов" required >
      </div>
      <div>
        <label for="customerPhone" class="block text-sm font-medium text-gray-400 mb-1">Телефон клієнта</label>
        <input id="customerPhone" v-model="form.customerPhone" type="tel" class="w-full border-gray-700 bg-gray-800 text-gray-100 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 p-2.5 transition ease-in-out duration-150 placeholder-gray-400" placeholder="+380XXXXXXXXX" required @input="onPhoneInput">
        <div v-if="matches.length" class="mt-2 border border-gray-700 rounded bg-gray-900 text-gray-100 shadow p-2 text-sm">
          <div v-for="m in matches" :key="m.id" class="flex justify-between items-center py-1">
            <span>{{ m.firstName }} {{ m.lastName }} · {{ m.phone }}</span>
            <button type="button" class="px-2 py-1 rounded bg-blue-600 text-white" @click="applyMatch(m)">Заповнити</button>
          </div>
        </div>
      </div>
    </div>
    
    <div class="mb-6">
      <label for="customerAddress" class="block text-sm font-medium text-gray-400 mb-1">Адреса доставки</label>
      <div class="relative">
        <input id="customerAddress" v-model="form.customerAddress" type="text" class="w-full border-gray-700 bg-gray-800 text-gray-100 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 p-2.5 transition ease-in-out duration-150 placeholder-gray-400" placeholder="Вулиця, будинок, квартира, місто, індекс" required @input="onAddressInput" @focus="showAddr = true" @blur="onAddressBlur">
        <div v-if="showAddr && addrSuggestions.length" class="absolute z-20 mt-1 w-full rounded-md bg-gray-900 text-gray-100 shadow-lg border border-gray-700 max-h-48 overflow-auto">
          <div
            v-for="s in addrSuggestions"
            :key="s.place_id"
            class="px-3 py-2 text-sm hover:bg-gray-700 cursor-pointer"
            @mousedown.prevent="applySuggestion(s)"
          >
            {{ s.display_name }}
          </div>
        </div>
      </div>
    </div>

    <div class="mb-6">
      <h3 class="text-xl font-semibold text-gray-100 mb-2">Розмір посилки</h3>
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label for="pkgLen" class="block text-xs font-medium text-gray-400 mb-1">Довжина (см)</label>
          <input id="pkgLen" v-model.number="lengthCm" type="number" min="0" step="0.1" class="w-full border-gray-700 bg-gray-800 text-gray-100 rounded-md shadow-sm p-2 text-sm" @input="recalcVolume">
        </div>
        <div>
          <label for="pkgWid" class="block text-xs font-medium text-gray-400 mb-1">Ширина (см)</label>
          <input id="pkgWid" v-model.number="widthCm" type="number" min="0" step="0.1" class="w-full border-gray-700 bg-gray-800 text-gray-100 rounded-md shadow-sm p-2 text-sm" @input="recalcVolume">
        </div>
        <div>
          <label for="pkgHei" class="block text-xs font-medium text-gray-400 mb-1">Висота (см)</label>
          <input id="pkgHei" v-model.number="heightCm" type="number" min="0" step="0.1" class="w-full border-gray-700 bg-gray-800 text-gray-100 rounded-md shadow-sm p-2 text-sm" @input="recalcVolume">
        </div>
        <div>
          <label for="pkgWeight" class="block text-xs font-medium text-gray-400 mb-1">Вага (кг)</label>
          <input id="pkgWeight" v-model.number="form.weight" type="number" min="0" step="0.01" class="w-full border-gray-700 bg-gray-800 text-gray-100 rounded-md shadow-sm p-2 text-sm">
        </div>
      </div>
      <div class="mt-2 text-sm text-gray-400">Обʼєм (м³): <span class="text-gray-100">{{ (form.volume || 0).toFixed(3) }}</span></div>
    </div>
    
    <h3 class="text-xl font-semibold text-gray-100 mb-4 border-b border-gray-800 pb-2">Товари в замовленні</h3>
    <div v-for="(item, index) in form.items" :key="index" class="flex flex-col md:flex-row gap-4 mb-4 p-3 border border-gray-800 rounded-md bg-gray-900 shadow-sm">
      <div class="flex-grow">
        <label :for="`itemName-${index}`" class="block text-xs font-medium text-gray-400 mb-1">Назва товару</label>
        <input :id="`itemName-${index}`" v-model="item.name" type="text" class="w-full border-gray-700 bg-gray-800 text-gray-100 rounded-md shadow-sm p-2 text-sm placeholder-gray-400" placeholder="Назва товару" required >
      </div>
      <div class="w-full md:w-32">
        <label :for="`itemQuantity-${index}`" class="block text-xs font-medium text-gray-400 mb-1">Кількість</label>
        <input :id="`itemQuantity-${index}`" v-model.number="item.quantity" type="number" class="w-full border-gray-700 bg-gray-800 text-gray-100 rounded-md shadow-sm p-2 text-sm" min="1" required >
      </div>
      <div class="w-full md:w-32">
        <label :for="`itemPrice-${index}`" class="block text-xs font-medium text-gray-400 mb-1">Ціна (грн)</label>
        <input :id="`itemPrice-${index}`" v-model.number="item.price" type="number" class="w-full border-gray-700 bg-gray-800 text-gray-100 rounded-md shadow-sm p-2 text-sm" min="0.01" step="0.01" required >
      </div>
      <button type="button" class="self-end md:self-auto flex-shrink-0 p-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition ease-in-out duration-150 text-sm font-medium" @click="removeItem(index)">
        Видалити
      </button>
    </div>
    <button type="button" class="mt-2 p-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition ease-in-out duration-150 text-sm font-medium shadow" @click="addItem">
      Додати товар
    </button>
    
    <button type="submit" class="mt-8 w-full bg-green-600 text-white p-3.5 rounded-lg hover:bg-green-700 transition ease-in-out duration-150 text-lg font-semibold shadow-lg">
      Створити замовлення
    </button>
  </form>
  
  <TransitionRoot appear :show="isConfirmDialogOpen" as="template">
    <Dialog as="div" class="relative z-10" @close="closeConfirmDialog">
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
                Підтвердження створення замовлення
              </DialogTitle>
              <div class="mt-2">
                <p class="text-sm text-gray-400">
                  Ви впевнені, що хочете створити це замовлення? Перевірте введені дані.
                </p>
                <div class="mt-4 p-3 bg-gray-800 rounded-md text-sm text-gray-300">
                  <p><strong>Клієнт:</strong> {{ form.customerName }}</p>
                  <p><strong>Адреса:</strong> {{ form.customerAddress }}</p>
                  <p><strong>Телефон:</strong> {{ form.customerPhone }}</p>
                  <p><strong>Товарів:</strong> {{ form.items.length }}</p>
                  <p><strong>Загальна сума:</strong> {{ calculateTotalAmount.toFixed(2) }} грн</p>
                  <p v-if="form.weight != null"><strong>Вага:</strong> {{ Number(form.weight).toFixed(2) }} кг</p>
                  <p v-if="form.volume != null"><strong>Обʼєм:</strong> {{ Number(form.volume).toFixed(3) }} м³</p>
                </div>
              </div>
              
              <div class="mt-4 flex justify-end gap-3">
                <button
                  type="button"
                  class="inline-flex justify-center rounded-md border border-transparent bg-gray-700 px-4 py-2 text-sm font-medium text-gray-100 hover:bg-gray-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-500"
                  @click="closeConfirmDialog"
                >
                  Скасувати
                </button>
                <button
                  type="button"
                  class="inline-flex justify-center rounded-md border border-transparent bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2"
                  @click="submitOrderConfirmed"
                >
                  Підтвердити та створити
                </button>
              </div>
            </DialogPanel>
          </TransitionChild>
        </div>
      </div>
    </Dialog>
  </TransitionRoot>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useOrderStore } from '~/stores/orders';
import type { NewOrder } from '~/types/order';
import {
  TransitionRoot,
  TransitionChild,
  Dialog,
  DialogPanel,
  DialogTitle,
} from '@headlessui/vue';

const orderStore = useOrderStore();

const form = ref<NewOrder>({
  customerName: '',
  customerAddress: '',
  customerPhone: '',
  items: [{ name: '', quantity: 1, price: 0 }],
  weight: undefined,
  volume: undefined,
});

const isConfirmDialogOpen = ref(false);
const addrSuggestions = ref<Array<{ place_id: string; display_name: string; lat: string; lon: string }>>([])
const showAddr = ref(false)
const lat = ref<number | undefined>(undefined)
const lng = ref<number | undefined>(undefined)
const lengthCm = ref<number | undefined>(undefined)
const widthCm = ref<number | undefined>(undefined)
const heightCm = ref<number | undefined>(undefined)

const calculateTotalAmount = computed(() => {
  return form.value.items.reduce((sum, item) => sum + item.quantity * item.price, 0);
});

const addItem = () => {
  form.value.items.push({ name: '', quantity: 1, price: 0 });
};

const removeItem = (index: number) => {
  if (form.value.items.length > 1) { 
    form.value.items.splice(index, 1);
  } else {
    alert('Необхідно мати хоча б один товар у замовленні.');
  }
};

const openConfirmDialog = () => {
  isConfirmDialogOpen.value = true;
};

const closeConfirmDialog = () => {
  isConfirmDialogOpen.value = false;
};

const submitOrderConfirmed = async () => {
  closeConfirmDialog();
  try {
    const createdOrder = await orderStore.createOrder({ ...form.value, deliveryLat: lat.value, deliveryLng: lng.value });
    alert(`Замовлення #${createdOrder?.id.slice(0,8)} успішно створено!`);

    form.value = {
      customerName: '',
      customerAddress: '',
      customerPhone: '',
      items: [{ name: '', quantity: 1, price: 0 }],
      weight: undefined,
      volume: undefined,
    };
    addrSuggestions.value = []
    showAddr.value = false
    lat.value = undefined
    lng.value = undefined
    lengthCm.value = undefined
    widthCm.value = undefined
    heightCm.value = undefined
  } catch (e) {
    alert('Помилка під час створення замовлення. Будь ласка, спробуйте ще раз.');
    console.error('Error creating order:', e);
  }
};

const matches = ref<Array<{ id: string; phone: string; firstName?: string; lastName?: string; address?: string }>>([])
let phoneTimer: NodeJS.Timeout
const onPhoneInput = () => {
  clearTimeout(phoneTimer)
  const q = form.value.customerPhone.trim()
  if (q.length < 7) { matches.value = []; return }
  phoneTimer = setTimeout(async () => {
    const { data } = await useFetch('/api/customers/search', { query: { q } })
    matches.value = (data.value as Array<{ id: string; phone: string; firstName?: string; lastName?: string; address?: string }>) || []
  }, 250)
}
const applyMatch = (m: { id: string; phone: string; firstName?: string; lastName?: string; address?: string }) => {
  form.value.customerName = `${m.firstName || ''} ${m.lastName || ''}`.trim()
  if (m.address) form.value.customerAddress = m.address
}

let addrTimer: NodeJS.Timeout
const onAddressInput = () => {
  clearTimeout(addrTimer)
  const q = form.value.customerAddress.trim()
  if (q.length < 3) { addrSuggestions.value = []; return }
  addrTimer = setTimeout(async () => {
    try {
      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=5&addressdetails=1&countrycodes=ua&accept-language=uk`
      const res = await fetch(url, { headers: { 'Accept': 'application/json' } })
      const json = await res.json()
      addrSuggestions.value = Array.isArray(json) ? json : []
      showAddr.value = true
    } catch {
      addrSuggestions.value = []
    }
  }, 250)
}
const applySuggestion = (s: { display_name: string; lat: string; lon: string }) => {
  form.value.customerAddress = s.display_name
  const plat = Number(s.lat)
  const plon = Number(s.lon)
  lat.value = Number.isFinite(plat) ? plat : undefined
  lng.value = Number.isFinite(plon) ? plon : undefined
  showAddr.value = false
}
const onAddressBlur = () => { setTimeout(() => { showAddr.value = false }, 100) }

const recalcVolume = () => {
  const l = Number(lengthCm.value)
  const w = Number(widthCm.value)
  const h = Number(heightCm.value)
  if ([l, w, h].every(x => Number.isFinite(x) && x > 0)) {
    form.value.volume = (l * w * h) / 1_000_000
  } else {
    form.value.volume = undefined
  }
}

</script>
