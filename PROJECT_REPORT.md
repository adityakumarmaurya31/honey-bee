# Honey Bee E-Commerce Project Report

## 1. Project Title
Honey Bee E-Commerce Website with Admin Panel

## 2. Project Overview
This project is a full-stack e-commerce website developed for a honey business. It allows customers to browse products, place orders, submit enquiries, view their orders, download invoices, and track shipments. It also includes an admin panel for managing products, orders, users, gallery items, and customer enquiries.

The project is designed to support a small business that sells honey online with a simple and practical workflow. The main goal is to digitize the sales process, improve order management, and provide a better customer experience.

## 3. Objective
- To create an online platform for selling honey products
- To provide an admin dashboard for managing store operations
- To simplify order handling, user management, and product updates
- To support online payment integration readiness
- To provide order tracking using admin-assigned tracking numbers

## 4. Problem Statement
Traditional small businesses often manage orders manually through calls, messages, or social media. This creates problems such as:
- difficulty in managing product details and stock
- no central system for customer orders
- manual invoice and order updates
- limited visibility for users after placing an order
- no structured tracking process

This project solves these issues by offering a complete web-based store and management system.

## 5. Technology Stack

### Frontend
- React
- Vite
- React Router DOM
- Tailwind CSS
- Custom CSS

### Backend
- Node.js
- Express.js
- JWT Authentication
- Multer for file uploads
- Sharp for image handling

### Database
- MySQL

### Payment Readiness
- Razorpay integration support added for online payments such as UPI, Cards, and Wallets

## 6. Main Modules

### User Side
- Home page
- Products page
- Cart page
- Checkout page
- My Orders page
- Invoice page
- Gallery page
- Quick Enquiry page

### Admin Side
- Admin login
- Dashboard
- Product management
- Order management
- User management
- Enquiry management
- Gallery management
- Invoice view

## 7. Key Features
- User can browse honey products
- User can add products to cart
- User can place an order with customer and shipping details
- User can use Cash on Delivery
- System is prepared for online payment flow
- User can view past orders using email
- User can cancel pending orders
- User can return delivered orders
- Admin can add, edit, and delete products
- Admin can update order status
- Admin can assign a tracking number to an order
- User can track an order using the tracking number
- Admin can manage enquiries and gallery content
- Invoice generation and viewing feature is available

## 8. Database Design
The system uses MySQL tables to manage core data.

### Main Tables
- `users`
  Stores admin and customer details

- `products`
  Stores honey product details such as name, description, price, discount, stock, and image

- `orders`
  Stores order information including user, total amount, shipping address, payment method, status, and tracking number

- `order_items`
  Stores individual items linked to each order

- `enquiries`
  Stores customer enquiry messages and admin replies

- `gallery`
  Stores images or media items for the gallery section

## 9. Project Workflow

### Customer Flow
1. User visits the website
2. User views products
3. User adds products to cart
4. User fills checkout form and places order
5. Order is stored in database
6. User can later check order history
7. Admin updates order status and tracking number
8. User tracks order using email or tracking number

### Admin Flow
1. Admin logs into dashboard
2. Admin manages products and stock
3. Admin reviews orders
4. Admin updates order status
5. Admin assigns tracking number after shipment
6. Admin handles users, enquiries, and gallery

## 10. Security and Validation
- Admin routes are protected using JWT token authentication
- Order actions are validated on backend
- Product stock is checked before order creation
- User email is used to verify user-specific order actions
- Tracking number uniqueness is validated before assignment

## 11. Special Implemented Features

### A. Admin Order Tracking Number
An order tracking feature has been added where:
- admin assigns a tracking number from the order management page
- the tracking number is saved in the database
- the customer can use that number to track the order

### B. Online Payment Ready Flow
The project has backend and frontend preparation for Razorpay-based payments:
- payment order creation endpoint
- payment verification endpoint
- support for UPI, Cards, and Wallets

This can be activated by adding valid Razorpay credentials.

## 12. Advantages of the Project
- easy product and order management
- useful for small business owners
- better user experience than manual ordering
- supports both store and admin operations in one system
- scalable for future additions like coupons, delivery partners, and reports

## 13. Limitations
- live payment works only after adding valid gateway keys
- no customer login system yet for account-based order history
- order tracking is based on admin-entered tracking numbers and does not directly fetch courier live status

## 14. Future Scope
- live courier API integration
- full online payment activation
- customer registration and login
- wishlist feature
- coupon and discount codes
- delivery charge calculation
- sales report export
- email and SMS notifications
- mobile responsive UI improvements

## 15. Conclusion
The Honey Bee E-Commerce project is a practical full-stack web application for managing and selling honey products online. It combines a customer-facing store with an admin management system and covers important business functions such as product listing, order management, enquiry handling, invoice viewing, and tracking number assignment.

This project demonstrates the use of modern frontend and backend technologies in a real business use case. It is suitable as an academic project as well as a small business solution with room for future enhancement.

## 16. Developer Details
- Project Type: Full-Stack Web Application
- Frontend: React + Vite
- Backend: Node.js + Express
- Database: MySQL
- Developed For: Honey product business
