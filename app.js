// STORE JWT TOKEN IMMEDIATELY ON PAGE LOAD (before anything else) 
(function saveTokenFromUrlImmediately() {
  const m = window.location.search.match(/[?&]token=([^&]+)/);
  if (m) {
    localStorage.setItem('jwt_token', m[1]);
    const p = new URLSearchParams(window.location.search);
    p.delete('token');
    window.history.replaceState({}, document.title, window.location.pathname + (p.toString() ? `?${p}` : ''));
  }
})();

const API_BASE_URL = "https://drivenova-backend.onrender.com";

let currentFilter = 'all';
let currentSelectedCar = null;
let isDarkMode = false;

// AUTH HELPERS
function authHeaders() {
  const token = localStorage.getItem('jwt_token');
  return token ? { 'Authorization': 'Bearer ' + token } : {};
}
function isUserLoggedIn() {
  return !!localStorage.getItem('jwt_token');
}
function logout() {
  localStorage.removeItem('jwt_token');
  location.reload();
}

// RENDER LOGIN/LOGOUT BUTTON IN DESKTOP NAV 
function renderAuthButtons() {
  const desktopLoginLi = document.getElementById('nav-menu-desktop-login');
  if (!desktopLoginLi) return;
  desktopLoginLi.innerHTML = '';
  if (isUserLoggedIn()) {
    const logoutBtn = document.createElement('button');
    logoutBtn.textContent = 'Logout';
    logoutBtn.className = 'btn btn--primary btn-nav-login';
    logoutBtn.onclick = logout;
    desktopLoginLi.appendChild(logoutBtn);
  } else {
    const a = document.createElement('a');
    a.href = API_BASE_URL + "/api/auth/google";
    a.className = "btn btn--primary btn-nav-login";
    a.innerHTML = `<img src="https://res.cloudinary.com/dtvyar9as/image/upload/v1756804446/g-logo_vap9w9.png" style="height:18px;margin-right:8px;vertical-align:-3px">Google Login`;
    desktopLoginLi.appendChild(a);
  }
}

//  RENDERS MOBILE NAV LOGIN/LOGOUT BUTTON
function renderMobileAuthButton() {
  const mobileLoginLi = document.getElementById('nav-menu-mobile-login');
  if (!mobileLoginLi) return;
  mobileLoginLi.innerHTML = '';
  if (isUserLoggedIn()) {
    const logoutBtn = document.createElement('button');
    logoutBtn.textContent = 'Logout';
    logoutBtn.className = 'btn btn--primary btn-nav-login mobile-login';
    logoutBtn.onclick = function () {
      logout();
      document.getElementById('nav-menu-mobile').classList.remove('active');
      document.getElementById('nav-hamburger').classList.remove('active');
    };
    mobileLoginLi.appendChild(logoutBtn);
  } else {
    const loginBtn = document.createElement('a');
    loginBtn.href = API_BASE_URL + "/api/auth/google";
    loginBtn.className = 'btn btn--primary btn-nav-login mobile-login';
    loginBtn.innerHTML = `<img src="https://res.cloudinary.com/dtvyar9as/image/upload/v1756804446/g-logo_vap9w9.png" style="height:18px;margin-right:8px;vertical-align:-3px">Google Login`;
    mobileLoginLi.appendChild(loginBtn);
  }
}

// INIT APP
document.addEventListener('DOMContentLoaded', function () {
  initializeTheme();
  fetchAndRenderCars();
  setupEventListeners();
  setupScrollEffects();
  setDefaultDates();
  setupScrollAnimations();
  setupSearch('hero-search-input', 'hero-search-results', 'hero-search-button');
  renderAuthButtons();
  renderMobileAuthButton();
  setupLoginModalEvents();
  setupMobileNavScroll();
  setupSmoothScroll();
});

// FETCH CARS FROM BACKEND
async function fetchAndRenderCars(filter = 'all') {
  const carsContainer = document.getElementById('cars-container');
  if (!carsContainer) return;

  // HTML for the centered loading spinner
  const loadingHTML = `
    <div class="loading-container">
      <div class="loading-spinner">
        <div></div><div></div><div></div><div></div>
        <div></div><div></div><div></div><div></div>
        <div></div><div></div><div></div><div></div>
      </div>
      <p class="loading-text">Loading cars...</p>
    </div>
  `;

  // Show loading indicator
  carsContainer.innerHTML = loadingHTML;

  try {
    const res = await fetch(`${API_BASE_URL}/api/cars`);
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    const cars = await res.json();
    
    // Clear the container before rendering cars
    carsContainer.innerHTML = '';

    const filteredCars = (filter === 'all') ? cars : cars.filter(car => car.category.toLowerCase() === filter.toLowerCase());

    if (filteredCars.length === 0) {
      // If no cars are found, display a message in the container
      carsContainer.innerHTML = '<div class="loading-container"><p class="loading-text">No cars found in this category.</p></div>';
    } else {
      // Render car cards
      filteredCars.forEach((car, index) => {
        const card = createCarCard(car);
        carsContainer.appendChild(card);
        setTimeout(() => card.classList.add('visible'), index * 50);
      });
    }

  } catch (err) {
    console.error('Failed to fetch cars:', err);
    // Display an error message within the container
    carsContainer.innerHTML = '<div class="loading-container"><p class="loading-text error">Failed to load cars. Please try again later.</p></div>';
  }
}



// CREATE CAR CARD
function createCarCard(car) {
  const safePrice = Number(car.pricePerDay) || 0;
  const card = document.createElement('div');
  card.className = 'car-card';
  card.setAttribute('data-animate', 'true');
  card.setAttribute('data-car-name', car.name);
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
        ${(Array.isArray(car.features) ? car.features : []).map(f => `<span class="feature-tag">${f}</span>`).join('')}
      </div>
      <button class="btn btn--primary car-card__book" data-car-name="${car.name}" data-car-price="${safePrice}">Book Now</button>
    </div>
  `;
  return card;
}

// EVENT LISTENERS
function setupEventListeners() {
  // Car booking button click
  document.getElementById('cars-container')?.addEventListener('click', (e) => {
    if (e.target.classList.contains('car-card__book')) {
      if (!isUserLoggedIn()) {
        showPopupMessage("Please login to book a car.");
        return;
      }
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
      renderMobileAuthButton();
    });
    document.querySelectorAll('#nav-menu-mobile .nav__link').forEach(link => {
      link.addEventListener('click', () => {
        hamburger.classList.remove('active');
        navMenuMobile.classList.remove('active');
      });
    });
  }
}

// MOBILE NAV LINK SCROLL LOGIC (ONLY FOR MOBILE)
function setupMobileNavScroll() {
  function isMobile() {
    // Width for mobile breakpoint
    return window.innerWidth <= 768;
  }
  function getHeaderHeight() {
    // Mobile Header Height 
    const header = document.getElementById('header');
    return header ? header.offsetHeight : 60;
  }
  document.querySelectorAll('#nav-menu-mobile .nav__link').forEach(link => {
    link.addEventListener('click', function(e) {
      const hash = link.getAttribute('href');
      if (hash && hash.startsWith('#') && isMobile()) {
        const section = document.querySelector(hash);
        if (section) {
          e.preventDefault();
          // Compute correct offset (header height)
          const y = section.getBoundingClientRect().top + window.pageYOffset - getHeaderHeight() - -3; // -8px visual gap
          window.scrollTo({ top: y, behavior: 'smooth' });
        }
      }
    });
  });
}

// LOGIN MODAL EVENTS
function setupLoginModalEvents() {
  var modalClose = document.getElementById('login-modal-close');
  var modalOverlay = document.querySelector('#login-modal .modal__overlay');
  if (modalClose) modalClose.addEventListener('click', closeLoginModal);
  if (modalOverlay) modalOverlay.addEventListener('click', closeLoginModal);

  var googleBtn = document.getElementById('google-login');
  if (googleBtn) {
    googleBtn.addEventListener('click', function () {
      window.location.href = API_BASE_URL + "/api/auth/google";
    });
  }
}

// BOOKING FORM SUBMIT (MongoDB)
async function handleBookingSubmit(e) {
  e.preventDefault();
  if (!isUserLoggedIn()) {
    showPopupMessage("Please login to book a car.");
    return;
  }
  const form = e.target;
  const formData = new FormData(form);

  // Strong serialization!
  const bookingData = {
    name: formData.get('name'),
    email: formData.get('email'),
    phone: formData.get('phone'),
    car_model: formData.get('car_model'),
    pickup_date: formData.get('pickup_date'),
    dropoff_date: formData.get('dropoff_date'),
    pickup_location: formData.get('pickup_location'),
    dropoff_location: formData.get('dropoff_location'),
    services: formData.getAll('services[]'),
    total_amount: Number(formData.get('total_amount'))
  };

  const formStatus = document.getElementById('form-status');
  formStatus.textContent = 'Sending booking...';
  formStatus.style.color = '#ffa500';

  try {
    const res = await fetch(`${API_BASE_URL}/api/bookings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders()
      },
      body: JSON.stringify(bookingData),
    });

    if (res.ok) {
      formStatus.textContent = 'Booking Confirmed!';
      formStatus.style.color = '#28a745';
      form.reset();
      closeBookingModal();
      showPopupMessage("Booking Confirmed! We'll contact you shortly.");
      renderMobileAuthButton(); // update Login/Logout in hamburger after booking
      renderAuthButtons();      // update Login/Logout on desktop
    } else {
      if (res.status === 401) { logout(); }
      let errText = 'Booking failed. Please try again.';
      try {
        errText = (await res.json()).message || errText;
      } catch (e) { }
      formStatus.textContent = errText;
      formStatus.style.color = '#dc3545';
    }
  } catch (err) {
    console.error('Booking error:', err);
    formStatus.textContent = 'Network error! Please try again.';
    formStatus.style.color = '#dc3545';
  }
}

//  CONTACT FORM SUBMIT (MongoDB)
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

// MODAL FUNCTIONS
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

// UPDATE BOOKING TOTAL
function updateBookingTotal() {
  if (!currentSelectedCar) return;
  const start = new Date(document.getElementById('book-pickup-date').value);
  const end = new Date(document.getElementById('book-dropoff-date').value);

  if (isNaN(start) || isNaN(end) || end <= start) {
    document.getElementById('booking-total-display').textContent = '₹0';
    document.getElementById('booking-total').value = '0';
    return;
  }

  const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
  let total = currentSelectedCar.price * days;
  if (document.getElementById('driver-service')?.checked) total += 1500 * days;
  if (document.getElementById('gps-service')?.checked) total += 500 * days;
  if (document.getElementById('insurance-service')?.checked) total += 500 * days;

  document.getElementById('booking-total-display').textContent = `₹${total.toLocaleString()}`;
  document.getElementById('booking-total').value = total;
}

// POPUP MESSAGE
function showPopupMessage(message, isTemporary = true) {
  const popup = document.getElementById('booking-popup');
  if (!popup) return;
  popup.textContent = message;
  popup.classList.add('visible');
  if (isTemporary) setTimeout(() => popup.classList.remove('visible'), 3000);
}

// THEME
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

// SCROLL EFFECTS
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

// DATE DEFAULTS
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

// SEARCH BAR
function setupSearch(inputId, resultsId, buttonId) {
  const input = document.getElementById(inputId);
  const resultsContainer = document.getElementById(resultsId);
  const searchButton = document.getElementById(buttonId);
  let allCars = []; // Cache for all car data
  let debounceTimer;

  // Fetch all cars once to use for local search suggestions
  async function fetchAllCarsForSearch() {
    if (allCars.length > 0) return; // Use cache if available
    try {
      const response = await fetch(`${API_BASE_URL}/api/cars`);
      if (!response.ok) throw new Error('Network response was not ok');
      allCars = await response.json();
    } catch (error) {
      console.error("Failed to fetch car list for search:", error);
    }
  }

  // Display suggestions based on the search query
  function showSuggestions(query) {
    if (!query) {
      resultsContainer.style.display = 'none';
      return;
    }
    const filteredCars = allCars.filter(car =>
      car.name.toLowerCase().includes(query.toLowerCase())
    );

    resultsContainer.innerHTML = '';
    if (filteredCars.length > 0) {
      filteredCars.forEach(car => {
        const item = document.createElement('div');
        item.className = 'search-result-item';
        item.textContent = car.name;
        // Handle click on a suggestion
        item.addEventListener('click', () => {
          input.value = car.name;
          resultsContainer.style.display = 'none';
          
          // Find the corresponding car card and scroll to it
          const carCard = document.querySelector(`.car-card[data-car-name="${car.name}"]`);
          if (carCard) {
            carCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
            // Highlight the card briefly
            carCard.classList.add('highlight');
            setTimeout(() => carCard.classList.remove('highlight'), 2000);
          }
        });
        resultsContainer.appendChild(item);
      });
      resultsContainer.style.display = 'block';
    } else {
      resultsContainer.style.display = 'none';
    }
  }
  
  // Event listener for when the user types
  input.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      showSuggestions(input.value.trim());
    }, 300); // Debounce to avoid excessive API calls on every keystroke
  });

  // Show suggestions when the input is clicked
  input.addEventListener('focus', () => {
    if (input.value.trim()) {
      showSuggestions(input.value.trim());
    }
  });

  // Hide the suggestions when the user clicks anywhere else on the page
  document.addEventListener('click', (event) => {
    if (!event.target.closest('.search-container')) { // Assumes search bar has a parent with class 'search-container'
      resultsContainer.style.display = 'none';
    }
  });

  // Initial fetch of car data when the page loads
  fetchAllCarsForSearch();
}

// SMOOTH SCROLL FOR FOOTER AND NAV LINKS (MOBILE)
function setupSmoothScroll() {
  const scrollLinks = document.querySelectorAll('a[href^="#"]');
  const mobileNav = document.getElementById('nav-menu-mobile');
  const hamburger = document.getElementById('nav-hamburger');

  scrollLinks.forEach(link => {
    link.addEventListener('click', function (e) {
      e.preventDefault(); // Stop the default anchor jump

      const targetId = this.getAttribute('href');
      const targetElement = document.querySelector(targetId);
      
      if (targetElement) {
        // Close mobile nav if it's open
        if (mobileNav && mobileNav.classList.contains('active')) {
          mobileNav.classList.remove('active');
          hamburger.classList.remove('active');
        }

        // Calculate the correct position
        const headerOffset = window.innerWidth <= 1024 ? 60 : 60; // 1st 60px offset for mobile, 2nd 60px for desktop
        const elementPosition = targetElement.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

        // Perform the smooth scroll
        window.scrollTo({
          top: offsetPosition,
          behavior: "smooth"
        });
      }
    });
  });
}


// LOGIN MODAL SUPPORT (optional, safe to ignore if not visible)
function openLoginModal() {
  document.getElementById('login-modal').classList.add('visible');
}
function closeLoginModal() {
  document.getElementById('login-modal').classList.remove('visible');
}
