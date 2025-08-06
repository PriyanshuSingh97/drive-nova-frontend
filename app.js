const API_BASE_URL = "https://your-render-backend-url.onrender.com"; // <-- Replace with your Render backend URL

let currentFilter = 'all';
let currentSelectedCar = null;
let isDarkMode = false;

// ===== INIT APP =====
document.addEventListener('DOMContentLoaded', function () {
  initializeTheme();
  fetchAndRenderCars();
  setupEventListeners();
  setupScrollEffects();
  setDefaultDates();
  setupScrollAnimations();
  setupSearch('hero-search-input', 'hero-search-results', 'hero-search-button');
});

// ===== FETCH CARS FROM BACKEND (MongoDB Atlas) =====
async function fetchAndRenderCars(filter = 'all') {
  try {
    const res = await fetch(`${API_BASE_URL}/api/cars`);
    const cars = await res.json();

    const carsContainer = document.getElementById('cars-container');
    if (!carsContainer) return;
    carsContainer.innerHTML = '';

    const filteredCars = (filter === 'all') ? cars : cars.filter(car => car.category === filter);
    filteredCars.forEach((car, index) => {
      const card = createCarCard(car);
      carsContainer.appendChild(card);
      setTimeout(() => card.classList.add('visible'), index * 50);
    });
  } catch (err) {
    console.error('Failed to fetch cars:', err);
  }
}

// ===== CREATE CAR CARD =====
function createCarCard(car) {
  const safePrice = Number(car.pricePerDay) || 0;
  const card = document.createElement('div');
  card.className = 'car-card';
  card.setAttribute('data-animate', 'true');
  card.innerHTML = `
    <div class="car-card__image">
      <img src="${car.imageUrl}" alt="${car.name}" loading="lazy">
    </div>
    <div class="car-card__content">
      <div class="car-card__header">
        <h3 class="car-card__name">${car.name}</h3>
        <div class="car-card__price">₹${safePrice.toLocaleString()}<br><small>per day</small></div>
      </div>
      <div class="car-card__features">
        ${(car.features || []).map(f => `<span class="feature-tag">${f}</span>`).join('')}
      </div>
      <button class="btn btn--primary car-card__book" data-car-name="${car.name}" data-car-price="${safePrice}">Book Now</button>
    </div>
  `;
  return card;
}

// ===== EVENT LISTENERS =====
function setupEventListeners() {
  // Car booking button click
  document.getElementById('cars-container')?.addEventListener('click', (e) => {
    if (e.target.classList.contains('car-card__book')) {
      const name = e.target.getAttribute('data-car-name');
      const price = parseInt(e.target.getAttribute('data-car-price')) || 0;
      openBookingModal(name, price);
    }
  });

  // Filter buttons
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', function () {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      currentFilter = this.getAttribute('data-filter');
      fetchAndRenderCars(currentFilter);
    });
  });

  // Booking modal close
  document.getElementById('modal-close')?.addEventListener('click', closeBookingModal);
  document.getElementById('modal-overlay')?.addEventListener('click', closeBookingModal);
  ['book-pickup-date', 'book-dropoff-date', 'driver-service', 'gps-service', 'insurance-service']
    .forEach(id => document.getElementById(id)?.addEventListener('change', updateBookingTotal));

  // Booking form submission
  document.getElementById('booking-form')?.addEventListener('submit', handleBookingSubmit);

  // Contact form submission
  document.getElementById('contact-form')?.addEventListener('submit', handleContactSubmit);

  // Escape key closes modal
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeBookingModal();
  });

  // Theme toggles
  if (themeSwitch) themeSwitch.addEventListener('change', toggleTheme);
  if (mobileThemeSwitch) mobileThemeSwitch.addEventListener('change', toggleTheme);

  // Hamburger menu
  const hamburger = document.getElementById('nav-hamburger');
  const navMenuMobile = document.getElementById('nav-menu-mobile');
  if (hamburger && navMenuMobile) {
    hamburger.addEventListener('click', function () {
      this.classList.toggle('active');
      navMenuMobile.classList.toggle('active');
    });
    document.querySelectorAll('#nav-menu-mobile .nav__link').forEach(link => {
      link.addEventListener('click', () => {
        hamburger.classList.remove('active');
        navMenuMobile.classList.remove('active');
      });
    });
  }
}

// ===== BOOKING FORM SUBMIT (MongoDB) =====
async function handleBookingSubmit(e) {
  e.preventDefault();
  const form = e.target;
  const formData = new FormData(form);
  const bookingData = Object.fromEntries(formData);
  bookingData.services = formData.getAll('services[]');

  const formStatus = document.getElementById('form-status');
  formStatus.textContent = 'Sending booking...';
  formStatus.style.color = '#ffa500';

  try {
    const res = await fetch(`${API_BASE_URL}/api/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bookingData),
    });

    if (res.ok) {
      formStatus.textContent = 'Booking Confirmed!';
      formStatus.style.color = '#28a745';
      form.reset();
      closeBookingModal();
      showPopupMessage("Booking Confirmed! We'll contact you shortly.");
    } else {
      formStatus.textContent = 'Booking failed. Please try again.';
      formStatus.style.color = '#dc3545';
    }
  } catch (err) {
    console.error('Booking error:', err);
    formStatus.textContent = 'Network error! Please try again.';
    formStatus.style.color = '#dc3545';
  }
}

// ===== CONTACT FORM SUBMIT (MongoDB) =====
async function handleContactSubmit(e) {
  e.preventDefault();
  const form = e.target;
  const formData = new FormData(form);
  const contactData = Object.fromEntries(formData);

  const contactStatus = document.getElementById('contact-status') || document.createElement('p');
  contactStatus.id = 'contact-status';
  form.appendChild(contactStatus);
  contactStatus.textContent = 'Sending message...';
  contactStatus.style.color = '#ffa500';

  try {
    const res = await fetch(`${API_BASE_URL}/api/contact`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(contactData),
    });

    if (res.ok) {
      contactStatus.textContent = 'Message sent successfully!';
      contactStatus.style.color = '#28a745';
      form.reset();
    } else {
      contactStatus.textContent = 'Failed to send message. Try again.';
      contactStatus.style.color = '#dc3545';
    }
  } catch (err) {
    console.error('Contact error:', err);
    contactStatus.textContent = 'Network error! Please try again.';
    contactStatus.style.color = '#dc3545';
  }
}

// ===== MODAL FUNCTIONS =====
function openBookingModal(name, price) {
  currentSelectedCar = { name, price: Number(price) || 0 };
  const modal = document.getElementById('booking-modal');
  document.getElementById('book-car').value = name;
  setDefaultDates();
  updateBookingTotal();
  modal.classList.remove('hidden');
  modal.classList.add('visible');
  document.body.style.overflow = 'hidden';
}

function closeBookingModal() {
  const modal = document.getElementById('booking-modal');
  modal.classList.remove('visible');
  modal.classList.add('hidden');
  document.getElementById('booking-form')?.reset();
  document.body.style.overflow = 'auto';
  currentSelectedCar = null;
}

// ===== UPDATE BOOKING TOTAL =====
function updateBookingTotal() {
  if (!currentSelectedCar) return;
  const start = new Date(document.getElementById('book-pickup-date').value);
  const end = new Date(document.getElementById('book-dropoff-date').value);

  if (isNaN(start) || isNaN(end) || end <= start) {
    document.getElementById('booking-total-display').textContent = '₹0';
    document.getElementById('booking-total').value = '₹0';
    return;
  }

  const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
  let total = currentSelectedCar.price * days;
  if (document.getElementById('driver-service')?.checked) total += 1500 * days;
  if (document.getElementById('gps-service')?.checked) total += 500 * days;
  if (document.getElementById('insurance-service')?.checked) total += 500 * days;

  document.getElementById('booking-total-display').textContent = `₹${total.toLocaleString()}`;
  document.getElementById('booking-total').value = `₹${total.toLocaleString()}`;
}

// ===== POPUP MESSAGE =====
function showPopupMessage(message, isTemporary = true) {
  const popup = document.getElementById('booking-popup');
  if (!popup) return;
  popup.textContent = message;
  popup.classList.add('visible');
  if (isTemporary) setTimeout(() => popup.classList.remove('visible'), 3000);
}

// ===== THEME =====
const themeSwitch = document.getElementById('theme-switch');
const mobileThemeSwitch = document.getElementById('mobile-theme-switch');

function initializeTheme() {
  const savedTheme = localStorage.getItem('drivenova-theme');
  isDarkMode = savedTheme ? savedTheme === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
  updateTheme();
  if (themeSwitch) themeSwitch.checked = isDarkMode;
  if (mobileThemeSwitch) mobileThemeSwitch.checked = isDarkMode;
}

function toggleTheme() {
  isDarkMode = !isDarkMode;
  updateTheme();
  localStorage.setItem('drivenova-theme', isDarkMode ? 'dark' : 'light');
  if (themeSwitch) themeSwitch.checked = isDarkMode;
  if (mobileThemeSwitch) mobileThemeSwitch.checked = isDarkMode;
}

function updateTheme() {
  document.documentElement.setAttribute('data-color-scheme', isDarkMode ? 'dark' : 'light');
}

// ===== SCROLL EFFECTS =====
function setupScrollEffects() {
  const header = document.getElementById('header');
  window.addEventListener('scroll', () => {
    header?.classList.toggle('scrolled', window.scrollY > 100);
  });
}

function setupScrollAnimations() {
  const animateElements = document.querySelectorAll('[data-animate]');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) entry.target.classList.add('animate');
    });
  }, { threshold: 0.1 });
  animateElements.forEach(el => observer.observe(el));
}

// ===== DATE DEFAULTS =====
function setDefaultDates() {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const format = (d) => d.toISOString().split('T')[0];

  const pickup = document.getElementById('book-pickup-date');
  const dropoff = document.getElementById('book-dropoff-date');
  if (pickup && dropoff) {
    pickup.value = format(today);
    pickup.min = format(today);
    dropoff.value = format(tomorrow);
    dropoff.min = format(tomorrow);
  }
}

// ===== SEARCH BAR =====
function setupSearch(inputId, resultsId, buttonId) {
  const searchInput = document.getElementById(inputId);
  const searchButton = document.getElementById(buttonId);
  const searchResults = document.getElementById(resultsId);
  if (!searchInput || !searchResults) return;

  const performSearch = () => {
    const query = searchInput.value.toLowerCase();
    searchResults.innerHTML = '';
    const items = document.querySelectorAll('.car-card__name');
    const matches = [];
    items.forEach((el) => {
      if (el.textContent.toLowerCase().includes(query)) {
        matches.push(el.textContent);
      }
    });

    if (matches.length > 0) {
      matches.slice(0, 5).forEach((name) => {
        const item = document.createElement('div');
        item.className = 'search-result-item';
        item.textContent = name;
        item.addEventListener('click', () => {
          searchInput.value = name;
          searchResults.style.display = 'none';
          scrollToCar(name);
        });
        searchResults.appendChild(item);
      });
    } else {
      const noResult = document.createElement('div');
      noResult.className = 'search-result-item';
      noResult.textContent = 'No cars found';
      searchResults.appendChild(noResult);
    }
    searchResults.style.display = 'block';
  };

  searchInput.addEventListener('input', performSearch);
  searchButton?.addEventListener('click', performSearch);
  document.addEventListener('click', (e) => {
    if (!searchInput.contains(e.target) && !searchResults.contains(e.target)) {
      searchResults.style.display = 'none';
    }
  });
}

function scrollToCar(name) {
  const cards = document.querySelectorAll('.car-card');
  cards.forEach((card) => {
    const carName = card.querySelector('.car-card__name');
    if (carName && carName.textContent === name) {
      card.scrollIntoView({ behavior: 'smooth', block: 'center' });
      card.classList.add('highlighted-card');
      setTimeout(() => card.classList.remove('highlighted-card'), 1500);
    }
  });
}

// ==========================
// Login Modal Functionality
// ==========================
function openLoginModal() {
  document.getElementById('login-modal').classList.add('visible');
}
function closeLoginModal() {
  document.getElementById('login-modal').classList.remove('visible');
}

document.addEventListener('DOMContentLoaded', function () {
  var btnDesktop = document.getElementById('login-btn');
  var btnMobile = document.getElementById('login-btn-mobile');
  if (btnDesktop) btnDesktop.addEventListener('click', function(e) { e.preventDefault(); openLoginModal(); });
  if (btnMobile) btnMobile.addEventListener('click', function(e) { e.preventDefault(); openLoginModal(); });

  // Close modal when clicking close button or overlay
  var modalClose = document.getElementById('login-modal-close');
  var modalOverlay = document.querySelector('#login-modal .modal__overlay');
  if(modalClose) modalClose.addEventListener('click', closeLoginModal);
  if(modalOverlay) modalOverlay.addEventListener('click', closeLoginModal);

  // Google login logic
  var googleBtn = document.getElementById('google-login');
  if(googleBtn) {
    googleBtn.addEventListener('click', function() {
      window.location.href = API_BASE_URL + "/api/auth/google";
    });
  }
});
