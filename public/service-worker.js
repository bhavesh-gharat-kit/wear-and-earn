// Service Worker for Wear and Earn PWA
// This file handles offline caching, background sync, and push notifications

const CACHE_NAME = 'wear-and-earn-v1.2.0';
const STATIC_CACHE_NAME = 'wear-and-earn-static-v1.2.0';
const DYNAMIC_CACHE_NAME = 'wear-and-earn-dynamic-v1.2.0';

// Assets to cache immediately when SW is installed
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/images/brand-logo.png',
  '/images/icons/icon-192x192.png',
  '/images/icons/icon-512x512.png',
  // Add your essential CSS and JS files here
  '/_next/static/css/app/layout.css', // Next.js CSS
];

// Routes to cache dynamically (pages that users visit)
const DYNAMIC_ROUTES = [
  '/',
  '/products',
  '/about-us',
  '/contact-us',
  '/login',
  '/account',
  '/cart',
];

// API endpoints to cache for offline functionality
const API_CACHE_ROUTES = [
  '/api/products',
  '/api/categories',
  '/api/banners',
];

// Files/routes that should always be fetched from network
const NETWORK_ONLY = [
  '/api/auth/',
  '/api/admin/',
  '/api/orders/',
  '/api/payments/',
];

// Install Event - Cache static assets immediately
self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker: Installing...');
  
  event.waitUntil(
    (async () => {
      try {
        // Cache static assets
        const staticCache = await caches.open(STATIC_CACHE_NAME);
        await staticCache.addAll(STATIC_ASSETS);
        
        console.log('✅ Service Worker: Static assets cached successfully');
        
        // Skip waiting to activate immediately
        self.skipWaiting();
      } catch (error) {
        console.error('❌ Service Worker: Failed to cache static assets:', error);
      }
    })()
  );
});

// Activate Event - Clean up old caches and take control
self.addEventListener('activate', (event) => {
  console.log('🚀 Service Worker: Activating...');
  
  event.waitUntil(
    (async () => {
      try {
        // Get all cache names
        const cacheNames = await caches.keys();
        
        // Delete old caches
        const deletePromises = cacheNames
          .filter(cacheName => 
            cacheName !== STATIC_CACHE_NAME && 
            cacheName !== DYNAMIC_CACHE_NAME &&
            cacheName.startsWith('wear-and-earn')
          )
          .map(cacheName => caches.delete(cacheName));
        
        await Promise.all(deletePromises);
        
        console.log('✅ Service Worker: Old caches cleaned up');
        
        // Take control of all pages immediately
        await self.clients.claim();
        
        console.log('✅ Service Worker: Activated and in control');
      } catch (error) {
        console.error('❌ Service Worker: Activation failed:', error);
      }
    })()
  );
});

// Fetch Event - Handle all network requests with caching strategy
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-HTTP requests (chrome-extension://, etc.)
  if (!url.protocol.startsWith('http')) {
    return;
  }
  
  // Handle different types of requests with appropriate strategies
  if (NETWORK_ONLY.some(route => url.pathname.startsWith(route))) {
    // Network only for sensitive routes (auth, payments, etc.)
    event.respondWith(networkOnly(request));
  } else if (API_CACHE_ROUTES.some(route => url.pathname.startsWith(route))) {
    // Network first for API routes with fallback to cache
    event.respondWith(networkFirstWithCache(request));
  } else if (request.destination === 'image') {
    // Cache first for images
    event.respondWith(cacheFirstWithNetworkFallback(request));
  } else if (url.pathname.endsWith('.js') || url.pathname.endsWith('.css')) {
    // Cache first for static assets
    event.respondWith(cacheFirstWithNetworkFallback(request));
  } else {
    // Stale while revalidate for pages
    event.respondWith(staleWhileRevalidate(request));
  }
});

// Network Only Strategy - Always fetch from network
async function networkOnly(request) {
  try {
    return await fetch(request);
  } catch (error) {
    console.warn('🌐 Network request failed:', request.url);
    // Return a custom offline response for network-only routes
    return new Response(
      JSON.stringify({ 
        error: 'Network unavailable', 
        message: 'This feature requires an internet connection' 
      }),
      {
        status: 503,
        statusText: 'Service Unavailable',
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

// Network First with Cache Fallback - Try network first, fallback to cache
async function networkFirstWithCache(request) {
  const cache = await caches.open(DYNAMIC_CACHE_NAME);
  
  try {
    // Try network first
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Cache successful responses
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.warn('🌐 Network failed, trying cache:', request.url);
    
    // Fallback to cache
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // If no cache, return offline response
    return createOfflineResponse(request);
  }
}

// Cache First with Network Fallback - Try cache first, fallback to network
async function cacheFirstWithNetworkFallback(request) {
  const cache = await caches.open(STATIC_CACHE_NAME);
  
  // Try cache first
  const cachedResponse = await cache.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    // Fallback to network
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Cache the response for future use
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.warn('🌐 Both cache and network failed:', request.url);
    return createOfflineResponse(request);
  }
}

// Stale While Revalidate - Return cached version immediately, update cache in background
async function staleWhileRevalidate(request) {
  const cache = await caches.open(DYNAMIC_CACHE_NAME);
  const cachedResponse = await cache.match(request);
  
  // Fetch from network in the background to update cache
  const networkResponsePromise = fetch(request).then(response => {
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  }).catch(error => {
    console.warn('🌐 Background update failed:', request.url);
    return null;
  });
  
  // Return cached response immediately if available, otherwise wait for network
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    return await networkResponsePromise;
  } catch (error) {
    return createOfflineResponse(request);
  }
}

// Create offline response based on request type
function createOfflineResponse(request) {
  const url = new URL(request.url);
  
  if (request.destination === 'image') {
    // Return a simple SVG placeholder for images
    return new Response(
      `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
        <rect width="200" height="200" fill="#f0f0f0"/>
        <text x="50%" y="50%" text-anchor="middle" fill="#999" font-family="Arial" font-size="14">
          Image unavailable offline
        </text>
      </svg>`,
      { 
        headers: { 'Content-Type': 'image/svg+xml' },
        status: 200 
      }
    );
  }
  
  if (url.pathname.startsWith('/api/')) {
    // Return JSON error for API requests
    return new Response(
      JSON.stringify({
        error: 'Offline',
        message: 'This data is not available offline'
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 503
      }
    );
  }
  
  // Return offline page for navigation requests
  return new Response(
    `<!DOCTYPE html>
    <html>
    <head>
      <title>Offline - Wear and Earn</title>
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <style>
        body { font-family: Arial, sans-serif; padding: 20px; text-align: center; }
        .offline-container { max-width: 400px; margin: 50px auto; }
        .offline-icon { font-size: 48px; margin-bottom: 20px; }
        .offline-title { color: #333; margin-bottom: 10px; }
        .offline-message { color: #666; margin-bottom: 20px; }
        .retry-button { 
          background: #ffc107; color: #000; padding: 12px 24px; 
          border: none; border-radius: 8px; cursor: pointer; 
        }
      </style>
    </head>
    <body>
      <div class="offline-container">
        <div class="offline-icon">📱</div>
        <h1 class="offline-title">You're Offline</h1>
        <p class="offline-message">
          Please check your internet connection and try again.
        </p>
        <button class="retry-button" onclick="window.location.reload()">
          Try Again
        </button>
      </div>
    </body>
    </html>`,
    {
      headers: { 'Content-Type': 'text/html' },
      status: 200
    }
  );
}

// Background Sync - Handle background tasks when connection is restored
self.addEventListener('sync', (event) => {
  console.log('🔄 Background Sync triggered:', event.tag);
  
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

// Perform background synchronization tasks
async function doBackgroundSync() {
  try {
    console.log('🔄 Performing background sync...');
    
    // Here you can add logic to sync offline data
    // For example: send queued form submissions, sync user data, etc.
    
    console.log('✅ Background sync completed');
  } catch (error) {
    console.error('❌ Background sync failed:', error);
  }
}

// Push Notification Event (for future use)
self.addEventListener('push', (event) => {
  if (!event.data) return;
  
  const data = event.data.json();
  const options = {
    body: data.body,
    icon: '/images/icons/icon-192x192.png',
    badge: '/images/icons/icon-72x72.png',
    vibrate: [200, 100, 200],
    data: data.url || '/',
    actions: [
      {
        action: 'open',
        title: 'Open App'
      },
      {
        action: 'close',
        title: 'Close'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title || 'Wear and Earn', options)
  );
});

// Notification Click Event
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  if (event.action === 'open' || !event.action) {
    event.waitUntil(
      clients.openWindow(event.notification.data || '/')
    );
  }
});

console.log('✅ Service Worker: Loaded and ready!');