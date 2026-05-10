#t Inventory Manager

A Java CRUD application demonstrating proper software engineering practices for industrial supply inventory management.
## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     HTTP Server                          │
│                  (Java HttpServer)                        │
└──────────────────────┬──────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────┐
│               Controller Layer                           │
│         ProductController.java                           │
│   • REST routing (GET/POST/PUT/DELETE)                   │
│   • JSON serialization/deserialization                   │
│   • CORS headers                                         │
│   • HTTP error mapping                                   │
└──────────────────────┬──────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────┐
│                Service Layer                             │
│          ProductService.java                             │
│   • Input validation                                     │
│   • Business logic (stock mgmt, reorder alerts)          │
│   • Analytics (inventory summary)                        │
│   • Orchestration between layers                         │
└──────────────────────┬──────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────┐
│              Repository Layer                            │
│    ProductRepository (interface)                         │
│    InMemoryProductRepository (implementation)            │
│   • Data access abstraction                              │
│   • Thread-safe ConcurrentHashMap storage                │
│   • Swappable for JDBC/JPA in production                 │
└─────────────────────────────────────────────────────────┘
```

## Engineering Practices Demonstrated

### Layered Architecture
- **Controller** → thin routing, no business logic
- **Service** → validation, business rules, orchestration
- **Repository** → data access behind an interface

### SOLID Principles
- **Single Responsibility**: Each class has one job
- **Open/Closed**: Repository interface allows new implementations without changing service code
- **Dependency Inversion**: Service depends on `ProductRepository` interface, not concrete class

### Error Handling
- Custom exception hierarchy (`ProductNotFoundException`, `DuplicateSkuException`)
- Centralized error-to-HTTP-status mapping in controller
- Validation with descriptive error messages

### Thread Safety
- `ConcurrentHashMap` for concurrent access
- `AtomicLong` for ID generation
- No shared mutable state in service layer

### Testing
- 17 unit tests covering CRUD, validation, queries, and edge cases
- Test isolation (fresh repository per test)
- Both positive and negative test cases

### Code Quality
- Comprehensive Javadoc on all public methods
- Consistent naming conventions
- Business-relevant domain model (SKU, reorder points, warehouse locations)

## Quick Start

```bash
# Compile
javac -d out $(find src/main -name "*.java")

# Run server
java -cp out com.kimball.inventory.Application

# Run tests
javac -d out $(find src -name "*.java")
java -cp out com.kimball.inventory.service.ProductServiceTest
```

## API Endpoints

| Method   | Path                          | Description              |
|----------|-------------------------------|--------------------------|
| `GET`    | `/api/products`               | List all products        |
| `GET`    | `/api/products/{id}`          | Get product by ID        |
| `POST`   | `/api/products`               | Create new product       |
| `PUT`    | `/api/products/{id}`          | Update existing product  |
| `DELETE` | `/api/products/{id}`          | Delete product           |
| `GET`    | `/api/products/search?q=term` | Search by name or SKU    |
| `GET`    | `/api/products/low-stock`     | Products below reorder point |
| `GET`    | `/api/products/categories`    | List distinct categories |
| `GET`    | `/api/products/summary`       | Inventory dashboard data |
| `PATCH`  | `/api/products/{id}/stock`    | Adjust stock quantity    |

## Project Structure

```
src/
├── main/java/com/kimball/inventory/
│   ├── Application.java              # Entry point + server bootstrap
│   ├── model/
│   │   └── Product.java              # Domain entity with business methods
│   ├── repository/
│   │   ├── ProductRepository.java    # Data access interface
│   │   └── InMemoryProductRepository.java  # Thread-safe implementation
│   ├── service/
│   │   └── ProductService.java       # Business logic + validation
│   ├── controller/
│   │   └── ProductController.java    # REST API routing + JSON
│   ├── exception/
│   │   ├── ProductNotFoundException.java
│   │   └── DuplicateSkuException.java
│   └── config/
│       └── DataSeeder.java           # Sample industrial supply data
└── test/java/com/kimball/inventory/
    └── service/
        └── ProductServiceTest.java   # 17 unit tests
```

## Future Enhancements
- Replace in-memory store with JDBC/MySQL using prepared statements
- Add Spring Boot for dependency injection and auto-configuration
- Implement pagination for large product catalogs
- Add authentication and role-based access control
- Integrate with barcode scanning for warehouse operations
