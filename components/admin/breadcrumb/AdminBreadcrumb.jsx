"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";

const AdminBreadcrumb = () => {
  const pathname = usePathname();
  
  // Generate breadcrumb items from pathname
  const generateBreadcrumbs = (path) => {
    const segments = path.split('/').filter(Boolean);
    const breadcrumbs = [];
    
    // Add home/dashboard
    breadcrumbs.push({
      name: 'Dashboard',
      href: '/admin',
      current: segments.length === 1
    });
    
    // Map admin routes to readable names
    const routeNames = {
      'orders': 'Orders',
      'manage-category': 'Manage Categories',
      'products': 'Products',
      'stock': 'Stock',
      'users': 'Users',
      'user-details': 'User Details',
      'kyc-management': 'KYC Management',
      'pool-management': 'Pool Management',
      'team-management': 'Team Management',
      'pool-withdrawals': 'Withdrawals',
      'contact-us': 'Contact Us',
      'banners': 'Banners'
    };
    
    // Build breadcrumb path
    let currentPath = '';
    for (let i = 1; i < segments.length; i++) {
      currentPath += `/${segments[i]}`;
      const isLast = i === segments.length - 1;
      const isNumeric = /^\d+$/.test(segments[i]);
      
      // Skip numeric IDs in breadcrumb display but keep in path
      if (!isNumeric) {
        breadcrumbs.push({
          name: routeNames[segments[i]] || segments[i].replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()),
          href: `/admin${currentPath}`,
          current: isLast
        });
      } else if (isLast && i > 1) {
        // For numeric IDs, show "Details" or "Edit"
        breadcrumbs.push({
          name: 'Details',
          href: `/admin${currentPath}`,
          current: true
        });
      }
    }
    
    return breadcrumbs;
  };
  
  const breadcrumbs = generateBreadcrumbs(pathname);
  
  if (breadcrumbs.length <= 1) {
    return null; // Don't show breadcrumb on dashboard
  }
  
  return (
    <nav className="flex mb-4 sm:mb-6" aria-label="Breadcrumb">
      <ol className="inline-flex items-center space-x-1 md:space-x-3 flex-wrap">
        {breadcrumbs.map((breadcrumb, index) => (
          <li key={breadcrumb.href} className="inline-flex items-center">
            {index > 0 && (
              <ChevronRight className="w-4 h-4 text-gray-400 mx-1 flex-shrink-0" />
            )}
            {breadcrumb.current ? (
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate max-w-[150px] sm:max-w-none">
                {breadcrumb.name}
              </span>
            ) : (
              <Link
                href={breadcrumb.href}
                className="inline-flex items-center text-sm font-medium text-gray-700 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400 transition-colors truncate max-w-[150px] sm:max-w-none"
              >
                {index === 0 && <Home className="w-4 h-4 mr-1 flex-shrink-0" />}
                {breadcrumb.name}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
};

export default AdminBreadcrumb;