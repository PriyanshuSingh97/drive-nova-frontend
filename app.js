// STORE JWT TOKEN IMMEDIATELY 
(function saveTokenFromUrlImmediately() { 
  const params = new URLSearchParams(window.location.search); 
  const token = params.get('token'); 
  if (token) { 
    localStorage.setItem('jwt_token', token); 
    window.history.replaceState({}, document.title, window.location.pathname); 
  } 
})(); 

const API_BASE_URL = "https://drivenova-backend.onrender.com"; 
let currentFilter = 'all'; 
let isDarkMode = false; 
let currentSelectedCar = null; 

// AUTH HELPERS 
function authHeaders() { 
  const token = localStorage.getItem('jwt_token'); 
  return token ? { Authorization: `Bearer ${token}` } : {}; 
} 

function isUserLoggedIn() { 
  return !!localStorage.getItem('jwt_token'); 
} 

function logout() { 
  localStorage.removeItem('jwt_token'); 
  renderAuthButtons(); 
  renderMobileAuthButton(); 
  showPopupMessage("Logged out successfully."); 
} 

// RENDERING AUTH BUTTONS DESKTOP 
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
    // Login/Signup button
    const loginBtn = document.createElement('button'); 
    loginBtn.textContent = 'Login/Signup'; 
    loginBtn.className = 'btn btn--primary btn-nav-login'; 
    loginBtn.onclick = openLoginModal; 
    desktopLoginLi.appendChild(loginBtn); 
  } 
} 

// RENDERING AUTH BUTTONS MOBILE 
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
    // Login/Signup button for mobile
    const loginBtn = document.createElement('button'); 
    loginBtn.textContent = 'Login/Signup'; 
    loginBtn.className = 'btn btn--primary btn-nav-login mobile-login'; 
    loginBtn.onclick = openLoginModal; 
    mobileLoginLi.appendChild(loginBtn); 
  } 
}

// AUTH TAB SWITCHING
function showAuthTab(tab) {
    // Update tab buttons
    document.querySelectorAll('.auth-tab').forEach(btn => btn.classList.remove('active'));
    document.querySelector(`.auth-tab[onclick="showAuthTab('${tab}')"]`).classList.add('active');
    
    // Update forms
    document.querySelectorAll('.auth-form').forEach(form => form.classList.remove('active'));
    document.getElementById(`${tab}-form`).classList.add('active');
}

// EMAIL LOGIN
async function handleEmailLogin(event) {
    event.preventDefault();
    
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            localStorage.setItem('jwt_token', data.token);
            closeLoginModal();
            renderAuthButtons();
            renderMobileAuthButton();
            showPopupMessage('Login successful!');
        } else {
            showPopupMessage(data.error || 'Login failed');
        }
    } catch (error) {
        console.error('Login error:', error);
        showPopupMessage('Login failed. Please try again.');
    }
}

// EMAIL REGISTRATION
async function handleEmailRegister(event) {
    event.preventDefault();
    
    const username = document.getElementById('register-username').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    
    if (password.length < 6) {
        showPopupMessage('Password must be at least 6 characters long');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, email, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            localStorage.setItem('jwt_token', data.token);
            closeLoginModal();
            renderAuthButtons();
            renderMobileAuthButton();
            showPopupMessage('Registration successful!');
        } else {
            showPopupMessage(data.error || 'Registration failed');
        }
    } catch (error) {
        console.error('Registration error:', error);
        showPopupMessage('Registration failed. Please try again.');
    }
}

// INITIALIZATION
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

// FETCH & RENDER CARS
async function fetchAndRenderCars(filter = 'all') {
  const carsContainer = document.getElementById('cars-container');
  if (!carsContainer) return;

  // HTML for the loading spinner
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
    const response = await fetch(`${API_BASE_URL}/api/cars${filter !== 'all' ? `?category=${filter}` : ''}`);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const cars = await response.json();

    carsContainer.innerHTML = '';
    if (cars.length === 0) {
      // If no cars are found, display a message in the container
      carsContainer.innerHTML = '<div class="loading-container"><p class="loading-text">No cars found in this category.</p></div>';
    } else {
      // Render car cards
      cars.forEach((car, index) => {
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

// CAR CARD CREATION
function createCarCard(car) {
  const safePrice = Number(car.pricePerDay) || 0;

  // Default specs if not provided in the data
  const specs = car.specs || { fuel: 'N/A', transmission: 'N/A', seats: 'N/A' };

  const carSpecsHTML = `
    <div class="car-card__specs">
      <span class="spec-item">⛽ ${specs.fuel}</span>
      <span class="spec-item">⚙️ ${specs.transmission}</span>
      <span class="spec-item">👥 ${specs.seats} seats</span>
    </div>
  `;

  const featuresHTML = car.features && car.features.length > 0
    ? `
      <div class="car-card__features-section">
        <h4 class="car-card__features-label">Features:</h4>
        <div class="car-card__features-tags">
          ${car.features.map(f => `<span class="feature-tag">${f}</span>`).join('')}
        </div>
      </div>`
    : '';

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
        <span class="car-card__brand-tag">${car.brand}</span>
      </div>
      <div class="car-card__price">₹${safePrice.toLocaleString()} per day</div>
      ${carSpecsHTML}
      ${featuresHTML}
      <button class="btn btn--primary car-card__book" 
              data-car-name="${car.name}" 
              data-car-price="${safePrice}">Book Now</button>
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

  document.getElementById('booking-form')?.addEventListener('submit', handleBookingSubmit); // Booking form submission
  document.getElementById('contact-form')?.addEventListener('submit', handleContactSubmit); // Contact form submission

  document.addEventListener('keydown', (e) => { // Escape key closes modal
    if (e.key === 'Escape') {
      closeBookingModal();
      closeLoginModal();
    }
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

// MOBILE NAV SCROLL
function setupMobileNavScroll() {
  function isMobile() {
    return window.innerWidth <= 768;
  }
  function getHeaderHeight() {
    return header ? header.offsetHeight : 60;
  }
  document.querySelectorAll('#nav-menu-mobile .nav__link').forEach(link => {
    link.addEventListener('click', function(e) {
      const hash = link.getAttribute('href');
      if (hash && hash.startsWith('#') && isMobile()) {
        const section = document.querySelector(hash);
        if (section) {
          e.preventDefault();
          const y = section.getBoundingClientRect().top + window.pageYOffset - getHeaderHeight() - 8;
          window.scrollTo({ top: y, behavior: 'smooth' });
        }
      }
    });
  });
}

// LOGIN MODAL EVENTS
function setupLoginModalEvents() {
  const modalClose = document.getElementById('login-modal-close');
  const modalOverlay = document.querySelector('#login-modal .modal__overlay');
  if (modalClose) modalClose.addEventListener('click', closeLoginModal);
  if (modalOverlay) modalOverlay.addEventListener('click', closeLoginModal);

  // Email login form
  const loginForm = document.getElementById('email-login-form');
  if (loginForm) {
      loginForm.addEventListener('submit', handleEmailLogin);
  }
  
  // Email register form
  const registerForm = document.getElementById('email-register-form');
  if (registerForm) {
      registerForm.addEventListener('submit', handleEmailRegister);
  }

  // Handle Google Login
  const googleBtn = document.getElementById('google-login');
  if (googleBtn) {
    googleBtn.addEventListener('click', function () {
      window.location.href = API_BASE_URL + "/api/auth/google";
    });
  }

  // Handle GitHub Login
  const githubBtn = document.getElementById('github-login');
  if (githubBtn) {
    githubBtn.addEventListener('click', function () {
      window.location.href = API_BASE_URL + "/api/auth/github";
    });
  }
}

// LOGIN MODAL FUNCTIONS
function openLoginModal() {
  const loginModal = document.getElementById('login-modal');
  if (loginModal) {
    loginModal.classList.add('visible');
    document.body.style.overflow = 'hidden';
  }
}

function closeLoginModal() {
  const loginModal = document.getElementById('login-modal');
  if (loginModal) {
    loginModal.classList.remove('visible');
    document.body.style.overflow = 'auto';
  }
}

// BOOKING FORM SUBMIT
async function handleBookingSubmit(e) {
  e.preventDefault();
  if (!isUserLoggedIn()) {
    showPopupMessage("Please login to book a car.");
    return;
  }

  const form = e.target;
  const formData = new FormData(form);

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

// CONTACT FORM SUBMIT
async function handleContactSubmit(e) {
  e.preventDefault();
  const form = e.target;
  const formData = new FormData(form);
  const contactData = Object.fromEntries(formData);

  // Show loading message
  showPopupMessage("Sending message...", false);

  try {
    const res = await fetch(`${API_BASE_URL}/api/contact`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(contactData),
    });

    if (res.ok) {
      form.reset();
      showPopupMessage("Message sent successfully!", true);
    } else {
      showPopupMessage("Failed to send message. Please try again.", true);
    }
  } catch (err) {
    console.error('Contact error:', err);
    showPopupMessage("Network error! Please try again.", true);
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

  if (!input || !resultsContainer) return;

  // Fetch all cars once to use for local search suggestions
  async function fetchAllCarsForSearch() {
    if (allCars.length > 0) return;
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
