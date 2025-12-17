export interface Vehicle {
  id: string;
  type: 'car' | 'motorcycle' | 'van'; // Тип транспортного засобу
  model: string;
  licensePlate: string; // Номерний знак
  capacity: number; // Вантажопідйомність або об'єм, наприклад, в кг або м³
  status: 'available' | 'in_delivery' | 'maintenance'; // Статус: доступний, в доставці, на ТО
  currentLat?: number;
  currentLng?: number;
  lastLocationUpdate?: string;
  driverName?: string; // Ім'я водія
}
