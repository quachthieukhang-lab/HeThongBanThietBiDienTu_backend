<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

# HTTMDT Backend

<p align="center">A backend service for the HTTMDT (Hệ Thống Thương Mại Điện Tử) project, built with <a href="http://nestjs.com/" target="_blank">NestJS</a> and <a href="https://www.mongodb.com/" target="_blank">MongoDB</a>.</p>

---

## Description

HTTMDT Backend is a scalable and efficient backend service for an e-commerce platform. It provides APIs for managing users, products, carts, categories, and other essential e-commerce functionalities.

---

## Features

### User Management
- Create, update, delete, and restore users.
- Role-based access control (`Admin`, `Customer`, `Guest`, etc.).
- Support for guest users with session-based carts.

### Cart Management
- Add, update, and remove items from the cart.
- Support for both authenticated users and guest users.
- Merge guest carts into user carts upon login.

### Product Management
- Manage products and product variants.
- Load product snapshots for cart items.

### Category and Subcategory Management
- Manage product categories and subcategories.

---

## Project Setup

```bash
# install dependencies
$ npm install

# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

---

## API Endpoints

| Controller | Prefix | Mô tả |
| :--- | :--- | :--- |
| **AppController** | `/` | Endpoint gốc của ứng dụng. |
| **AuthController** | `/auth` | Xử lý đăng ký, đăng nhập, refresh token. |
| **UsersController** | `/users` | Quản lý thông tin người dùng. |
| **CartsController** | `/carts` | Quản lý giỏ hàng. |
| **AddressesController** | `/addresses` | Quản lý địa chỉ người dùng. |
| **ProductsController** | `/products` | Quản lý sản phẩm và các biến thể lồng nhau. |
| **ProductVariantsController** | `/product-variants` | Quản lý chi tiết biến thể sản phẩm. |
| **CategoriesController** | `/categories` | Quản lý danh mục. |
| **SubcategoriesController** | `/subcategories` | Quản lý danh mục con. |
| **OrdersController** | `/orders` | Quản lý đơn hàng. |
| **BrandsController** | `/brands` | Quản lý thương hiệu. |
| **AttributeTemplateController** | `/attribute-templates` | Quản lý các mẫu thuộc tính. |

## Project Structure

```
src/
├── users/                # User-related modules, services, and controllers
├── carts/                # Cart-related modules, services, and controllers
├── products/             # Product-related modules, services, and controllers
├── categories/           # Category-related modules, services, and controllers
├── common/               # Shared utilities, DTOs, and middleware
├── app.module.ts         # Root module
├── main.ts               # Application entry point
```

---

## Development Notes

### Guest Cart Handling
- Guest users are identified using a sessionId.
- Carts for guest users are created dynamically and can be merged into user carts upon login.

### Database
- MongoDB is used as the database.
- Mongoose is used for schema modeling and data validation.

### Error Handling
- All errors are handled using NestJS's built-in exception filters.
- Common exceptions include `BadRequestException`, `NotFoundException`, etc.

---

## Future Enhancements

- Add order management APIs.
- Implement payment gateway integration.
- Add support for product reviews and ratings.
- Optimize performance with caching (e.g., Redis).

---

## License

This project is licensed under the **MIT License**.