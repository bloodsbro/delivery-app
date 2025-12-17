# Test Suite Documentation

This directory contains comprehensive tests for the delivery management application.

## Test Structure

```
tests/
├── unit/                    # Unit tests for utilities and helpers
│   └── utils/
│       ├── orders.test.ts          ✅ Status mappings, order normalization
│       ├── vehicles.test.ts        ✅ Vehicle type/status mappings
│       ├── session.test.ts         ✅ Token sign/verify with secret tests
│       └── route-computation.test.ts ✅ Nearest neighbor algorithm (0/1/2/10 points)
│
├── integration/             # API integration tests
│   └── api/
│       ├── auth.test.ts            ✅ Login/me/logout with Joi validation
│       ├── orders.test.ts          ✅ Create/update/track orders with Joi
│       ├── admin.test.ts           📝 Admin endpoints (assign, unassigned)
│       ├── courier.test.ts         📝 Courier orders endpoint
│       └── vehicles.test.ts        📝 CRUD operations for vehicles
│
├── e2e/                     # End-to-end tests
│   ├── customer-flow.test.ts       📝 Login → Create order → Track TTN
│   ├── admin-flow.test.ts          📝 Login → View/assign → Manage users
│   ├── courier-flow.test.ts        📝 Login → View orders → Update status
│   └── map-interactions.test.ts    📝 Map rendering, markers, polylines
│
├── security/                # Security and authorization tests
│   ├── rbac.test.ts                📝 Role-based access control
│   ├── middleware.test.ts          📝 Auth middleware redirects
│   └── session-security.test.ts    📝 httpOnly, sameSite, secure flags
│
└── database/                # Database integrity tests
    ├── unique-constraints.test.ts  📝 TTN uniqueness
    ├── foreign-keys.test.ts        📝 Referential integrity
    └── migrations.test.ts          📝 Schema validation
```

## Completed Tests ✅

### Unit Tests
- **orders.test.ts**: 20+ tests covering:
  - `mapStatusDbToFront` - all status mappings
  - `mapStatusFrontToDb` - reverse mappings
  - `toFrontOrder` - items parsing, sum calculation, name extraction, coordinates

- **vehicles.test.ts**: 25+ tests covering:
  - Vehicle type mappings (car, motorcycle, van, truck, bicycle, scooter)
  - Vehicle status mappings (active, maintenance, inactive)
  - `toFrontVehicle` - driver names, capacity conversion

- **session.test.ts**: 30+ tests covering:
  - `signSession` - payload signing, nonce generation
  - `verifySession` - valid/invalid tokens, wrong secrets
  - Security scenarios (tampered data, invalid signatures)

- **route-computation.test.ts**: 20+ tests covering:
  - Edge cases (0, 1, 2 points)
  - Nearest neighbor algorithm for 3, 4, 10 points
  - Distance calculations, real-world coordinates

### Integration Tests
- **auth.test.ts**: 25+ tests covering:
  - POST /api/auth/login - Joi validation, bcrypt hashing
  - GET /api/auth/me - authenticated/unauthenticated access
  - POST /api/auth/logout - session clearing
  - Cookie security (httpOnly, sameSite, secure)

- **orders.test.ts**: 20+ tests covering:
  - POST /api/orders/create - Joi validation, TTN generation
  - PUT /api/orders/:id - status updates, DB transformation
  - GET /api/orders - list with normalization
  - GET /api/track/:ttn - tracking by TTN (404 cases)

## Tests To Be Created 📝

### Integration Tests

#### admin.test.ts
```typescript
describe('Admin API Tests', () => {
  describe('GET /api/admin/orders/unassigned', () => {
    it('should require admin role')
    it('should return unassigned orders')
    it('should return 403 for non-admin')
  })

  describe('POST /api/admin/assign', () => {
    it('should assign courier to order (Joi validation)')
    it('should update order and delivery statuses')
    it('should fail with invalid courier/order ID')
  })

  describe('GET /api/admin/users', () => {
    it('should list all users')
    it('should include role information')
  })
})
```

#### courier.test.ts
```typescript
describe('Courier API Tests', () => {
  describe('GET /api/courier/orders', () => {
    it('should return orders assigned to courier')
    it('should return 403 without courier role')
    it('should include delivery details')
  })
})
```

#### vehicles.test.ts
```typescript
describe('Vehicles API Tests', () => {
  describe('GET /api/vehicles', () => {
    it('should list all vehicles')
  })

  describe('POST /api/vehicles', () => {
    it('should create vehicle with valid data (Joi)')
    it('should fail with invalid type/status')
  })

  describe('PUT /api/vehicles/:id', () => {
    it('should update vehicle')
  })

  describe('DELETE /api/vehicles/:id', () => {
    it('should delete vehicle')
  })
})
```

### E2E Tests (Using @nuxt/test-utils or Playwright)

#### customer-flow.test.ts
```typescript
describe('Customer Flow', () => {
  it('should complete full customer journey', async () => {
    // 1. Login
    // 2. Navigate to /orders/create
    // 3. Fill form and submit
    // 4. Receive TTN
    // 5. Search by TTN on homepage
    // 6. View order status
  })
})
```

#### admin-flow.test.ts
```typescript
describe('Admin Flow', () => {
  it('should manage orders and users', async () => {
    // 1. Login as admin
    // 2. View /admin/index - all orders
    // 3. Navigate to /admin/assign
    // 4. Assign courier to order
    // 5. View /admin/users
    // 6. Verify status changes
  })
})
```

#### courier-flow.test.ts
```typescript
describe('Courier Flow', () => {
  it('should view and update assigned orders', async () => {
    // 1. Login as courier
    // 2. View /courier/index
    // 3. See assigned orders
    // 4. Update order status
    // 5. Verify real-time updates
  })
})
```

#### map-interactions.test.ts
```typescript
describe('Map Interactions', () => {
  it('should render map with markers', async () => {
    // Test MapView.vue component
    // Verify markers appear
    // Test click interactions
  })

  it('should draw polyline for route', async () => {
    // Test route visualization
    // Verify fitBounds called
  })
})
```

### Security Tests

#### rbac.test.ts
```typescript
describe('Role-Based Access Control', () => {
  it('should allow admin access to /admin/*')
  it('should allow courier access to /courier/*')
  it('should allow customer access to /my-orders')
  it('should return 403 for unauthorized role access')
  it('should return 401 for unauthenticated access')
})
```

#### middleware.test.ts
```typescript
describe('Auth Middleware', () => {
  it('should redirect to /login for unauthenticated users')
  it('should redirect based on role')
  it('should allow access to public routes')
})
```

### Database Integrity Tests

#### unique-constraints.test.ts
```typescript
describe('Database Constraints', () => {
  it('should enforce unique order_number (TTN)', async () => {
    // Create order
    // Try to create duplicate TTN
    // Expect error
  })

  it('should enforce unique email', async () => {
    // Similar test for user emails
  })
})
```

#### foreign-keys.test.ts
```typescript
describe('Foreign Key Integrity', () => {
  it('should maintain order → customer relationship')
  it('should maintain delivery → courier relationship')
  it('should prevent orphaned records')
})
```

## Running Tests

### Run All Tests
```bash
npm run test
# or
bun test
```

### Run Specific Test Suite
```bash
npm run test unit
npm run test integration
npm run test e2e
```

### Run Single Test File
```bash
npx vitest tests/unit/utils/orders.test.ts
```

### Watch Mode
```bash
npm run test:watch
```

### Coverage Report
```bash
npm run test:coverage
```

## Test Configuration

Update `vitest.config.ts`:
```typescript
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'nuxt',
    setupFiles: ['./tests/setup.ts'],
    coverage: {
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'tests/',
        '**/*.config.*',
        '**/types/**'
      ]
    }
  }
})
```

## Performance Tests (Future)

### Load Testing
- Use Artillery or k6 for HTTP load testing
- Test API endpoints under concurrent load
- Measure 95th and 99th percentile latency

### Database Performance
- Test queries with large datasets
- Verify index usage
- Measure response times for `findMany` with `include`

### UI Performance
- Use Lighthouse for page load metrics
- Test map rendering with 100-500 markers
- Monitor FPS and memory usage

## Continuous Integration

Add to `.github/workflows/test.yml`:
```yaml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install
      - run: npm run test
```

## Notes

- ✅ = Completed and implemented
- 📝 = Template provided, needs implementation
- All tests use Vitest framework
- Integration tests require database setup
- E2E tests may require test database seeding
