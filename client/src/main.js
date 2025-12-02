// OriesCreations - Main JavaScript Application

// State Management
const state = {
  user: null,
  cart: { items: [], total: 0, itemCount: 0 },
  products: [],
  currentPage: 'home',
  isLoading: false
};

// Session ID for guest users
const sessionId = localStorage.getItem('sessionId') || generateSessionId();
localStorage.setItem('sessionId', sessionId);

function generateSessionId() {
  return 'sess_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
}

// API Helper
async function api(endpoint, options = {}) {
  const token = localStorage.getItem('token');
  
  const headers = {
    'Content-Type': 'application/json',
    'X-Session-ID': sessionId,
    ...options.headers
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const response = await fetch(`/api${endpoint}`, {
    ...options,
    headers
  });
  
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error || 'API request failed');
  }
  
  return data;
}

// Initialize Application
document.addEventListener('DOMContentLoaded', async () => {
  // Check for saved auth
  const token = localStorage.getItem('token');
  if (token) {
    try {
      const data = await api('/auth/profile');
      state.user = data.user;
      updateUserUI();
    } catch (error) {
      localStorage.removeItem('token');
    }
  }
  
  // Load cart
  await loadCart();
  
  // Route to initial page
  navigateTo('home');
});

// Navigation
function navigateTo(page, filter = null) {
  state.currentPage = page;
  
  const mainContent = document.getElementById('main-content');
  
  switch(page) {
    case 'home':
      renderHomePage(mainContent);
      break;
    case 'shop':
      renderShopPage(mainContent, filter);
      break;
    case 'fan-art':
      renderShopPage(mainContent, 'Fan Art');
      break;
    case 'lore':
      renderLorePage(mainContent);
      break;
    case 'membership':
      renderMembershipPage(mainContent);
      break;
    case 'profile':
      renderProfilePage(mainContent);
      break;
    case 'admin':
      renderAdminPage(mainContent);
      break;
    case 'checkout':
      renderCheckoutPage(mainContent);
      break;
    default:
      renderHomePage(mainContent);
  }
  
  // Close mobile menu
  document.getElementById('mobile-menu').classList.add('hidden');
  
  // Scroll to top
  window.scrollTo(0, 0);
}

// Home Page
function renderHomePage(container) {
  container.innerHTML = `
    <!-- Hero Section - Choose Your Adventure -->
    <section class="min-h-screen flex items-center justify-center px-4 py-20 bg-gradient-to-b from-neutral-950 via-neutral-900 to-neutral-950">
      <div class="max-w-7xl w-full">
        <div class="text-center mb-16">
          <h1 class="text-5xl md:text-7xl font-bold mb-6 float" style="font-family: 'Cinzel', serif; color: #d4af37; text-shadow: 0 0 40px rgba(212, 175, 55, 0.4);">
            Ories's Creations
          </h1>
          <p class="text-xl md:text-2xl mb-4 text-neutral-300">
            Where every piece tells its own story—no two creations are ever the same
          </p>
          <div class="flex items-center justify-center gap-4 text-sm text-neutral-500">
            <span>⚔️ Original Fantasy Art</span>
            <span>•</span>
            <span>🛡️ Epic Merchandise</span>
            <span>•</span>
            <span>✨ Commission Your Legend</span>
          </div>
        </div>

        <!-- Three Adventure Cards -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          <!-- Path 1: The Gallery (Shop) -->
          <article class="group relative overflow-hidden rounded-lg border-2 border-yellow-600/20 hover:border-yellow-500/60 transition-all duration-500 cursor-pointer transform hover:scale-105 hover:shadow-2xl hover:shadow-yellow-600/10"
                   onclick="navigateTo('shop')"
                   style="background: linear-gradient(135deg, #171717 0%, #1a1a1a 100%);">
            <div class="aspect-[3/4] relative overflow-hidden">
              <div class="absolute inset-0 bg-gradient-to-b from-black/60 via-black/20 to-black/95 z-10"></div>
              <div class="absolute inset-0 bg-neutral-900/50 group-hover:bg-yellow-600/5 transition-colors duration-500"></div>
              <!-- Placeholder for image -->
              <div class="absolute inset-0 flex items-center justify-center text-8xl opacity-20 group-hover:opacity-30 transition-opacity">
                🎨
              </div>
            </div>
            <div class="absolute bottom-0 left-0 right-0 p-8 z-20">
              <h2 class="text-3xl font-bold mb-3" style="font-family: 'Cinzel', serif; color: #d4af37; text-shadow: 0 2px 10px rgba(0,0,0,1);">
                My Portfolio
              </h2>
              <p class="text-neutral-200 mb-4 text-shadow-lg" style="text-shadow: 0 2px 8px rgba(0,0,0,1);">
                Explore unique art including Altia, The Forest, Cosmic Insects, and fan art. Each piece is one-of-a-kind.
              </p>
              <div class="flex items-center text-yellow-500 font-semibold group-hover:translate-x-2 transition-transform">
                <span>Explore the Portfolio</span>
                <svg class="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"></path>
                </svg>
              </div>
              <div class="mt-4 flex flex-wrap gap-2">
                <span class="text-xs px-2 py-1 bg-yellow-600/20 border border-yellow-600/40 rounded text-yellow-300">Art Prints</span>
                <span class="text-xs px-2 py-1 bg-yellow-600/20 border border-yellow-600/40 rounded text-yellow-300">Merchandise</span>
                <span class="text-xs px-2 py-1 bg-yellow-600/20 border border-yellow-600/40 rounded text-yellow-300">Digital Art</span>
              </div>
            </div>
          </article>

          <!-- Path 2: The Commission Hall -->
          <article class="group relative overflow-hidden rounded-lg border-2 border-red-600/20 hover:border-red-500/60 transition-all duration-500 cursor-pointer transform hover:scale-105 hover:shadow-2xl hover:shadow-red-600/10"
                   onclick="navigateTo('shop', 'Commissions')"
                   style="background: linear-gradient(135deg, #171717 0%, #1a1a1a 100%);">
            <div class="aspect-[3/4] relative overflow-hidden">
              <div class="absolute inset-0 bg-gradient-to-b from-black/60 via-black/20 to-black/95 z-10"></div>
              <div class="absolute inset-0 bg-neutral-900/50 group-hover:bg-red-600/5 transition-colors duration-500"></div>
              <!-- Placeholder for image -->
              <div class="absolute inset-0 flex items-center justify-center text-8xl opacity-20 group-hover:opacity-30 transition-opacity">
                ⚔️
              </div>
            </div>
            <div class="absolute bottom-0 left-0 right-0 p-8 z-20">
              <h2 class="text-3xl font-bold mb-3" style="font-family: 'Cinzel', serif; color: #dc2626; text-shadow: 0 2px 10px rgba(0,0,0,1);">
                Commissions
              </h2>
              <p class="text-neutral-200 mb-4" style="text-shadow: 0 2px 8px rgba(0,0,0,1);">
                Commission unique, one-of-a-kind artwork. Bring your characters, stories, and visions to life.
              </p>
              <div class="flex items-center text-red-500 font-semibold group-hover:translate-x-2 transition-transform">
                <span>Start Your Commission</span>
                <svg class="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"></path>
                </svg>
              </div>
              <div class="mt-4 flex flex-wrap gap-2">
                <span class="text-xs px-2 py-1 bg-red-600/20 border border-red-600/40 rounded text-red-300">Custom Characters</span>
                <span class="text-xs px-2 py-1 bg-red-600/20 border border-red-600/40 rounded text-red-300">Portraits</span>
                <span class="text-xs px-2 py-1 bg-red-600/20 border border-red-600/40 rounded text-red-300">Scenes</span>
              </div>
            </div>
          </article>

          <!-- Path 3: The Guild Hall (Membership) -->
          <article class="group relative overflow-hidden rounded-lg border-2 border-neutral-500/20 hover:border-neutral-400/60 transition-all duration-500 cursor-pointer transform hover:scale-105 hover:shadow-2xl hover:shadow-neutral-400/10"
                   onclick="navigateTo('membership')"
                   style="background: linear-gradient(135deg, #171717 0%, #1a1a1a 100%);">
            <div class="aspect-[3/4] relative overflow-hidden">
              <div class="absolute inset-0 bg-gradient-to-b from-black/60 via-black/20 to-black/95 z-10"></div>
              <div class="absolute inset-0 bg-neutral-900/50 group-hover:bg-neutral-700/5 transition-colors duration-500"></div>
              <!-- Placeholder for image -->
              <div class="absolute inset-0 flex items-center justify-center text-8xl opacity-20 group-hover:opacity-30 transition-opacity">
                👑
              </div>
            </div>
            <div class="absolute bottom-0 left-0 right-0 p-8 z-20">
              <h2 class="text-3xl font-bold mb-3" style="font-family: 'Cinzel', serif; color: #e5e5e5; text-shadow: 0 2px 10px rgba(0,0,0,1);">
                The Collection
              </h2>
              <p class="text-neutral-200 mb-4" style="text-shadow: 0 2px 8px rgba(0,0,0,1);">
                Discover art pieces ready to find their forever home. Prints, originals, and more treasures await.
              </p>
              <div class="flex items-center text-neutral-300 font-semibold group-hover:translate-x-2 transition-transform">
                <span>See the Collection</span>
                <svg class="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"></path>
                </svg>
              </div>
              <div class="mt-4 flex flex-wrap gap-2">
                <span class="text-xs px-2 py-1 bg-white/20 border border-white/40 rounded text-white">Exclusive Art</span>
                <span class="text-xs px-2 py-1 bg-white/20 border border-white/40 rounded text-white">Discounts</span>
                <span class="text-xs px-2 py-1 bg-white/20 border border-white/40 rounded text-white">Early Access</span>
              </div>
            </div>
          </article>

        </div>

        <!-- SEO Content Below -->
        <div class="mt-16 text-center max-w-4xl mx-auto">
          <p class="text-gray-400 text-sm leading-relaxed">
            OriesCreations offers premium fantasy art prints, original digital artwork, custom character commissions for D&D and tabletop RPGs, 
            medieval-inspired merchandise, and exclusive patron memberships. Browse our collection of dragon art, warrior illustrations, 
            enchanted forest scenes, and epic battle artwork perfect for fantasy enthusiasts, dungeon masters, and collectors.
          </p>
        </div>
      </div>
    </section>

    <!-- Featured Products -->
    <section class="py-20 px-4">
      <div class="max-w-7xl mx-auto">
        <h2 class="text-3xl md:text-4xl text-center mb-12">Featured Creations</h2>
        <div id="featured-products" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div class="col-span-full text-center">
            <div class="spinner-fantasy mx-auto"></div>
          </div>
        </div>
        <div class="text-center mt-12">
          <button onclick="navigateTo('shop')" class="btn-secondary">
            View All Products →
          </button>
        </div>
      </div>
    </section>

    <!-- Categories Section -->
    <section class="py-20 px-4 bg-gradient-to-b from-transparent to-purple-900/20">
      <div class="max-w-7xl mx-auto">
        <h2 class="text-3xl md:text-4xl text-center mb-12">Explore Categories</h2>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div class="card-fantasy p-8 text-center cursor-pointer" onclick="navigateTo('shop', 'Original Creations')">
            <div class="text-5xl mb-4">🎨</div>
            <h3 class="text-xl font-bold mb-2">Original Creations</h3>
            <p class="text-gray-400">Unique artwork born from imagination</p>
          </div>
          <div class="card-fantasy p-8 text-center cursor-pointer" onclick="navigateTo('fan-art')">
            <div class="text-5xl mb-4">✨</div>
            <h3 class="text-xl font-bold mb-2">Fan Art</h3>
            <p class="text-gray-400">Community-inspired tributes</p>
          </div>
          <div class="card-fantasy p-8 text-center cursor-pointer" onclick="navigateTo('shop', 'Merchandise')">
            <div class="text-5xl mb-4">🛡️</div>
            <h3 class="text-xl font-bold mb-2">Merchandise</h3>
            <p class="text-gray-400">Gear for your daily adventures</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Membership CTA -->
    <section class="py-20 px-4">
      <div class="max-w-4xl mx-auto text-center">
        <div class="card-fantasy p-12 glow">
          <h2 class="text-3xl md:text-4xl mb-6">Join the Inner Circle</h2>
          <p class="text-xl text-gray-300 mb-8">
            Get early access to new creations, exclusive behind-the-scenes content, and special perks!
          </p>
          <button onclick="navigateTo('membership')" class="btn-fantasy text-lg">
            Explore Membership
          </button>
        </div>
      </div>
    </section>

    <!-- Contact & Social -->
    <footer class="py-12 px-4 bg-neutral-950/50">
      <div class="max-w-4xl mx-auto text-center">
        <p class="text-lg mb-4 text-neutral-300">
          Contact: <a href="mailto:OriesCreations@gmail.com" class="text-gold-400 hover:text-gold-300 transition-colors">OriesCreations@gmail.com</a>
        </p>
        <div class="flex justify-center gap-6 mb-6">
          <a href="#" class="text-neutral-400 hover:text-gold-400 transition-colors text-sm">TikTok</a>
          <span class="text-neutral-700">•</span>
          <a href="#" class="text-neutral-400 hover:text-gold-400 transition-colors text-sm">Instagram</a>
          <span class="text-neutral-700">•</span>
          <a href="#" class="text-neutral-400 hover:text-gold-400 transition-colors text-sm">Youtube</a>
          <span class="text-neutral-700">•</span>
          <a href="#" class="text-neutral-400 hover:text-gold-400 transition-colors text-sm">Snapchat</a>
        </div>
        <p class="text-sm text-neutral-500">&copy; 2024 Ories's Creations. All rights reserved.</p>
      </div>
    </footer>
  `;
  
  // Load featured products
  loadFeaturedProducts();
}

async function loadFeaturedProducts() {
  try {
    // Try to load featured products first
    let data = await api('/products?featured=true&limit=4');
    const container = document.getElementById('featured-products');
    
    // If no featured products, load any recent products instead
    if (data.products.length === 0) {
      console.log('No featured products found, loading recent products instead');
      data = await api('/products?limit=4&sort=created_at&order=DESC');
    }
    
    if (data.products.length === 0) {
      container.innerHTML = '<p class="col-span-full text-center text-gray-400">No products available yet</p>';
      return;
    }
    
    container.innerHTML = data.products.map(product => renderProductCard(product)).join('');
  } catch (error) {
    console.error('Error loading featured products:', error);
    const container = document.getElementById('featured-products');
    if (container) {
      container.innerHTML = '<p class="col-span-full text-center text-gray-400">Error loading products</p>';
    }
  }
}

// Shop Page
async function renderShopPage(container, categoryFilter = null) {
  container.innerHTML = `
    <section class="py-12 px-4">
      <div class="max-w-7xl mx-auto">
        <h1 class="text-4xl text-center mb-8">${categoryFilter || 'Shop'}</h1>
        
        <!-- Filters -->
        <div class="card-fantasy p-4 mb-8">
          <div class="flex flex-wrap gap-4 items-center justify-between">
            <div class="flex flex-wrap gap-4">
              <select id="category-filter" class="input-fantasy" onchange="filterProducts()" aria-label="Filter by category">
                <option value="">All Categories</option>
              </select>
              <select id="sort-filter" class="input-fantasy" onchange="filterProducts()" aria-label="Sort products">
                <option value="created_at-DESC">Newest First</option>
                <option value="price-ASC">Price: Low to High</option>
                <option value="price-DESC">Price: High to Low</option>
                <option value="name-ASC">Name: A-Z</option>
              </select>
            </div>
            <div class="flex gap-2">
              <input type="text" id="search-input" class="input-fantasy" placeholder="Search products..." aria-label="Search products">
              <button onclick="filterProducts()" class="btn-fantasy">Search</button>
            </div>
          </div>
        </div>
        
        <!-- Products Grid -->
        <div id="products-grid" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          <div class="col-span-full text-center">
            <div class="spinner-fantasy mx-auto"></div>
          </div>
        </div>
        
        <!-- Pagination -->
        <div id="pagination" class="flex justify-center gap-2 mt-8">
        </div>
      </div>
    </section>
  `;
  
  // Load categories
  await loadCategories();
  
  // Set initial category filter if provided
  if (categoryFilter) {
    document.getElementById('category-filter').value = categoryFilter;
  }
  
  // Load products
  await loadProducts(categoryFilter);
}

async function loadCategories() {
  try {
    const data = await api('/products/categories');
    const select = document.getElementById('category-filter');
    
    data.categories.forEach(category => {
      const option = document.createElement('option');
      option.value = category;
      option.textContent = category;
      select.appendChild(option);
    });
  } catch (error) {
    console.error('Error loading categories:', error);
  }
}

async function loadProducts(category = null, page = 1) {
  try {
    const categoryFilter = document.getElementById('category-filter')?.value || category || '';
    const sortFilter = document.getElementById('sort-filter')?.value || 'created_at-DESC';
    const searchInput = document.getElementById('search-input')?.value || '';
    
    const [sort, order] = sortFilter.split('-');
    
    let url = `/products?page=${page}&limit=12`;
    if (categoryFilter) url += `&category=${encodeURIComponent(categoryFilter)}`;
    if (searchInput) url += `&search=${encodeURIComponent(searchInput)}`;
    url += `&sort=${sort}&order=${order}`;
    
    const data = await api(url);
    state.products = data.products;
    
    const container = document.getElementById('products-grid');
    
    if (data.products.length === 0) {
      container.innerHTML = '<p class="col-span-full text-center text-gray-400">No products found</p>';
      return;
    }
    
    container.innerHTML = data.products.map(product => renderProductCard(product)).join('');
    
    // Render pagination
    renderPagination(data.pagination);
  } catch (error) {
    console.error('Error loading products:', error);
  }
}

function filterProducts() {
  loadProducts();
}

function renderProductCard(product) {
  return `
    <article class="card-fantasy product-card overflow-hidden" role="article">
      <div class="aspect-square bg-gray-800 relative overflow-hidden">
        <img src="${product.image_url || '/images/placeholder.svg'}" 
             alt="${product.name}" 
             class="w-full h-full object-cover"
             onerror="this.src='/images/placeholder.svg'">
        ${product.featured ? '<span class="badge-gold absolute top-2 right-2">Featured</span>' : ''}
        ${product.inventory_count < 10 && product.inventory_count > 0 ? '<span class="absolute top-2 left-2 text-xs bg-red-600 text-white px-2 py-1 rounded">Low Stock</span>' : ''}
        ${product.inventory_count === 0 ? '<span class="absolute top-2 left-2 text-xs bg-gray-600 text-white px-2 py-1 rounded">Out of Stock</span>' : ''}
      </div>
      <div class="p-4">
        <h3 class="font-bold mb-1 truncate">${product.name}</h3>
        <p class="text-sm text-gray-400 mb-2">${product.category}</p>
        <div class="flex items-center justify-between">
          <span class="text-lg font-bold text-yellow-400">$${product.price.toFixed(2)}</span>
          <div class="flex gap-2">
            <button onclick="openProductModal(${product.id})" class="p-2 hover:text-yellow-400 transition-colors" aria-label="View details for ${product.name}">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
              </svg>
            </button>
            <button onclick="addToCart(${product.id})" class="p-2 hover:text-yellow-400 transition-colors ${product.inventory_count === 0 ? 'opacity-50 cursor-not-allowed' : ''}" ${product.inventory_count === 0 ? 'disabled' : ''} aria-label="Add ${product.name} to cart">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </article>
  `;
}

function renderPagination(pagination) {
  const container = document.getElementById('pagination');
  if (!container || pagination.totalPages <= 1) {
    if (container) container.innerHTML = '';
    return;
  }
  
  let html = '';
  
  if (pagination.page > 1) {
    html += `<button onclick="loadProducts(null, ${pagination.page - 1})" class="btn-secondary px-4 py-2">← Prev</button>`;
  }
  
  html += `<span class="px-4 py-2 text-gray-400">Page ${pagination.page} of ${pagination.totalPages}</span>`;
  
  if (pagination.page < pagination.totalPages) {
    html += `<button onclick="loadProducts(null, ${pagination.page + 1})" class="btn-secondary px-4 py-2">Next →</button>`;
  }
  
  container.innerHTML = html;
}

// Product Modal
async function openProductModal(productId) {
  const modal = document.getElementById('product-modal');
  const content = document.getElementById('product-modal-content');
  
  content.innerHTML = '<div class="spinner-fantasy mx-auto"></div>';
  modal.classList.remove('hidden');
  
  try {
    const data = await api(`/products/${productId}`);
    const product = data.product;
    
    content.innerHTML = `
      <div class="grid md:grid-cols-2 gap-8">
        <div class="aspect-square bg-gray-800 rounded overflow-hidden">
          <img src="${product.image_url || '/images/placeholder.svg'}" 
               alt="${product.name}" 
               class="w-full h-full object-cover"
               onerror="this.src='/images/placeholder.svg'">
        </div>
        <div>
          <span class="badge-gold">${product.category}</span>
          <h2 class="text-3xl font-bold mt-4 mb-2">${product.name}</h2>
          <p class="text-2xl text-yellow-400 mb-4">$${product.price.toFixed(2)}</p>
          <p class="text-gray-300 mb-6">${product.description || 'No description available.'}</p>
          
          <div class="mb-6">
            <span class="text-sm text-gray-400">
              ${product.inventory_count > 0 
                ? `${product.inventory_count} in stock` 
                : 'Out of stock'}
            </span>
          </div>
          
          <div class="flex gap-4">
            <div class="flex items-center border border-yellow-900/30 rounded">
              <button onclick="updateModalQuantity(-1)" class="px-4 py-2 hover:bg-yellow-900/20" aria-label="Decrease quantity">-</button>
              <input type="number" id="modal-quantity" value="1" min="1" max="${product.inventory_count}" class="w-16 text-center bg-transparent border-x border-yellow-900/30" aria-label="Quantity">
              <button onclick="updateModalQuantity(1)" class="px-4 py-2 hover:bg-yellow-900/20" aria-label="Increase quantity">+</button>
            </div>
            <button onclick="addToCartFromModal(${product.id})" class="btn-fantasy flex-1" ${product.inventory_count === 0 ? 'disabled' : ''}>
              Add to Cart
            </button>
          </div>
        </div>
      </div>
    `;
  } catch (error) {
    content.innerHTML = '<p class="text-center text-red-400">Error loading product</p>';
  }
}

function closeProductModal() {
  document.getElementById('product-modal').classList.add('hidden');
}

function updateModalQuantity(delta) {
  const input = document.getElementById('modal-quantity');
  const newValue = Math.max(1, Math.min(parseInt(input.max), parseInt(input.value) + delta));
  input.value = newValue;
}

function addToCartFromModal(productId) {
  const quantity = parseInt(document.getElementById('modal-quantity').value);
  addToCart(productId, quantity);
  closeProductModal();
}

// Cart Functions
async function loadCart() {
  try {
    const data = await api('/cart');
    state.cart = data;
    updateCartUI();
  } catch (error) {
    console.error('Error loading cart:', error);
  }
}

async function addToCart(productId, quantity = 1) {
  try {
    await api('/cart/items', {
      method: 'POST',
      body: JSON.stringify({ product_id: productId, quantity })
    });
    await loadCart();
    showToast('Added to cart!', 'success');
    openCart();
  } catch (error) {
    showToast(error.message, 'error');
  }
}

async function updateCartItem(productId, quantity) {
  try {
    await api(`/cart/items/${productId}`, {
      method: 'PUT',
      body: JSON.stringify({ quantity })
    });
    await loadCart();
  } catch (error) {
    showToast(error.message, 'error');
  }
}

async function removeFromCart(productId) {
  try {
    await api(`/cart/items/${productId}`, {
      method: 'DELETE'
    });
    await loadCart();
    showToast('Item removed from cart', 'success');
  } catch (error) {
    showToast(error.message, 'error');
  }
}

function updateCartUI() {
  const countBadge = document.getElementById('cart-count');
  const cartItems = document.getElementById('cart-items');
  const cartTotal = document.getElementById('cart-total');
  
  // Update badge
  if (state.cart.itemCount > 0) {
    countBadge.textContent = state.cart.itemCount;
    countBadge.classList.remove('hidden');
  } else {
    countBadge.classList.add('hidden');
  }
  
  // Update cart sidebar
  if (state.cart.items.length === 0) {
    cartItems.innerHTML = '<p class="text-center text-gray-400 py-8">Your cart is empty</p>';
  } else {
    cartItems.innerHTML = state.cart.items.map(item => `
      <div class="flex gap-4 mb-4 pb-4 border-b border-yellow-900/30">
        <div class="w-20 h-20 bg-gray-800 rounded overflow-hidden flex-shrink-0">
          <img src="${item.image_url || '/images/placeholder.svg'}" alt="${item.name}" class="w-full h-full object-cover" onerror="this.src='/images/placeholder.svg'">
        </div>
        <div class="flex-1">
          <h4 class="font-bold text-sm mb-1">${item.name}</h4>
          <p class="text-yellow-400 text-sm">$${item.price.toFixed(2)}</p>
          <div class="flex items-center gap-2 mt-2">
            <button onclick="updateCartItem(${item.product_id}, ${item.quantity - 1})" class="w-6 h-6 border border-yellow-900/30 rounded hover:bg-yellow-900/20" aria-label="Decrease quantity">-</button>
            <span class="w-8 text-center">${item.quantity}</span>
            <button onclick="updateCartItem(${item.product_id}, ${item.quantity + 1})" class="w-6 h-6 border border-yellow-900/30 rounded hover:bg-yellow-900/20" aria-label="Increase quantity">+</button>
            <button onclick="removeFromCart(${item.product_id})" class="ml-auto text-red-400 hover:text-red-300" aria-label="Remove item">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
              </svg>
            </button>
          </div>
        </div>
      </div>
    `).join('');
  }
  
  cartTotal.textContent = `$${state.cart.total.toFixed(2)}`;
}

function openCart() {
  document.getElementById('cart-sidebar').classList.remove('hidden');
}

function closeCart() {
  document.getElementById('cart-sidebar').classList.add('hidden');
}

// Checkout
function checkout() {
  if (!state.user) {
    showToast('Please login to checkout', 'error');
    openAuthModal('login');
    return;
  }
  
  if (state.cart.items.length === 0) {
    showToast('Your cart is empty', 'error');
    return;
  }
  
  closeCart();
  navigateTo('checkout');
}

function renderCheckoutPage(container) {
  container.innerHTML = `
    <section class="py-12 px-4">
      <div class="max-w-3xl mx-auto">
        <h1 class="text-4xl text-center mb-8">Checkout</h1>
        
        <div class="card-fantasy p-6 mb-6">
          <h2 class="text-xl font-bold mb-4">Order Summary</h2>
          <div id="checkout-items" class="space-y-4 mb-6">
            ${state.cart.items.map(item => `
              <div class="flex justify-between">
                <span>${item.name} x ${item.quantity}</span>
                <span>$${item.subtotal.toFixed(2)}</span>
              </div>
            `).join('')}
          </div>
          <div class="divider-fantasy mb-4"></div>
          <div class="flex justify-between text-xl font-bold">
            <span>Total</span>
            <span class="text-yellow-400">$${state.cart.total.toFixed(2)}</span>
          </div>
        </div>
        
        <div class="card-fantasy p-6 mb-6">
          <h2 class="text-xl font-bold mb-4">Shipping Address</h2>
          <form id="checkout-form" class="space-y-4">
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm mb-1" for="first-name">First Name</label>
                <input type="text" id="first-name" required class="input-fantasy w-full">
              </div>
              <div>
                <label class="block text-sm mb-1" for="last-name">Last Name</label>
                <input type="text" id="last-name" required class="input-fantasy w-full">
              </div>
            </div>
            <div>
              <label class="block text-sm mb-1" for="address">Address</label>
              <input type="text" id="address" required class="input-fantasy w-full">
            </div>
            <div class="grid grid-cols-3 gap-4">
              <div>
                <label class="block text-sm mb-1" for="city">City</label>
                <input type="text" id="city" required class="input-fantasy w-full">
              </div>
              <div>
                <label class="block text-sm mb-1" for="state">State</label>
                <input type="text" id="state" required class="input-fantasy w-full">
              </div>
              <div>
                <label class="block text-sm mb-1" for="zip">ZIP</label>
                <input type="text" id="zip" required class="input-fantasy w-full">
              </div>
            </div>
          </form>
        </div>
        
        <button onclick="placeOrder()" class="btn-fantasy w-full text-lg">
          Place Order
        </button>
        
        <p class="text-center text-gray-400 text-sm mt-4">
          Payment processing via Stripe (demo mode - no real charges)
        </p>
      </div>
    </section>
  `;
}

async function placeOrder() {
  if (!state.user) {
    showToast('Please login to place order', 'error');
    return;
  }
  
  const form = document.getElementById('checkout-form');
  if (!form.checkValidity()) {
    form.reportValidity();
    return;
  }
  
  const shippingAddress = `${document.getElementById('first-name').value} ${document.getElementById('last-name').value}, ${document.getElementById('address').value}, ${document.getElementById('city').value}, ${document.getElementById('state').value} ${document.getElementById('zip').value}`;
  
  showLoading(true);
  
  try {
    const data = await api('/orders/checkout', {
      method: 'POST',
      body: JSON.stringify({ shipping_address: shippingAddress })
    });
    
    showLoading(false);
    await loadCart();
    showToast('Order placed successfully!', 'success');
    
    // Show confirmation
    document.getElementById('main-content').innerHTML = `
      <section class="py-20 px-4 text-center">
        <div class="max-w-xl mx-auto">
          <div class="text-6xl mb-6">✨</div>
          <h1 class="text-4xl mb-4">Order Confirmed!</h1>
          <p class="text-gray-300 mb-8">Thank you for your order. Your items will be shipped soon.</p>
          <p class="text-yellow-400 mb-8">Order #${data.order.id}</p>
          <button onclick="navigateTo('shop')" class="btn-fantasy">
            Continue Shopping
          </button>
        </div>
      </section>
    `;
  } catch (error) {
    showLoading(false);
    showToast(error.message, 'error');
  }
}

// Lore Page
function renderLorePage(container) {
  container.innerHTML = `
    <section class="py-12 px-4">
      <div class="max-w-4xl mx-auto">
        <h1 class="text-4xl text-center mb-8">The Lore of Ories</h1>
        
        <!-- Interactive Map Placeholder -->
        <div class="card-fantasy p-8 mb-8">
          <h2 class="text-2xl mb-4">The Realms</h2>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div class="card-fantasy p-4 text-center cursor-pointer hover:border-yellow-400 transition-colors">
              <div class="text-4xl mb-2">🏔️</div>
              <h3 class="font-bold">Northern Heights</h3>
              <p class="text-sm text-gray-400">Land of dragons</p>
            </div>
            <div class="card-fantasy p-4 text-center cursor-pointer hover:border-yellow-400 transition-colors">
              <div class="text-4xl mb-2">🌲</div>
              <h3 class="font-bold">Eldwood Forest</h3>
              <p class="text-sm text-gray-400">Ancient elven realm</p>
            </div>
            <div class="card-fantasy p-4 text-center cursor-pointer hover:border-yellow-400 transition-colors">
              <div class="text-4xl mb-2">⚒️</div>
              <h3 class="font-bold">Dwarven Depths</h3>
              <p class="text-sm text-gray-400">Underground kingdom</p>
            </div>
            <div class="card-fantasy p-4 text-center cursor-pointer hover:border-yellow-400 transition-colors ${!state.user ? 'opacity-50' : ''}">
              <div class="text-4xl mb-2">🔮</div>
              <h3 class="font-bold">Arcane Sanctum</h3>
              <p class="text-sm text-gray-400">${state.user ? 'Members only' : '🔒 Members only'}</p>
            </div>
          </div>
        </div>
        
        <!-- Lore Content -->
        <div class="card-fantasy p-8 mb-8">
          <h2 class="text-2xl mb-4">The Beginning</h2>
          <p class="text-gray-300 leading-relaxed mb-4">
            In the dawn of the First Age, when stars were young and magic flowed freely through the world,
            the great creator Ories shaped the realms from the primordial chaos. With each brushstroke of
            divine power, mountains rose, forests bloomed, and the first races awakened.
          </p>
          <p class="text-gray-300 leading-relaxed mb-4">
            The Northern Heights became home to the great dragons, their scales reflecting the aurora
            that dances eternally in the sky. The Eldwood Forest sheltered the elves, whose songs
            still echo through the ancient trees. Deep beneath the earth, the dwarves built their
            magnificent halls, their forges burning bright with creative fire.
          </p>
          <p class="text-gray-300 leading-relaxed">
            And at the center of all worlds lies the Arcane Sanctum, where the secrets of creation
            itself are kept, waiting for those worthy enough to discover them...
          </p>
        </div>
        
        <!-- Premium Content Teaser -->
        ${!state.user ? `
          <div class="card-fantasy p-8 text-center glow">
            <h2 class="text-2xl mb-4">Unlock the Full Story</h2>
            <p class="text-gray-300 mb-6">
              Become a member to access exclusive lore, behind-the-scenes content, and more.
            </p>
            <button onclick="navigateTo('membership')" class="btn-fantasy">
              View Membership Tiers
            </button>
          </div>
        ` : ''}
      </div>
    </section>
  `;
}

// Membership Page
async function renderMembershipPage(container) {
  let membershipTiers = {};
  let currentMembership = null;
  
  try {
    const tiersData = await api('/membership/tiers');
    membershipTiers = tiersData.tiers;
    
    if (state.user) {
      const memberData = await api('/membership');
      currentMembership = memberData.membership;
    }
  } catch (error) {
    console.error('Error loading membership data:', error);
  }
  
  container.innerHTML = `
    <section class="py-12 px-4">
      <div class="max-w-6xl mx-auto">
        <h1 class="text-4xl text-center mb-4">Join the Inner Circle</h1>
        <p class="text-center text-gray-300 mb-12 max-w-2xl mx-auto">
          Get exclusive access to new creations, behind-the-scenes content, and special perks as part of the community.
        </p>
        
        ${currentMembership ? `
          <div class="card-fantasy p-6 mb-8 text-center">
            <p class="text-gray-300">Your current tier:</p>
            <p class="text-2xl font-bold text-yellow-400">${currentMembership.tier_name || 'Basic'}</p>
          </div>
        ` : ''}
        
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          ${Object.entries(membershipTiers).map(([key, tier]) => `
            <div class="card-fantasy p-6 ${key === 'gold' ? 'border-yellow-400 glow' : ''}">
              <h3 class="text-xl font-bold mb-2">${tier.name}</h3>
              <p class="text-3xl font-bold text-yellow-400 mb-4">
                ${tier.price === 0 ? 'Free' : `$${tier.price.toFixed(2)}`}
                <span class="text-sm text-gray-400">/month</span>
              </p>
              <ul class="space-y-2 mb-6">
                ${tier.benefits.map(benefit => `
                  <li class="flex items-start gap-2 text-sm">
                    <span class="text-yellow-400">✓</span>
                    <span class="text-gray-300">${benefit}</span>
                  </li>
                `).join('')}
              </ul>
              <button onclick="subscribeMembership('${key}')" 
                      class="${key === 'basic' ? 'btn-secondary' : 'btn-fantasy'} w-full"
                      ${currentMembership?.membership_tier === key ? 'disabled' : ''}>
                ${currentMembership?.membership_tier === key ? 'Current Plan' : tier.price === 0 ? 'Get Started' : 'Subscribe'}
              </button>
            </div>
          `).join('')}
        </div>
      </div>
    </section>
  `;
}

async function subscribeMembership(tier) {
  if (!state.user) {
    showToast('Please login to subscribe', 'error');
    openAuthModal('login');
    return;
  }
  
  try {
    await api('/membership/subscribe', {
      method: 'POST',
      body: JSON.stringify({ tier })
    });
    showToast('Membership activated!', 'success');
    navigateTo('membership');
  } catch (error) {
    showToast(error.message, 'error');
  }
}

// Profile Page
async function renderProfilePage(container) {
  if (!state.user) {
    navigateTo('home');
    return;
  }
  
  let orders = [];
  try {
    const data = await api('/orders');
    orders = data.orders;
  } catch (error) {
    console.error('Error loading orders:', error);
  }
  
  container.innerHTML = `
    <section class="py-12 px-4">
      <div class="max-w-4xl mx-auto">
        <h1 class="text-4xl text-center mb-8">My Profile</h1>
        
        <div class="grid md:grid-cols-2 gap-8">
          <!-- Profile Info -->
          <div class="card-fantasy p-6">
            <h2 class="text-xl font-bold mb-4">Account Details</h2>
            <div class="space-y-4">
              <div>
                <label class="text-sm text-gray-400">Username</label>
                <p class="text-lg">${state.user.username}</p>
              </div>
              <div>
                <label class="text-sm text-gray-400">Email</label>
                <p class="text-lg">${state.user.email}</p>
              </div>
              <div>
                <label class="text-sm text-gray-400">Role</label>
                <p class="text-lg capitalize">${state.user.role}</p>
              </div>
            </div>
            ${state.user.role === 'admin' ? `
              <button onclick="navigateTo('admin')" class="btn-fantasy w-full mt-6">
                Admin Dashboard
              </button>
            ` : ''}
            <button onclick="logout()" class="btn-secondary w-full mt-4">
              Logout
            </button>
          </div>
          
          <!-- Orders -->
          <div class="card-fantasy p-6">
            <h2 class="text-xl font-bold mb-4">Recent Orders</h2>
            ${orders.length === 0 ? `
              <p class="text-gray-400">No orders yet</p>
            ` : `
              <div class="space-y-4">
                ${orders.slice(0, 5).map(order => `
                  <div class="flex justify-between items-center p-3 bg-gray-800/50 rounded">
                    <div>
                      <p class="font-bold">Order #${order.id}</p>
                      <p class="text-sm text-gray-400">${new Date(order.created_at).toLocaleDateString()}</p>
                    </div>
                    <div class="text-right">
                      <p class="text-yellow-400">$${order.total_amount.toFixed(2)}</p>
                      <p class="text-sm capitalize ${order.status === 'delivered' ? 'text-green-400' : 'text-gray-400'}">${order.status}</p>
                    </div>
                  </div>
                `).join('')}
              </div>
            `}
          </div>
        </div>
      </div>
    </section>
  `;
}

// Admin Page
async function renderAdminPage(container) {
  if (!state.user || state.user.role !== 'admin') {
    navigateTo('home');
    showToast('Admin access required', 'error');
    return;
  }
  
  let analytics = {};
  let inventory = {};
  
  try {
    analytics = await api('/admin/analytics');
    inventory = await api('/admin/inventory');
  } catch (error) {
    console.error('Error loading admin data:', error);
  }
  
  container.innerHTML = `
    <section class="py-12 px-4">
      <div class="max-w-7xl mx-auto">
        <h1 class="text-4xl text-center mb-8">Admin Dashboard</h1>
        
        <!-- Stats Grid -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div class="card-fantasy p-4 text-center">
            <p class="text-3xl font-bold text-yellow-400">${analytics.userStats?.total_users || 0}</p>
            <p class="text-sm text-gray-400">Total Users</p>
          </div>
          <div class="card-fantasy p-4 text-center">
            <p class="text-3xl font-bold text-yellow-400">${analytics.revenueSummary?.total_orders || 0}</p>
            <p class="text-sm text-gray-400">Total Orders</p>
          </div>
          <div class="card-fantasy p-4 text-center">
            <p class="text-3xl font-bold text-yellow-400">$${(analytics.revenueSummary?.total_revenue || 0).toFixed(2)}</p>
            <p class="text-sm text-gray-400">Revenue</p>
          </div>
          <div class="card-fantasy p-4 text-center">
            <p class="text-3xl font-bold text-yellow-400">${inventory.summary?.totalProducts || 0}</p>
            <p class="text-sm text-gray-400">Products</p>
          </div>
        </div>
        
        <!-- Inventory Alerts -->
        <div class="grid md:grid-cols-2 gap-8 mb-8">
          <div class="card-fantasy p-6">
            <h2 class="text-xl font-bold mb-4 flex items-center gap-2">
              <span class="text-red-400">⚠️</span> Low Stock Items
            </h2>
            ${inventory.lowStock?.length === 0 ? `
              <p class="text-gray-400">All items well stocked</p>
            ` : `
              <div class="space-y-2">
                ${(inventory.lowStock || []).slice(0, 5).map(item => `
                  <div class="flex justify-between items-center p-2 bg-gray-800/50 rounded">
                    <span>${item.name}</span>
                    <span class="text-red-400">${item.inventory_count} left</span>
                  </div>
                `).join('')}
              </div>
            `}
          </div>
          
          <div class="card-fantasy p-6">
            <h2 class="text-xl font-bold mb-4">Top Products</h2>
            ${analytics.topProducts?.length === 0 ? `
              <p class="text-gray-400">No sales yet</p>
            ` : `
              <div class="space-y-2">
                ${(analytics.topProducts || []).slice(0, 5).map(item => `
                  <div class="flex justify-between items-center p-2 bg-gray-800/50 rounded">
                    <span>${item.name}</span>
                    <span class="text-yellow-400">${item.total_sold} sold</span>
                  </div>
                `).join('')}
              </div>
            `}
          </div>
        </div>
        
        <!-- Quick Actions -->
        <div class="card-fantasy p-6">
          <h2 class="text-xl font-bold mb-4">Quick Actions</h2>
          <div class="flex flex-wrap gap-4">
            <button onclick="openAdminModal('users')" class="btn-secondary">Manage Users</button>
            <button onclick="openAdminModal('products')" class="btn-secondary">Manage Products</button>
            <button onclick="openAdminModal('orders')" class="btn-secondary">View Orders</button>
            <button onclick="openAdminModal('fanart')" class="btn-secondary">Review Fan Art</button>
          </div>
        </div>
      </div>
    </section>
  `;
}

// Authentication
function openAuthModal(mode = 'login') {
  const modal = document.getElementById('auth-modal');
  const content = document.getElementById('auth-content');
  
  if (mode === 'login') {
    content.innerHTML = `
      <h2 class="text-2xl font-bold mb-6 text-center">Welcome Back</h2>
      <form onsubmit="handleLogin(event)" class="space-y-4">
        <div>
          <label class="block text-sm mb-1" for="login-email">Email</label>
          <input type="email" id="login-email" required class="input-fantasy w-full" autocomplete="email">
        </div>
        <div>
          <label class="block text-sm mb-1" for="login-password">Password</label>
          <input type="password" id="login-password" required class="input-fantasy w-full" autocomplete="current-password">
        </div>
        <button type="submit" class="btn-fantasy w-full">Login</button>
      </form>
      <p class="text-center text-gray-400 mt-4">
        Don't have an account? 
        <button onclick="openAuthModal('register')" class="text-yellow-400 hover:underline">Register</button>
      </p>
    `;
  } else {
    content.innerHTML = `
      <h2 class="text-2xl font-bold mb-6 text-center">Join the Adventure</h2>
      <form onsubmit="handleRegister(event)" class="space-y-4">
        <div>
          <label class="block text-sm mb-1" for="register-username">Username</label>
          <input type="text" id="register-username" required class="input-fantasy w-full" autocomplete="username">
        </div>
        <div>
          <label class="block text-sm mb-1" for="register-email">Email</label>
          <input type="email" id="register-email" required class="input-fantasy w-full" autocomplete="email">
        </div>
        <div>
          <label class="block text-sm mb-1" for="register-password">Password</label>
          <input type="password" id="register-password" required minlength="8" class="input-fantasy w-full" autocomplete="new-password">
          <p class="text-xs text-gray-400 mt-1">Minimum 8 characters</p>
        </div>
        <button type="submit" class="btn-fantasy w-full">Create Account</button>
      </form>
      <p class="text-center text-gray-400 mt-4">
        Already have an account? 
        <button onclick="openAuthModal('login')" class="text-yellow-400 hover:underline">Login</button>
      </p>
    `;
  }
  
  modal.classList.remove('hidden');
}

function closeAuthModal() {
  document.getElementById('auth-modal').classList.add('hidden');
}

async function handleLogin(event) {
  event.preventDefault();
  
  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;
  
  showLoading(true);
  
  try {
    const data = await api('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    
    localStorage.setItem('token', data.token);
    state.user = data.user;
    
    // Merge cart if we had a guest cart
    try {
      await api('/cart/merge', {
        method: 'POST',
        body: JSON.stringify({ session_id: sessionId })
      });
    } catch (e) {
      // Ignore merge errors
    }
    
    await loadCart();
    updateUserUI();
    closeAuthModal();
    showLoading(false);
    showToast('Welcome back!', 'success');
  } catch (error) {
    showLoading(false);
    showToast(error.message, 'error');
  }
}

async function handleRegister(event) {
  event.preventDefault();
  
  const username = document.getElementById('register-username').value;
  const email = document.getElementById('register-email').value;
  const password = document.getElementById('register-password').value;
  
  showLoading(true);
  
  try {
    const data = await api('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, email, password })
    });
    
    localStorage.setItem('token', data.token);
    state.user = data.user;
    
    await loadCart();
    updateUserUI();
    closeAuthModal();
    showLoading(false);
    showToast('Account created successfully!', 'success');
  } catch (error) {
    showLoading(false);
    showToast(error.message, 'error');
  }
}

function logout() {
  localStorage.removeItem('token');
  state.user = null;
  state.cart = { items: [], total: 0, itemCount: 0 };
  updateUserUI();
  updateCartUI();
  navigateTo('home');
  showToast('Logged out successfully', 'success');
}

function updateUserUI() {
  const userMenu = document.getElementById('user-menu');
  const userProfile = document.getElementById('user-profile');
  const usernameDisplay = document.getElementById('username-display');
  
  if (state.user) {
    userMenu.classList.add('hidden');
    userProfile.classList.remove('hidden');
    usernameDisplay.textContent = state.user.username;
  } else {
    userMenu.classList.remove('hidden');
    userProfile.classList.add('hidden');
  }
}

function toggleProfileMenu() {
  // For simplicity, navigate to profile page
  navigateTo('profile');
}

// Mobile Menu
function toggleMobileMenu() {
  const menu = document.getElementById('mobile-menu');
  menu.classList.toggle('hidden');
}

// Toast Notifications
function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast-fantasy flex items-center gap-3 min-w-64 ${type === 'error' ? 'border-red-500' : type === 'success' ? 'border-green-500' : ''}`;
  
  const icon = type === 'error' ? '❌' : type === 'success' ? '✅' : 'ℹ️';
  toast.innerHTML = `
    <span>${icon}</span>
    <span class="flex-1">${message}</span>
    <button onclick="this.parentElement.remove()" class="p-1 hover:text-yellow-400" aria-label="Close notification">×</button>
  `;
  
  container.appendChild(toast);
  
  setTimeout(() => {
    toast.remove();
  }, 5000);
}

// Loading Overlay
function showLoading(show) {
  const overlay = document.getElementById('loading-overlay');
  if (show) {
    overlay.classList.remove('hidden');
  } else {
    overlay.classList.add('hidden');
  }
}

// Admin Modal Placeholder
function openAdminModal(type) {
  showToast(`${type} management coming soon!`, 'info');
}

// Make functions globally available
window.navigateTo = navigateTo;
window.openCart = openCart;
window.closeCart = closeCart;
window.openAuthModal = openAuthModal;
window.closeAuthModal = closeAuthModal;
window.handleLogin = handleLogin;
window.handleRegister = handleRegister;
window.logout = logout;
window.toggleProfileMenu = toggleProfileMenu;
window.toggleMobileMenu = toggleMobileMenu;
window.addToCart = addToCart;
window.updateCartItem = updateCartItem;
window.removeFromCart = removeFromCart;
window.checkout = checkout;
window.placeOrder = placeOrder;
window.openProductModal = openProductModal;
window.closeProductModal = closeProductModal;
window.updateModalQuantity = updateModalQuantity;
window.addToCartFromModal = addToCartFromModal;
window.filterProducts = filterProducts;
window.loadProducts = loadProducts;
window.subscribeMembership = subscribeMembership;
window.openAdminModal = openAdminModal;
