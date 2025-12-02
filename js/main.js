console.log("SafeWave App Iniciada");

// --- Global Variables ---
let appData = null;
let currentChart = null; // Store chart instance to destroy/update
let captchaCorrectAnswer = 0; // Store captcha answer

// --- Initialization ---
document.addEventListener('DOMContentLoaded', async () => {
    // Mobile menu toggle logic
    initMobileMenu();

    // Fetch Data
    try {
        const response = await fetch('data/datos.json');
        if (!response.ok) throw new Error('Error al cargar datos.json');
        appData = await response.json();
        console.log("Datos cargados:", appData);

        // Initialize Page Specific Logic
        // We call functions, and let them handle their own existence checks (Double Shielding)
        initCarousel();
        cargarConsejo();
        cargarPilares();
        cargarAutores();
        iniciarSimulador();
        iniciarContacto();

    } catch (error) {
        console.error("Error inicializando la app:", error);
    }
});

// --- Mobile Menu ---
function initMobileMenu() {
    const btn = document.querySelector('button[aria-controls="mobile-menu"]');
    const menu = document.getElementById('mobile-menu');

    if (btn && menu) {
        btn.addEventListener('click', () => {
            const expanded = btn.getAttribute('aria-expanded') === 'true' || false;
            btn.setAttribute('aria-expanded', !expanded);
            menu.classList.toggle('hidden');
        });
    }
}


// --- Pillars Logic ---
function cargarPilares() {
    const container = document.getElementById('pilares-container');
    if (!container) return; // Shield

    if (!appData || !appData.pilares || appData.pilares.length === 0) {
        container.innerHTML = '<p class="text-center col-span-3">No hay información de pilares.</p>';
        return;
    }

    container.innerHTML = appData.pilares.map(pilar => `
        <div class="bg-white p-8 rounded-xl shadow-md hover:shadow-xl transition-shadow duration-300 text-center border border-gray-100 group">
            <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 text-primary mb-6 group-hover:scale-110 transition-transform duration-300">
                <i class="${pilar.icono} text-3xl"></i>
            </div>
            <h3 class="text-xl font-bold text-gray-800 mb-3">${pilar.titulo}</h3>
            <p class="text-gray-600 leading-relaxed">
                ${pilar.descripcion}
            </p>
        </div>
    `).join('');
}

// --- Carousel Logic ---
function initCarousel() {
    const slidesContainer = document.getElementById('carousel-slides');
    const indicatorsContainer = document.getElementById('carousel-indicators');
    const prevBtn = document.getElementById('prev-slide');
    const nextBtn = document.getElementById('next-slide');

    // Shield: If any critical element is missing, stop.
    if (!slidesContainer || !indicatorsContainer || !prevBtn || !nextBtn) return;
    if (!appData || !appData.carrusel || appData.carrusel.length === 0) return;

    let currentSlide = 0;
    const slides = appData.carrusel;
    const totalSlides = slides.length;
    let autoPlayInterval;

    // Render Slides
    slidesContainer.innerHTML = slides.map((slide, index) => `
        <div class="absolute inset-0 transition-opacity duration-1000 ease-in-out ${index === 0 ? 'opacity-100' : 'opacity-0'} slide-item" data-index="${index}">
            <img src="${slide.src}" alt="${slide.titulo}" class="w-full h-full object-cover">
            <div class="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
                <div class="text-center text-white px-4">
                    <h2 class="text-4xl font-bold mb-2 drop-shadow-lg">${slide.titulo}</h2>
                    <p class="text-xl drop-shadow-md">${slide.descripcion}</p>
                </div>
            </div>
        </div>
    `).join('');

    // Render Indicators
    indicatorsContainer.innerHTML = slides.map((_, index) => `
        <button class="w-3 h-3 rounded-full transition-colors ${index === 0 ? 'bg-white' : 'bg-white bg-opacity-50 hover:bg-opacity-75'}" data-index="${index}" aria-label="Slide ${index + 1}"></button>
    `).join('');

    const slideElements = document.querySelectorAll('.slide-item');
    const indicatorElements = indicatorsContainer.querySelectorAll('button');

    function showSlide(index) {
        // Handle wrapping
        if (index >= totalSlides) currentSlide = 0;
        else if (index < 0) currentSlide = totalSlides - 1;
        else currentSlide = index;

        // Update DOM
        slideElements.forEach(el => el.classList.remove('opacity-100'));
        slideElements.forEach(el => el.classList.add('opacity-0'));

        if (slideElements[currentSlide]) {
            slideElements[currentSlide].classList.remove('opacity-0');
            slideElements[currentSlide].classList.add('opacity-100');
        }

        // Update Indicators
        indicatorElements.forEach((el, idx) => {
            if (idx === currentSlide) {
                el.classList.remove('bg-opacity-50');
                el.classList.add('bg-white');
            } else {
                el.classList.add('bg-opacity-50');
                el.classList.remove('bg-white');
            }
        });
    }

    function nextSlide() {
        showSlide(currentSlide + 1);
    }

    function prevSlide() {
        showSlide(currentSlide - 1);
    }

    function startAutoPlay() {
        stopAutoPlay(); // Clear existing to be safe
        autoPlayInterval = setInterval(nextSlide, 5000);
    }

    function stopAutoPlay() {
        if (autoPlayInterval) clearInterval(autoPlayInterval);
    }

    // Event Listeners
    nextBtn.addEventListener('click', () => {
        nextSlide();
        startAutoPlay(); // Reset timer on manual interaction
    });

    prevBtn.addEventListener('click', () => {
        prevSlide();
        startAutoPlay();
    });

    indicatorElements.forEach(ind => {
        ind.addEventListener('click', (e) => {
            const index = parseInt(e.target.dataset.index);
            showSlide(index);
            startAutoPlay();
        });
    });

    // Start
    startAutoPlay();
}

// --- Read More Logic ---
// Exposed globally because it's called via onclick in HTML
window.toggleLeerMas = function () {
    const textElement = document.getElementById('intro-text');
    const btnElement = document.getElementById('btn-leer-mas');

    if (!textElement || !btnElement) return;

    // Check if currently expanded (we use max-h style to toggle)
    const isExpanded = textElement.style.maxHeight === 'none';

    if (isExpanded) {
        // Collapse
        textElement.style.maxHeight = '4.5em'; // Approx 3 lines depending on line-height
        btnElement.textContent = 'Leer más';
    } else {
        // Expand
        textElement.style.maxHeight = 'none';
        btnElement.textContent = 'Leer menos';
    }
};

// --- Tip of the Day Logic ---
function cargarConsejo() {
    const container = document.getElementById('consejo-texto');
    if (!container) return; // Shield

    if (!appData || !appData.consejos || appData.consejos.length === 0) {
        container.textContent = "No hay consejos disponibles.";
        return;
    }

    const randomIndex = Math.floor(Math.random() * appData.consejos.length);
    const consejo = appData.consejos[randomIndex];

    container.textContent = `"${consejo}"`;
}

// --- Authors Logic ---
function cargarAutores() {
    const container = document.getElementById('autores-container');
    if (!container) return; // Shield

    if (!appData || !appData.autores || appData.autores.length === 0) {
        container.innerHTML = '<p class="text-center col-span-2">No hay información de autores.</p>';
        return;
    }

    container.innerHTML = appData.autores.map(autor => `
        <div class="bg-white rounded-xl shadow-lg overflow-hidden transform hover:scale-105 transition-transform duration-300 border border-gray-100">
            <div class="bg-primary h-24 relative">
                <div class="absolute -bottom-12 left-1/2 transform -translate-x-1/2">
                    <div class="w-24 h-24 rounded-full border-4 border-white bg-gray-200 overflow-hidden flex items-center justify-center">
                        <img src="${autor.foto}" alt="${autor.nombre}" class="w-full h-full object-cover">
                    </div>
                </div>
            </div>
            <div class="pt-16 pb-6 px-6 text-center">
                <h3 class="text-xl font-bold text-primary mb-1">${autor.nombre}</h3>
                <p class="text-secondary font-medium text-sm mb-4">${autor.rol}</p>
                <p class="text-gray-600 text-sm mb-4">Estudiante de Ingeniería del Software en la UTN. Apasionado por la tecnología y la seguridad.</p>
                <a href="mailto:${autor.correo}" class="inline-flex items-center text-accent hover:text-yellow-600 font-medium transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    ${autor.correo}
                </a>
            </div>
        </div>
    `).join('');
}

// --- Simulator Logic (Phase 3) ---
function iniciarSimulador() {
    const select = document.getElementById('playa-select');
    if (!select) return; // Shield

    if (!appData || !appData.playas || appData.playas.length === 0) {
        select.innerHTML = '<option disabled>No hay datos de playas</option>';
        return;
    }

    // Populate Select
    select.innerHTML = appData.playas.map(playa => `
        <option value="${playa.id}">${playa.nombre}</option>
    `).join('');

    // Event Listener
    select.addEventListener('change', (e) => {
        actualizarSimulador(e.target.value);
    });

    // Initial Load (First beach)
    actualizarSimulador(appData.playas[0].id);
}

function actualizarSimulador(playaId) {
    if (!appData || !appData.playas) return;
    const playa = appData.playas.find(p => p.id === playaId);
    if (!playa) return;

    // Elements
    const oleajeEl = document.getElementById('resultado-oleaje');
    const banderaTextoEl = document.getElementById('resultado-bandera-texto');
    const banderaColorEl = document.getElementById('resultado-bandera-color');
    const riskCard = document.getElementById('card-riesgo');
    const riskText = document.getElementById('resultado-riesgo');
    const imagenEl = document.getElementById('resultado-imagen');
    const videoEl = document.getElementById('resultado-video');

    // Shield: Check if all elements exist
    if (!oleajeEl || !banderaTextoEl || !banderaColorEl || !riskCard || !riskText) return;

    // Update Multimedia if elements exist
    if (imagenEl && playa.imagen) {
        imagenEl.src = playa.imagen;
        imagenEl.alt = `Vista de ${playa.nombre}`;
    }

    if (videoEl && playa.video_id) {
        // Construct YouTube Embed URL
        videoEl.src = `https://www.youtube.com/embed/${playa.video_id}?rel=0`;
    }

    // Update Text Fields
    oleajeEl.textContent = playa.oleaje;
    banderaTextoEl.textContent = playa.bandera.significado;

    // Update Flag Color Indicator
    const flagColorMap = {
        'red': 'bg-red-500',
        'yellow': 'bg-yellow-400',
        'green': 'bg-green-500'
    };
    const colorClass = flagColorMap[playa.bandera.color] || 'bg-gray-300';
    banderaColorEl.className = `w-4 h-4 rounded-full block ${colorClass}`;

    // Update Risk Card Styling
    // Reset classes
    riskCard.className = 'rounded-lg p-6 border-2 shadow-sm transition-colors duration-300';

    if (playa.bandera.color === 'red') {
        riskCard.classList.add('bg-red-50', 'border-red-500');
        riskText.className = "text-xl font-bold text-red-700 mt-2";
    } else if (playa.bandera.color === 'yellow') {
        riskCard.classList.add('bg-yellow-50', 'border-yellow-500');
        riskText.className = "text-xl font-bold text-yellow-700 mt-2";
    } else {
        riskCard.classList.add('bg-green-50', 'border-green-500');
        riskText.className = "text-xl font-bold text-green-700 mt-2";
    }

    // Use specific risk description if available, otherwise fallback to generic
    if (playa.descripcion_riesgo) {
        riskText.textContent = playa.descripcion_riesgo;
        riskText.classList.remove('text-xl'); // Adjust size for longer text
        riskText.classList.add('text-md');
    } else {
        // Fallback
        if (playa.bandera.color === 'red') riskText.textContent = "ALTO RIESGO - NO INGRESAR";
        else if (playa.bandera.color === 'yellow') riskText.textContent = "PRECAUCIÓN - NADAR CON CUIDADO";
        else riskText.textContent = "CONDICIONES FAVORABLES";
    }

    // Update Chart
    actualizarGrafico(playa);
}

function actualizarGrafico(playa) {
    const canvas = document.getElementById('grafico-accidentes');
    if (!canvas) return; // Shield

    const ctx = canvas.getContext('2d');

    // Destroy previous chart if exists
    if (currentChart) {
        currentChart.destroy();
    }

    // Create new chart
    currentChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'],
            datasets: [{
                label: `Incidentes en ${playa.nombre} (Últimos 6 meses)`,
                data: playa.estadisticas,
                backgroundColor: '#06b6d4', // Secondary color
                borderColor: '#1e3a8a',     // Primary color
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Número de Incidentes'
                    }
                }
            },
            plugins: {
                legend: {
                    labels: {
                        font: {
                            family: 'Inter'
                        }
                    }
                }
            }
        }
    });
}

// --- Contact Form Logic (Phase 4) ---
function iniciarContacto() {
    // 1. Initialize Map
    initMap();

    // 2. Generate Captcha (Removed - using Google reCAPTCHA)
    // generarCaptcha();

    // 3. Form Validation
    const form = document.getElementById('contacto-form');
    if (form) {
        form.addEventListener('submit', validarFormulario);
    }

    // Modal Close Button
    const btnCerrar = document.getElementById('btn-cerrar-modal');
    if (btnCerrar) {
        btnCerrar.addEventListener('click', () => {
            const modal = document.getElementById('modal-exito');
            if (modal) modal.classList.add('hidden');
        });
    }
}

function initMap() {
    if (!document.getElementById('map')) return; // Shield

    // Coordinates for Costa Rica (San José approx)
    const lat = 9.7489;
    const lng = -83.7534;

    const map = L.map('map').setView([lat, lng], 8);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    L.marker([lat, lng]).addTo(map)
        .bindPopup('SafeWave CR - Oficinas Centrales (UTN)')
        .openPopup();
}

// function generarCaptcha() { ... } Removed in favor of Google reCAPTCHA

function validarFormulario(e) {
    e.preventDefault();
    let isValid = true;

    // Helper to show/hide error
    const toggleError = (id, show) => {
        const el = document.getElementById(id);
        const errorText = document.getElementById(`error-${id}`);
        if (!el || !errorText) return; // Shield

        if (show) {
            el.classList.add('border-red-500');
            el.classList.remove('border-gray-300');
            errorText.classList.remove('hidden');
        } else {
            el.classList.remove('border-red-500');
            el.classList.add('border-gray-300');
            errorText.classList.add('hidden');
        }
    };

    // 1. Validate Name
    const nombreEl = document.getElementById('nombre');
    if (nombreEl) {
        const nombre = nombreEl.value.trim();
        if (nombre === '') {
            toggleError('nombre', true);
            isValid = false;
        } else {
            toggleError('nombre', false);
        }
    }

    // 2. Validate Email
    const correoEl = document.getElementById('correo');
    if (correoEl) {
        const correo = correoEl.value.trim();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(correo)) {
            toggleError('correo', true);
            isValid = false;
        } else {
            toggleError('correo', false);
        }
    }

    // 3. Validate Subject
    const asuntoEl = document.getElementById('asunto');
    if (asuntoEl) {
        const asunto = asuntoEl.value.trim();
        if (asunto === '') {
            toggleError('asunto', true);
            isValid = false;
        } else {
            toggleError('asunto', false);
        }
    }

    // 4. Validate Message
    const mensajeEl = document.getElementById('mensaje');
    if (mensajeEl) {
        const mensaje = mensajeEl.value.trim();
        if (mensaje === '') {
            toggleError('mensaje', true);
            isValid = false;
        } else {
            toggleError('mensaje', false);
        }
    }

    // 5. Validate Captcha (Google reCAPTCHA v2)
    const errorText = document.getElementById('error-captcha');

    // Check if reCAPTCHA is loaded
    if (typeof grecaptcha !== 'undefined') {
        const response = grecaptcha.getResponse();
        if (response.length === 0) {
            if (errorText) {
                errorText.classList.remove('hidden');
                errorText.textContent = "Por favor, verifica que no eres un robot.";
            }
            isValid = false;
        } else {
            if (errorText) errorText.classList.add('hidden');
        }
    } else {
        console.warn("reCAPTCHA no cargado");
        // Optional: Fail safe or allow if script blocked? 
        // For strict security, we fail.
        if (errorText) {
            errorText.classList.remove('hidden');
            errorText.textContent = "Error al cargar el captcha. Intente recargar la página.";
        }
        isValid = false;
    }

    if (isValid) {
        const nombreVal = nombreEl ? nombreEl.value : 'Usuario';
        const asuntoVal = asuntoEl ? asuntoEl.value : 'Mensaje';
        mostrarModalExito(nombreVal, asuntoVal);
        e.target.reset();
        if (typeof grecaptcha !== 'undefined') grecaptcha.reset(); // Reset reCAPTCHA
    }
}

function mostrarModalExito(nombre, asunto) {
    const modal = document.getElementById('modal-exito');
    const modalNombre = document.getElementById('modal-nombre');
    const modalAsunto = document.getElementById('modal-asunto');

    if (modal && modalNombre && modalAsunto) {
        modalNombre.textContent = nombre;
        modalAsunto.textContent = asunto;
        modal.classList.remove('hidden');
    }
}
