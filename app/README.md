# App Folder Organization

This folder contains the Next.js App Router structure organized as follows:

## 📁 Folder Structure

### Core Files
- `layout.js` - Root layout component
- `globals.css` - Global styles
- `Providers.js` - App providers (Context, Theme, etc.)
- `favicon.ico` - App icon

### Route Groups
- `(auth)/` - Authentication routes (login, register)
- `(user)/` - User-facing pages (home, products, cart, etc.)

### Feature Areas
- `admin/` - Admin panel pages
- `api/` - API endpoints organized by feature

### Generated/System
- `generated/` - Auto-generated files

## 🎯 Organization Principles

1. **Route Groups**: Use Next.js route groups `()` for organizing without affecting URLs
2. **Feature-based**: Group related functionality together
3. **Clear Separation**: Separate admin, user, and API concerns
4. **Maintain URLs**: Keep existing API routes to avoid breaking changes

## 📋 API Endpoints

### User APIs
- `/api/account/` - User account management
- `/api/cart/` - Shopping cart operations
- `/api/contact/` - Contact form submissions
- `/api/signup/` - User registration
- `/api/auth/` - Authentication (NextAuth)

### Product APIs
- `/api/products/` - Product listings
- `/api/product-details/` - Individual product details
- `/api/category/` - Product categories

### Admin APIs
- `/api/admin/` - Admin-specific operations

### System APIs
- `/api/seed/` - Database seeding
- `/api/test/` - Testing endpoints

## 🔄 Future Improvements

1. Consider API route consolidation when refactoring
2. Add API versioning if needed
3. Group similar API endpoints under common prefixes
4. Add proper API documentation
