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
  showPopupMessage("Logged out successfully.", "success");
}

// SPINNER HELPER
function createButtonSpinner() {
    let spinnerHtml = '<div class="spinner">';
    for (let i = 0; i < 12; i++) {
        spinnerHtml += '<div></div>';
    }
    spinnerHtml += '</div>';
    return spinnerHtml;
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
    const loginBtn = document.createElement('button');
    loginBtn.textContent = 'Login/Signup';
    loginBtn.className = 'btn btn--primary btn-nav-login mobile-login';
    loginBtn.onclick = openLoginModal;
    mobileLoginLi.appendChild(loginBtn);
  }
}

// AUTH TAB SWITCHING
function showAuthTab(tab) {
  document.querySelectorAll('.auth-tab').forEach(btn => btn.classList.remove('active'));
  document.querySelector(`.auth-tab[onclick="showAuthTab('${tab}')"]`).classList.add('active');
  document.querySelectorAll('.auth-form').forEach(form => form.classList.remove('active'));
  document.getElementById(`${tab}-form`).classList.add('active');
}

// EMAIL LOGIN
async function handleEmailLogin(event) {
    event.preventDefault();
    const loginButton = event.target.querySelector('button[type="submit"]');
    const originalButtonText = loginButton.innerHTML;

    // Show loading state
    loginButton.disabled = true;
    loginButton.innerHTML = `Logging In... ${createButtonSpinner()}`;

    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    try {
        const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const data = await response.json();
        if (response.ok) {
            localStorage.setItem('jwt_token', data.token);
            closeLoginModal();
            renderAuthButtons();
            renderMobileAuthButton();
            showPopupMessage('Login successful!', 'success');
            if (currentSelectedCar) {
                openBookingModal(currentSelectedCar.name, currentSelectedCar.pricePerDay);
            }
        } else {
            showPopupMessage(data.error || 'Login failed', 'error');
        }
    } catch (error) {
        console.error('Login error:', error);
        showPopupMessage('Login failed. Please try again.', 'error');
    } finally {
        // Restore button state
        loginButton.disabled = false;
        loginButton.innerHTML = originalButtonText;
    }
}

// EMAIL REGISTRATION
async function handleEmailRegister(event) {
    event.preventDefault();
    const registerButton = event.target.querySelector('button[type="submit"]');
    const originalButtonText = registerButton.innerHTML;

    const username = document.getElementById('register-username').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;

    if (password.length < 6) {
        showPopupMessage('Password must be at least 6 characters long', 'warning');
        return;
    }

    // Show loading state
    registerButton.disabled = true;
    registerButton.innerHTML = `Registering... ${createButtonSpinner()}`;

    try {
        const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, email, password })
        });
        const data = await response.json();
        if (response.ok) {
            localStorage.setItem('jwt_token', data.token);
            closeLoginModal();
            renderAuthButtons();
            renderMobileAuthButton();
            showPopupMessage('Registration successful!', 'success');
            if (currentSelectedCar) {
                openBookingModal(currentSelectedCar.name, currentSelectedCar.pricePerDay);
            }
        } else {
            showPopupMessage(data.error || 'Registration failed', 'error');
        }
    } catch (error) {
        console.error('Registration error:', error);
        showPopupMessage('Registration failed. Please try again.', 'error');
    } finally {
        // Restore button state
        registerButton.disabled = false;
        registerButton.innerHTML = originalButtonText;
    }
}

// Function to handle the booking click
function handleBookNowClick(car) {
  // Store the selected car globally, so we can access it after login.
  currentSelectedCar = car;
  if (!isUserLoggedIn()) {
    showPopupMessage("Please login to book a car.", "warning");
    openLoginModal(); // If not logged in, show the login modal.
  } else {
    // If already logged in, proceed directly to booking.
    openBookingModal(car.name, car.pricePerDay);
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
  
  // Check for a pending booking after OAuth redirect
  const pendingCarJSON = sessionStorage.getItem('pending_booking_car');
  if (pendingCarJSON && isUserLoggedIn()) {
    try {
        const pendingCar = JSON.parse(pendingCarJSON);
        if(pendingCar && pendingCar.name && pendingCar.pricePerDay) {
            openBookingModal(pendingCar.name, pendingCar.pricePerDay);
        }
    } catch(e) {
        console.error("Error parsing pending car from sessionStorage", e);
    } finally {
        sessionStorage.removeItem('pending_booking_car'); // Clean up
    }
  }
});

// FETCH & RENDER CARS
async function fetchAndRenderCars(filter = 'all') {
  const carsContainer = document.getElementById('cars-container');
  if (!carsContainer) return;

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

  carsContainer.innerHTML = loadingHTML;

  try {
    const response = await fetch(`${API_BASE_URL}/api/cars${filter !== 'all' ? `?category=${filter}` : ''}`);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const cars = await response.json();

    carsContainer.innerHTML = '';
    if (cars.length === 0) {
      carsContainer.innerHTML = '<div class="loading-container"><p class="loading-text">No cars found in this category.</p></div>';
    } else {
      cars.forEach((car, index) => {
        const card = createCarCard(car);
        carsContainer.appendChild(card);
        setTimeout(() => card.classList.add('visible'), index * 50);
      });
    }
  } catch (err) {
    console.error('Failed to fetch cars:', err);
    carsContainer.innerHTML = '<div class="loading-container"><p class="loading-text error">Failed to load cars. Please try again later.</p></div>';
  }
}

// CAR CARD CREATION
function createCarCard(car) {
  const safePrice = Number(car.pricePerDay) || 0;
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
      <button class="btn btn--primary car-card__book" onclick='handleBookNowClick(${JSON.stringify(car)})'>Book Now</button>
    </div>
  `;
  return card;
}

// EVENT LISTENERS
function setupEventListeners() {
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', function () {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      currentFilter = this.getAttribute('data-filter');
      fetchAndRenderCars(currentFilter);
    });
  });

  document.getElementById('modal-close')?.addEventListener('click', closeBookingModal);
  document.getElementById('modal-overlay')?.addEventListener('click', closeBookingModal);

  ['book-pickup-date', 'book-dropoff-date', 'driver-service', 'gps-service', 'insurance-service']
    .forEach(id => document.getElementById(id)?.addEventListener('change', updateBookingTotal));

  document.getElementById('booking-form')?.addEventListener('submit', handleBookingSubmit);
  document.getElementById('contact-form')?.addEventListener('submit', handleContactSubmit);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeBookingModal();
      closeLoginModal();
    }
  });

  const themeSwitch = document.getElementById('theme-switch');
  const mobileThemeSwitch = document.getElementById('mobile-theme-switch');
  if (themeSwitch) themeSwitch.addEventListener('change', toggleTheme);
  if (mobileThemeSwitch) mobileThemeSwitch.addEventListener('change', toggleTheme);

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
  const header = document.getElementById('header');
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

  const loginForm = document.getElementById('login-form');
  if (loginForm) {
      loginForm.addEventListener('submit', handleEmailLogin);
  }
  
  const registerForm = document.getElementById('register-form');
  if (registerForm) {
      registerForm.addEventListener('submit', handleEmailRegister);
  }

  const googleBtn = document.getElementById('google-login');
  if (googleBtn) {
    googleBtn.addEventListener('click', function () {
      if (currentSelectedCar) {
        sessionStorage.setItem('pending_booking_car', JSON.stringify(currentSelectedCar));
      }
      window.location.href = API_BASE_URL + "/api/auth/google";
    });
  }

  const githubBtn = document.getElementById('github-login');
  if (githubBtn) {
    githubBtn.addEventListener('click', function () {
      if (currentSelectedCar) {
        sessionStorage.setItem('pending_booking_car', JSON.stringify(currentSelectedCar));
      }
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

// BOOKING FORM SUBMIT - FIXED VERSION
async function handleBookingSubmit(e) {
  e.preventDefault();
  if (!isUserLoggedIn()) {
    showPopupMessage("Please login to book a car.", "warning");
    return;
  }

  const form = e.target;
  const formData = new FormData(form);
  const submitButton = form.querySelector('button[type="submit"]');
  const originalButtonText = submitButton.innerHTML;

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
  
  // Show loading state
  submitButton.disabled = true;
  submitButton.innerHTML = `Processing Booking... ${createButtonSpinner()}`;
  
  if (formStatus) {
    formStatus.textContent = 'Sending booking...';
    formStatus.style.color = '#ffa500';
  }

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
      const result = await res.json();
      
      if (formStatus) {
        formStatus.textContent = 'Booking Confirmed!';
        formStatus.style.color = '#28a745';
      }
      
      form.reset();
      closeBookingModal();
      
      // Show success popup message
      showPopupMessage("Booking Confirmed! We will contact you shortly.", "success");
      
      renderMobileAuthButton();
      renderAuthButtons();
      
      // Clear selected car
      currentSelectedCar = null;
      
    } else {
      if (res.status === 401) { 
        logout(); 
        showPopupMessage("Session expired. Please login again.", "warning");
        return;
      }
      
      let errText = 'Booking failed. Please try again.';
      try {
        const errorData = await res.json();
        errText = errorData.message || errText;
      } catch (e) { 
        console.error('Error parsing response:', e);
      }
      
      if (formStatus) {
        formStatus.textContent = errText;
        formStatus.style.color = '#dc3545';
      }
      
      showPopupMessage(errText, "error");
    }
  } catch (err) {
    console.error('Booking error:', err);
    const errorMessage = 'Network error! Please try again.';
    
    if (formStatus) {
      formStatus.textContent = errorMessage;
      formStatus.style.color = '#dc3545';
    }
    
    showPopupMessage(errorMessage, "error");
  } finally {
    // Reset button state
    submitButton.disabled = false;
    submitButton.innerHTML = originalButtonText;
  }
}

// CONTACT FORM SUBMIT
async function handleContactSubmit(e) {
  e.preventDefault();
  const form = e.target;
  const formData = new FormData(form);
  const contactData = Object.fromEntries(formData);

  showPopupMessage("Sending message...", "info");

  try {
    const res = await fetch(`${API_BASE_URL}/api/contact`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(contactData),
    });

    if (res.ok) {
      form.reset();
      showPopupMessage("Message sent successfully!", "success");
    } else {
      showPopupMessage("Failed to send message. Please try again.", "error");
    }
  } catch (err) {
    console.error('Contact error:', err);
    showPopupMessage("Network error! Please try again.", "error");
  }
}

// MODAL FUNCTIONS
function openBookingModal(name, price) {
  const carToBook = currentSelectedCar || { name, price: Number(price) || 0 };
  currentSelectedCar = carToBook;

  const modal = document.getElementById('booking-modal');
  document.getElementById('book-car').value = carToBook.name;
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
  let total = (Number(currentSelectedCar.pricePerDay) || Number(currentSelectedCar.price)) * days;
  if (document.getElementById('driver-service')?.checked) total += 1500 * days;
  if (document.getElementById('gps-service')?.checked) total += 500 * days;
  if (document.getElementById('insurance-service')?.checked) total += 500 * days;

  document.getElementById('booking-total-display').textContent = `₹${total.toLocaleString()}`;
  document.getElementById('booking-total').value = total;
}

// POPUP MESSAGE - UPDATED VERSION
function showPopupMessage(message, type = 'info') {
    // Remove any existing popup messages
    const existingPopups = document.querySelectorAll('.popup-message');
    existingPopups.forEach(popup => popup.remove());
    
    const popup = document.createElement('div');
    popup.className = `popup-message popup-${type}`;
    popup.textContent = message;
    
    document.body.appendChild(popup);
    
    // Trigger the visible state
    setTimeout(() => {
        popup.classList.add('visible');
    }, 10);
    
    // Remove after 4 seconds for success messages, 3 seconds for others
    const duration = type === 'success' ? 4000 : 3000;
    setTimeout(() => {
        popup.classList.remove('visible');
        setTimeout(() => {
            if (popup.parentNode) {
                popup.parentNode.removeChild(popup);
            }
        }, 300);
    }, duration);
}

// THEME
function initializeTheme() {
  const savedTheme = localStorage.getItem('drivenova-theme');
  isDarkMode = savedTheme ? savedTheme === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
  updateTheme();
  const themeSwitch = document.getElementById('theme-switch');
  const mobileThemeSwitch = document.getElementById('mobile-theme-switch');
  if (themeSwitch) themeSwitch.checked = isDarkMode;
  if (mobileThemeSwitch) mobileThemeSwitch.checked = isDarkMode;
}

function toggleTheme() {
  isDarkMode = !isDarkMode;
  updateTheme();
  localStorage.setItem('drivenova-theme', isDarkMode ? 'dark' : 'light');
  const themeSwitch = document.getElementById('theme-switch');
  const mobileThemeSwitch = document.getElementById('mobile-theme-switch');
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
  let allCars = [];
  let debounceTimer;

  if (!input || !resultsContainer) return;

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

        item.addEventListener('click', () => {
          input.value = car.name;
          resultsContainer.style.display = 'none';

          const carCard = document.querySelector(`.car-card[data-car-name="${car.name}"]`);
          if (carCard) {
            carCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
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

  input.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      showSuggestions(input.value.trim());
    }, 300);
  });

  input.addEventListener('focus', () => {
    if (input.value.trim()) {
      showSuggestions(input.value.trim());
    }
  });

  document.addEventListener('click', (event) => {
    if (!event.target.closest('.search-container')) {
      resultsContainer.style.display = 'none';
    }
  });

  fetchAllCarsForSearch();
}

// SMOOTH SCROLL FOR FOOTER AND NAV LINKS (MOBILE)
function setupSmoothScroll() {
  const scrollLinks = document.querySelectorAll('a[href^="#"]');
  const mobileNav = document.getElementById('nav-menu-mobile');
  const hamburger = document.getElementById('nav-hamburger');

  scrollLinks.forEach(link => {
    link.addEventListener('click', function (e) {
      e.preventDefault();
      const targetId = this.getAttribute('href');
      const targetElement = document.querySelector(targetId);
      if (targetElement) {

        if (mobileNav && mobileNav.classList.contains('active')) {
          mobileNav.classList.remove('active');
          hamburger.classList.remove('active');
        }
        const headerOffset = window.innerWidth <= 1024 ? 60 : 60;
        const elementPosition = targetElement.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

        window.scrollTo({
          top: offsetPosition,
          behavior: "smooth"
        });
      }
    });
  });
}
