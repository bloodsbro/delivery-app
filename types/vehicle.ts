export interface Vehicle {
  id: string;
  type: 'car' | 'motorcycle' | 'van' | 'truck' | 'bicycle' | 'scooter'; // Тип транспортного засобу
  model: string;
  licensePlate: string; // Номерний знак
  capacity: number; // Вантажопідйомність або об'єм, наприклад, в кг або м³
  status: 'available' | 'in_delivery' | 'maintenance' | 'offline' | 'busy'; // Статус: доступний, в доставці, на ТО
  currentLat?: number;
  currentLng?: number;
  lastLocationUpdate?: string;
  driverName?: string; // Ім'я водія
}
