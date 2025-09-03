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

//  AUTH HELPERS 
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

// --- MODIFIED FUNCTIONS START HERE ---

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
        // MODIFIED: This now creates a button that opens the login modal.
        const loginBtn = document.createElement('button');
        loginBtn.className = "btn btn--primary btn-nav-login";
        loginBtn.innerHTML = `Login / Sign Up`;
        loginBtn.onclick = openLoginModal; // Opens the modal instead of redirecting
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
        // MODIFIED: This now creates a button that opens the login modal for mobile.
        const loginBtn = document.createElement('button');
        loginBtn.className = 'btn btn--primary btn-nav-login mobile-login';
        loginBtn.innerHTML = `Login`;
        loginBtn.onclick = function () {
            openLoginModal();
            // Close the mobile menu when opening the login modal
            document.getElementById('nav-menu-mobile').classList.remove('active');
            document.getElementById('nav-hamburger').classList.remove('active');
        };
        mobileLoginLi.appendChild(loginBtn);
    }
}

// LOGIN MODAL EVENTS
function setupLoginModalEvents() {
    const modal = document.getElementById('login-modal');
    if (!modal) return;
    
    const modalClose = document.getElementById('login-modal-close');
    const modalOverlay = document.getElementById('login-modal-overlay');

    if (modalClose) modalClose.addEventListener('click', closeLoginModal);
    if (modalOverlay) modalOverlay.addEventListener('click', closeLoginModal);

    // MODIFIED: Add event listeners for the new auth provider links inside the modal
    modal.addEventListener('click', function (e) {
        const target = e.target.closest('.login-option');
        if (target) {
            // The href is already on the anchor tag, so a click will redirect.
            // No custom window.location.href logic is needed here.
            // This event listener setup is minimal but effective.
            closeLoginModal(); // Close modal after click
        }
    });
}

// --- MODIFIED FUNCTIONS END HERE ---

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
    setupLoginModalEvents(); // This will now wire up the modal correctly
    setupMobileNavScroll();
    setupSmoothScroll();
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
        <button class="btn btn--primary car-card__book" 
                data-car-name="${car.name}" 
                data-car-price="${safePrice}">Book Now</button>
      </div>
    `;
    return card;
}

// EVENT LISTENERS
function setupEventListeners() {
    document.getElementById('cars-container')?.addEventListener('click', (e) => {
        if (e.target.classList.contains('car-card__book')) {
            if (!isUserLoggedIn()) {
                showPopupMessage("Please login to book a car.");
                openLoginModal(); // MODIFIED TO OPEN MODAL
                return;
            }
            const name = e.target.getAttribute('data-car-name');
            const price = parseInt(e.target.getAttribute('data-car-price')) || 0;
            openBookingModal(name, price);
        }
    });

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
             closeLoginModal(); // Also close login modal on escape
        }
    });

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

// MOBILE NAV SCROLL
function setupMobileNavScroll() {
    const header = document.getElementById('header');
    function getHeaderHeight() {
        return header ? header.offsetHeight : 60;
    }
    document.querySelectorAll('#nav-menu-mobile .nav__link').forEach(link => {
        link.addEventListener('click', function(e) {
            const hash = link.getAttribute('href');
            if (hash && hash.startsWith('#')) {
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

// BOOKING FORM SUBMIT
async function handleBookingSubmit(e) {
    e.preventDefault();
    if (!isUserLoggedIn()) {
        showPopupMessage("Please login to book a car.");
        openLoginModal(); // Open login modal if not logged in
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
        } else {
            if (res.status === 401) { logout(); }
            let errText = 'Booking failed. Please try again.';
            try {
                errText = (await res.json()).message || errText;
            } catch (e) {}
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
    if(modal) {
        modal.classList.remove('visible');
        modal.classList.add('hidden');
        document.getElementById('booking-form')?.reset();
        document.body.style.overflow = 'auto';
        currentSelectedCar = null;
    }
}

// LOGIN MODAL SUPPORT
function openLoginModal() {
    const modal = document.getElementById('login-modal');
    if(modal) {
        modal.classList.remove('hidden');
        modal.classList.add('visible');
        document.body.style.overflow = 'hidden';
    }
}

function closeLoginModal() {
    const modal = document.getElementById('login-modal');
    if(modal) {
        modal.classList.add('hidden');
        modal.classList.remove('visible');
        document.body.style.overflow = 'auto';
    }
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
function initializeTheme() {
    const savedTheme = localStorage.getItem('theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    document.documentElement.setAttribute('data-color-scheme', savedTheme);
    const themeSwitch = document.getElementById('theme-switch');
    const mobileThemeSwitch = document.getElementById('mobile-theme-switch');
    if(themeSwitch) themeSwitch.checked = savedTheme === 'dark';
    if(mobileThemeSwitch) mobileThemeSwitch.checked = savedTheme === 'dark';
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
                    if (hamburger) hamburger.classList.remove('active');
                }
                const headerOffset = 60;
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
