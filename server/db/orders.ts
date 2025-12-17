import type { Order } from '~/types/order'

export const orders: Order[] = [
  {
    id: '1',
    status: 'pending',
    customerAddress: 'Україна, Запоріжжя, вул Мирослава Симчича 55 5',
    customerName: 'Іван Іванов',
    items: [
      { name: 'test', price: 100, quantity: 1 },
      { name: 'test 1', price: 125, quantity: 2 },
    ],
    totalAmount: 100 + 125 * 2,
    trackingNumber: '12324',
    customerPhone: '+380997379523',
    createdAt: new Date().toLocaleString(),
  },
  {
    id: '2',
    status: 'processing',
    customerAddress: 'Україна, Запоріжжя, вул Мирослава Симчича 55 5',
    customerName: 'Іван Іванов',
    items: [
      { name: 'test', price: 100, quantity: 1 },
      { name: 'test 1', price: 125, quantity: 2 },
    ],
    totalAmount: 100 + 125 * 2,
    trackingNumber: '12324',
    customerPhone: '+380997379523',
    createdAt: new Date().toLocaleString(),
  },
  {
    id: '3',
    status: 'cancelled',
    customerAddress: 'Україна, Запоріжжя, вул Мирослава Симчича 55 5',
    customerName: 'Іван Іванов',
    items: [
      { name: 'test', price: 100, quantity: 1 },
      { name: 'test 1', price: 125, quantity: 2 },
    ],
    totalAmount: 100 + 125 * 2,
    trackingNumber: '12324',
    customerPhone: '+380997379523',
    createdAt: new Date().toLocaleString(),
  },
  {
    id: '4',
    status: 'shipped',
    customerAddress: 'Україна, Запоріжжя, вул Мирослава Симчича 55 5',
    customerName: 'Іван Іванов',
    items: [
      { name: 'test', price: 100, quantity: 1 },
      { name: 'test 1', price: 125, quantity: 2 },
    ],
    totalAmount: 100 + 125 * 2,
    trackingNumber: '12324',
    customerPhone: '+380997379523',
    createdAt: new Date().toLocaleString(),
  },
  {
    id: '5',
    status: 'delivered',
    customerAddress: 'Україна, Запоріжжя, вул Мирослава Симчича 55 5',
    customerName: 'Іван Іванов',
    items: [
      { name: 'test', price: 100, quantity: 1 },
      { name: 'test 1', price: 125, quantity: 2 },
    ],
    totalAmount: 100 + 125 * 2,
    trackingNumber: '12324',
    customerPhone: '+380997379523',
    createdAt: new Date().toLocaleString(),
  },
]