import bcrypt from 'bcrypt';
import prisma from '~/lib/prisma';

async function main() {
  console.log('🌱 Начинаем заполнение базы данных тестовыми данными...');

  // Создание ролей
  const customerRole = await prisma.role.upsert({
    where: { name: 'customer' },
    update: {},
    create: {
      id: '550e8400-e29b-41d4-a716-446655440001',
      name: 'customer',
      description: 'Клієнт - може створювати замовлення',
      permissions: JSON.stringify(['create_order', 'view_own_orders', 'track_order'])
    }
  });

  const courierRole = await prisma.role.upsert({
    where: { name: 'courier' },
    update: {},
    create: {
      id: '550e8400-e29b-41d4-a716-446655440002',
      name: 'courier',
      description: 'Кур\'єр - може приймати та виконувати замовлення',
      permissions: JSON.stringify(['view_orders', 'update_order_status', 'update_location'])
    }
  });

  const adminRole = await prisma.role.upsert({
    where: { name: 'admin' },
    update: {},
    create: {
      id: '550e8400-e29b-41d4-a716-446655440003',
      name: 'admin',
      description: 'Адміністратор - повний доступ до системи',
      permissions: JSON.stringify(['*'])
    }
  });

  // Создание статусов
  const orderStatuses = [
    { name: 'pending', description: 'Очікує обробки', type: 'order', color: '#FFA500' },
    { name: 'confirmed', description: 'Підтверджено', type: 'order', color: '#32CD32' },
    { name: 'assigned', description: 'Призначено кур\'єру', type: 'order', color: '#1E90FF' },
    { name: 'picked_up', description: 'Забрано', type: 'order', color: '#9370DB' },
    { name: 'in_transit', description: 'В дорозі', type: 'order', color: '#FF6347' },
    { name: 'delivered', description: 'Доставлено', type: 'order', color: '#228B22', is_final: true },
    { name: 'cancelled', description: 'Скасовано', type: 'order', color: '#DC143C', is_final: true }
  ];

  for (const status of orderStatuses) {
    await prisma.status.upsert({
      where: { name: status.name },
      update: {},
      create: {
        id: `status-${status.name}`,
        ...status,
        type: status.type as any
      }
    });
  }

  // Создание пользователей
  const hashedPassword = await bcrypt.hash('password123', 10);

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@delivery.com' },
    update: {},
    create: {
      id: 'user-admin-001',
      email: 'admin@delivery.com',
      password_hash: hashedPassword,
      first_name: 'Адмін',
      last_name: 'Системи',
      phone: '+380501234567',
      role_id: adminRole.id,
      status: 'active'
    }
  });

  const courierUser1 = await prisma.user.upsert({
    where: { email: 'courier1@delivery.com' },
    update: {},
    create: {
      id: 'user-courier-001',
      email: 'courier1@delivery.com',
      password_hash: hashedPassword,
      first_name: 'Іван',
      last_name: 'Петров',
      phone: '+380501234568',
      role_id: courierRole.id,
      status: 'active'
    }
  });

  const courierUser2 = await prisma.user.upsert({
    where: { email: 'courier2@delivery.com' },
    update: {},
    create: {
      id: 'user-courier-002',
      email: 'courier2@delivery.com',
      password_hash: hashedPassword,
      first_name: 'Олександр',
      last_name: 'Сидоренко',
      phone: '+380501234569',
      role_id: courierRole.id,
      status: 'active'
    }
  });

  const customerUser1 = await prisma.user.upsert({
    where: { email: 'customer1@example.com' },
    update: {},
    create: {
      id: 'user-customer-001',
      email: 'customer1@example.com',
      password_hash: hashedPassword,
      first_name: 'Марія',
      last_name: 'Іванова',
      phone: '+380501234570',
      role_id: customerRole.id,
      status: 'active'
    }
  });

  const customerUser2 = await prisma.user.upsert({
    where: { email: 'customer2@example.com' },
    update: {},
    create: {
      id: 'user-customer-002',
      email: 'customer2@example.com',
      password_hash: hashedPassword,
      first_name: 'Андрій',
      last_name: 'Коваленко',
      phone: '+380501234571',
      role_id: customerRole.id,
      status: 'active'
    }
  });

  // Создание клиентов
  const customer1 = await prisma.customer.upsert({
    where: { user_id: customerUser1.id },
    update: {},
    create: {
      id: 'customer-001',
      user_id: customerUser1.id,
      company_name: null,
      address: 'вул. Хрещатик, 1, Київ, 01001',
      city: 'Київ',
      country: 'Україна'
    }
  });

  const customer2 = await prisma.customer.upsert({
    where: { user_id: customerUser2.id },
    update: {},
    create: {
      id: 'customer-002',
      user_id: customerUser2.id,
      company_name: 'ТОВ "Приклад"',
      address: 'вул. Мирослава Симчича, 55, Запоріжжя, 69000',
      city: 'Запоріжжя',
      country: 'Україна'
    }
  });

  // Создание транспортных средств
  const vehicles = [
    {
      id: 'vehicle-001',
      type: 'car',
      make: 'Skoda',
      model: 'Octavia',
      year: 2020,
      license_plate: 'AA1234EE',
      color: 'Білий',
      max_weight: 300,
      max_volume: 500,
      status: 'active'
    },
    {
      id: 'vehicle-002',
      type: 'truck',
      make: 'Ford',
      model: 'Transit',
      year: 2019,
      license_plate: 'BC5678KK',
      color: 'Синій',
      max_weight: 1500,
      max_volume: 2000,
      status: 'active'
    },
    {
      id: 'vehicle-003',
      type: 'motorcycle',
      make: 'Honda',
      model: 'CB500X',
      year: 2021,
      license_plate: 'CA9012MM',
      color: 'Червоний',
      max_weight: 50,
      max_volume: 100,
      status: 'active'
    }
  ];

  for (const vehicle of vehicles) {
    await prisma.vehicle.upsert({
      where: { 
        id: vehicle.id,
       },
      update: {},
      create: {
        ...vehicle,
        type: vehicle.type as any,
        status: vehicle.status as any
      }
    });
  }

  // Создание курьеров
  const courier1 = await prisma.courier.upsert({
    where: { user_id: courierUser1.id },
    update: {},
    create: {
      id: 'courier-001',
      user_id: courierUser1.id,
      vehicle_id: 'vehicle-001',
      status_id: 'status-pending',
      availability: 'available',
      current_latitude: 50.4501,
      current_longitude: 30.5234
    }
  });

  const courier2 = await prisma.courier.upsert({
    where: { user_id: courierUser2.id },
    update: {},
    create: {
      id: 'courier-002',
      user_id: courierUser2.id,
      vehicle_id: 'vehicle-002',
      status_id: 'status-pending',
      availability: 'available',
      current_latitude: 47.8388,
      current_longitude: 35.1396
    }
  });

  // Создание тестовых заказов
  const orders = [
    {
      id: 'order-001',
      order_number: 'ORD-2024-001',
      customer_id: customer1.id,
      status_id: 'status-pending',
      pickup_address: 'вул. Хрещатик, 1, Київ, 01001',
      pickup_latitude: 50.4501,
      pickup_longitude: 30.5234,
      pickup_contact_name: 'Марія Іванова',
      pickup_contact_phone: '+380501234570',
      delivery_address: 'вул. Володимирська, 10, Київ, 01001',
      delivery_latitude: 50.4485,
      delivery_longitude: 30.5255,
      delivery_contact_name: 'Петро Петренко',
      delivery_contact_phone: '+380501234572',
      items: JSON.stringify([
        { name: 'Документи', quantity: 1, weight: 0.1, description: 'Важливі документи' },
        { name: 'Подарунок', quantity: 1, weight: 0.5, description: 'Подарункова коробка' }
      ]),
      weight: 0.6,
      volume: 0.1,
      price: 150.00,
      payment_status: 'pending',
      special_instructions: 'Дзвонити за 15 хвилин до прибуття'
    },
    {
      id: 'order-002',
      order_number: 'ORD-2024-002',
      customer_id: customer2.id,
      status_id: 'status-confirmed',
      pickup_address: 'вул. Мирослава Симчича, 55, Запоріжжя, 69000',
      pickup_latitude: 47.8388,
      pickup_longitude: 35.1396,
      pickup_contact_name: 'Андрій Коваленко',
      pickup_contact_phone: '+380501234571',
      delivery_address: 'пр. Соборний, 100, Запоріжжя, 69000',
      delivery_latitude: 47.8560,
      delivery_longitude: 35.1056,
      delivery_contact_name: 'Олена Мельник',
      delivery_contact_phone: '+380501234573',
      items: JSON.stringify([
        { name: 'Комп\'ютерна техніка', quantity: 1, weight: 5.0, description: 'Ноутбук в упаковці' }
      ]),
      weight: 5.0,
      volume: 0.5,
      price: 300.00,
      payment_status: 'paid',
      special_instructions: 'Обережно з технікою'
    }
  ];

  for (const order of orders) {
    await prisma.order.upsert({
      where: { order_number: order.order_number },
      update: {},
      create: {
        ...order,
        payment_status: order.payment_status as any
      }
    });
  }

  console.log('✅ База даних успішно заповнена тестовими даними!');
  console.log('\n📊 Створено:');
  console.log('- 3 ролі (customer, courier, admin)');
  console.log('- 7 статусів замовлень');
  console.log('- 5 користувачів (1 адмін, 2 кур\'єра, 2 клієнта)');
  console.log('- 2 клієнта');
  console.log('- 3 транспортних засобів');
  console.log('- 2 кур\'єра');
  console.log('- 2 тестових замовлень');
  console.log('\n🔑 Тестові дані:');
  console.log('Адмін: admin@delivery.com / password123');
  console.log('Кур\'єр 1: courier1@delivery.com / password123');
  console.log('Кур\'єр 2: courier2@delivery.com / password123');
  console.log('Клієнт 1: customer1@example.com / password123');
  console.log('Клієнт 2: customer2@example.com / password123');
}

main()
  .catch((e) => {
    console.error('❌ Ошибка при заполнении базы данных:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });