export interface Order {
  id: string;
  customerName: string;
  customerAddress: string;
  customerPhone: string;
  items: Array<{ name: string; quantity: number; price: number }>;
  totalAmount: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  createdAt: string;
  trackingNumber?: string; // Опциональный номер отслеживания
  deliveryLat?: number;
  deliveryLng?: number;
  courierId?: string;
  courierName?: string;
  courierLat?: number;
  courierLng?: number;
  weight?: number;
  volume?: number;
}

export interface NewOrder {
  customerName: string;
  customerAddress: string;
  customerPhone: string;
  items: Array<{ name: string; quantity: number; price: number }>;
  deliveryLat?: number;
  deliveryLng?: number;
  weight?: number;
  volume?: number;
}
