console.log("SafeWave App Iniciada - Versión Final");

// --- Variables Globales ---
let appData = null;
let currentChart = null; // Instancia del gráfico
let autoPlayInterval;    // Control del carrusel

// --- Inicialización ---
document.addEventListener('DOMContentLoaded', async () => {
    // Menú móvil
    initMobileMenu();

    // Carga de Datos (JSON)
    try {
        const response = await fetch('data/datos.json');
        if (!response.ok) throw new Error('Error al cargar datos.json');
        appData = await response.json();
        console.log("Datos cargados correctamente");

        // --- PÁGINA DE INICIO ---
        initCarousel();             // Carrusel con transición suave
        cargarCintaAlertas();       // Ticker de noticias
        cargarMonitorEstadistico(); // Dashboard de estadísticas
        cargarPilares();            // Tarjetas de pilares
        cargarConsejo();            // Consejo del día

        // --- PÁGINA ACERCA DE ---
        cargarAutores();

        // --- PÁGINA CENTRO DE SEGURIDAD ---
        cargarGuiaBanderas();       // Guía interactiva
        iniciarSimulador();         // Simulador de playa

        // --- PÁGINA CONTACTO ---
        iniciarContacto();          // Mapa y validaciones

    } catch (error) {
        console.error("Error inicializando la app:", error);
    }
});

// --- Menú Móvil ---
function initMobileMenu() {
    const btn = document.querySelector('button[aria-controls="mobile-menu"]');
    const menu = document.getElementById('mobile-menu');

    if (btn && menu) {
        btn.addEventListener('click', () => {
            menu.classList.toggle('hidden');
        });
    }
}


// ==========================================
// SECCIÓN 1: PÁGINA DE INICIO
// ==========================================

// --- Carrusel ---
function initCarousel() {
    const slidesContainer = document.getElementById('carousel-slides');
    const indicatorsContainer = document.getElementById('carousel-indicators');
    
    if (!slidesContainer || !indicatorsContainer || !appData?.carrusel) return;

    // Renderizar Slides
    slidesContainer.innerHTML = appData.carrusel.map((slide, i) => `
        <div class="absolute inset-0 transition-opacity duration-700 ease-in-out ${i === 0 ? 'opacity-100 z-10' : 'opacity-0 z-0'} slide-item" data-index="${i}">
            <img src="${slide.src}" alt="${slide.titulo}" class="w-full h-full object-cover brightness-75">
            <div class="absolute inset-0 flex flex-col items-center justify-center text-center text-white p-4 bg-black/30">
                <h2 class="text-4xl md:text-5xl font-bold mb-4 drop-shadow-lg">${slide.titulo}</h2>
                <p class="text-xl md:text-2xl drop-shadow-md max-w-2xl">${slide.descripcion}</p>
            </div>
        </div>
    `).join('');

    // Renderizar Indicadores
    indicatorsContainer.innerHTML = appData.carrusel.map((_, i) => `
        <button class="w-3 h-3 rounded-full transition-all ${i === 0 ? 'bg-secondary w-6' : 'bg-white/50 hover:bg-white'}" data-index="${i}" aria-label="Slide ${i + 1}"></button>
    `).join('');

    // Lógica de Control
    let currentSlide = 0;
    const items = document.querySelectorAll('.slide-item');
    const dots = indicatorsContainer.querySelectorAll('button');
    
    const showSlide = (index) => {
        if (index >= items.length) index = 0;
        if (index < 0) index = items.length - 1;
        
        items.forEach(el => { el.classList.remove('opacity-100', 'z-10'); el.classList.add('opacity-0', 'z-0'); });
        dots.forEach(d => { d.classList.remove('bg-secondary', 'w-6'); d.classList.add('bg-white/50'); });
        
        items[index].classList.remove('opacity-0', 'z-0');
        items[index].classList.add('opacity-100', 'z-10');
        dots[index].classList.remove('bg-white/50');
        dots[index].classList.add('bg-secondary', 'w-6');
        
        currentSlide = index;
    };

    // Event Listeners
    document.getElementById('next-slide')?.addEventListener('click', () => { showSlide(currentSlide + 1); resetTimer(); });
    document.getElementById('prev-slide')?.addEventListener('click', () => { showSlide(currentSlide - 1); resetTimer(); });
    dots.forEach((dot, idx) => dot.addEventListener('click', () => { showSlide(idx); resetTimer(); }));

    // Auto Play
    const startTimer = () => { autoPlayInterval = setInterval(() => showSlide(currentSlide + 1), 5000); };
    const resetTimer = () => { clearInterval(autoPlayInterval); startTimer(); };
    startTimer();
}

// --- Cinta de Alertas (Ticker) ---
function cargarCintaAlertas() {
    const container = document.getElementById('cinta-alertas');
    if (!container || !appData?.playas) return;

    const alertas = appData.playas.map(playa => {
        let icon = playa.bandera.color === 'red' ? '<i class="fa-solid fa-circle text-red-500"></i>' : 
                  (playa.bandera.color === 'yellow' ? '<i class="fa-solid fa-circle text-yellow-400"></i>' : 
                   '<i class="fa-solid fa-circle text-green-500"></i>');
        return `<span class="mx-6 font-medium flex items-center gap-2 inline-flex">${icon} ${playa.nombre}: ${playa.bandera.significado.toUpperCase()}</span>`;
    }).join(' | ');

    container.innerHTML = `<div class="inline-block">${alertas} | ${alertas}</div>`;
}

// --- Monitor Estadístico ---
function cargarMonitorEstadistico() {
    const container = document.getElementById('stats-dashboard');
    if (!container || !appData?.playas) return;

    const total = appData.playas.length;
    const highRisk = appData.playas.filter(p => p.bandera.color === 'red').length;
    const mediumRisk = appData.playas.filter(p => p.bandera.color === 'yellow').length;
    const safe = total - (highRisk + mediumRisk);

    const stats = [
        { label: 'Playas Monitoreadas', val: total, icon: 'fa-umbrella-beach', color: 'text-blue-400' },
        { label: 'Alto Riesgo', val: highRisk, icon: 'fa-triangle-exclamation', color: 'text-red-500' },
        { label: 'Precaución', val: mediumRisk, icon: 'fa-flag', color: 'text-yellow-400' },
        { label: 'Seguras', val: safe, icon: 'fa-check-circle', color: 'text-green-500' }
    ];

    container.innerHTML = stats.map(stat => `
        <div class="bg-white/20 backdrop-blur-sm rounded-xl p-4 border border-white/30 hover:bg-white/30 transition-colors">
            <i class="fa-solid ${stat.icon} ${stat.color} text-3xl mb-2 drop-shadow-sm"></i>
            <div class="text-3xl font-bold text-white drop-shadow-md">${stat.val}</div>
            <div class="text-xs text-blue-100 uppercase tracking-widest mt-1 font-semibold">${stat.label}</div>
        </div>
    `).join('');
}

// --- Pilares ---
function cargarPilares() {
    const container = document.getElementById('pilares-container');
    if (!container || !appData?.pilares) return;

    container.innerHTML = appData.pilares.map(pilar => `
        <div class="bg-white/10 backdrop-blur-md p-8 rounded-xl shadow-lg border border-white/20 hover:-translate-y-2 transition-transform duration-300 group">
            <div class="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center text-white text-2xl mb-6 mx-auto group-hover:scale-110 transition-transform shadow-inner">
                <i class="${pilar.icono}"></i>
            </div>
            <h3 class="text-xl font-bold text-center text-white mb-3 drop-shadow-md">${pilar.titulo}</h3>
            <p class="text-blue-100 text-center text-sm leading-relaxed">${pilar.descripcion}</p>
        </div>
    `).join('');
}

// --- Consejo del Día ---
function cargarConsejo() {
    const container = document.getElementById('consejo-texto');
    if (!container || !appData?.consejos) return;

    const randomIndex = Math.floor(Math.random() * appData.consejos.length);
    container.textContent = `"${appData.consejos[randomIndex]}"`;
}

// --- Botón Leer Más ---
window.toggleLeerMas = function () {
    const textElement = document.getElementById('intro-text');
    const btnElement = document.getElementById('btn-leer-mas');
    if (!textElement || !btnElement) return;

    const isExpanded = textElement.style.maxHeight === 'none';
    const span = btnElement.querySelector('span') || btnElement;
    
    if (isExpanded) {
        textElement.style.maxHeight = '6em'; 
        if(btnElement.tagName === 'BUTTON') span.textContent = 'Leer más';
    } else {
        textElement.style.maxHeight = 'none';
        if(btnElement.tagName === 'BUTTON') span.textContent = 'Leer menos';
    }
};


// ==========================================
// SECCIÓN 2: ACERCA DE
// ==========================================

function cargarAutores() {
    const container = document.getElementById('autores-container');
    if (!container || !appData?.autores) return;

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
                <p class="text-gray-600 text-sm mb-4">Estudiante de Ingeniería del Software en la UTN.</p>
                <a href="mailto:${autor.correo}" class="inline-flex items-center text-accent hover:text-yellow-600 font-medium transition-colors">
                    <i class="fa-solid fa-envelope mr-2"></i> ${autor.correo}
                </a>
            </div>
        </div>
    `).join('');
}


// ==========================================
// SECCIÓN 3: CENTRO DE SEGURIDAD (SIMULADOR)
// ==========================================

// --- Guía de Banderas ---
function cargarGuiaBanderas() {
    const container = document.getElementById('banderas-container');
    const infoBox = document.getElementById('info-bandera');
    const titleEl = document.getElementById('titulo-bandera');
    const descEl = document.getElementById('desc-bandera');

    if (!container || !appData?.banderas_guia) return;

    container.innerHTML = appData.banderas_guia.map((bandera, index) => `
        <button onclick="mostrarInfoBandera(${index})" 
                class="group flex flex-col items-center gap-3 transition-all duration-300 transform hover:scale-110 focus:outline-none">
            <div class="w-20 h-14 ${bandera.claseColor} shadow-lg rounded-md relative group-hover:shadow-2xl border-2 border-white/50">
                <div class="absolute left-0 top-0 bottom-0 w-1.5 bg-black/20"></div>
            </div>
            <span class="text-sm font-bold text-gray-500 group-hover:text-primary uppercase tracking-wider">${bandera.nombre}</span>
        </button>
    `).join('');

    window.mostrarInfoBandera = function(index) {
        const bandera = appData.banderas_guia[index];
        infoBox.classList.remove('hidden');
        
        const borderColors = { 'red': 'border-red-600', 'yellow': 'border-yellow-400', 'green': 'border-green-500', 'blue': 'border-blue-600' };
        const textColors = { 'red': 'text-red-700', 'yellow': 'text-yellow-700', 'green': 'text-green-700', 'blue': 'text-blue-700' };
        
        infoBox.className = `bg-white border-l-8 p-8 rounded-r-xl shadow-lg transition-all duration-300 transform translate-y-0 ${borderColors[bandera.color]}`;
        titleEl.textContent = `Bandera ${bandera.nombre}: ${bandera.significado}`;
        titleEl.className = `text-2xl font-bold mb-2 ${textColors[bandera.color]}`;
        descEl.textContent = bandera.descripcion;
    };
}

// --- Simulador ---
function iniciarSimulador() {
    const select = document.getElementById('playa-select');
    if (!select || !appData?.playas) return;

    select.innerHTML = appData.playas.map(playa => `<option value="${playa.id}">${playa.nombre}</option>`).join('');
    select.addEventListener('change', (e) => actualizarSimulador(e.target.value));
    actualizarSimulador(appData.playas[0].id);
}

function actualizarSimulador(playaId) {
    const playa = appData.playas.find(p => p.id === playaId);
    if (!playa) return;

    // --- 1. ACTUALIZAR PANELES SUPERIORES (EXISTENTE) ---
    document.getElementById('resultado-oleaje').textContent = playa.oleaje;
    document.getElementById('resultado-bandera-texto').textContent = playa.bandera.significado;
    
    // Color Bandera
    const colorMap = { 'red': 'bg-red-500', 'yellow': 'bg-yellow-400', 'green': 'bg-green-500' };
    const colorClass = colorMap[playa.bandera.color] || 'bg-gray-300';
    document.getElementById('resultado-bandera-color').className = `w-12 h-12 rounded-full border-4 border-white shadow-md ${colorClass}`;

    // Tarjeta Riesgo
    const riskCard = document.getElementById('card-riesgo');
    const riskText = document.getElementById('resultado-riesgo');
    riskCard.className = 'p-6 rounded-2xl shadow-md border-l-8 transition-colors duration-500 bg-gray-100'; 
    
    if (playa.bandera.color === 'red') {
        riskCard.classList.add('bg-red-50', 'border-red-500');
        riskText.className = "text-lg font-bold text-red-700 mt-2";
    } else if (playa.bandera.color === 'yellow') {
        riskCard.classList.add('bg-yellow-50', 'border-yellow-500');
        riskText.className = "text-lg font-bold text-yellow-700 mt-2";
    } else {
        riskCard.classList.add('bg-green-50', 'border-green-500');
        riskText.className = "text-lg font-bold text-green-700 mt-2";
    }
    riskText.textContent = playa.descripcion_riesgo;

    // Multimedia Pequeña
    const imgEl = document.getElementById('resultado-imagen');
    if(imgEl) { imgEl.src = playa.imagen; imgEl.alt = playa.nombre; }
    
    const videoEl = document.getElementById('resultado-video');
    if(videoEl) videoEl.src = `https://www.youtube.com/embed/${playa.video_id}?rel=0`;

    // Gráfico
    actualizarGrafico(playa);

    // --- 2. ACTUALIZAR NUEVA FICHA TÉCNICA (NUEVO) ---
    const fichaSection = document.getElementById('ficha-tecnica');
    
    // Hacemos visible la sección con animación
    if(fichaSection) {
        fichaSection.classList.remove('opacity-0', 'translate-y-10');
        
        // Imagen y Títulos
        document.getElementById('ficha-imagen').src = playa.imagen;
        document.getElementById('ficha-titulo').textContent = playa.nombre;
        document.getElementById('ficha-provincia').querySelector('span').textContent = playa.provincia;
        document.getElementById('ficha-descripcion').textContent = playa.descripcion_general;

        // Lista de Tips
        const tipsContainer = document.getElementById('lista-tips');
        tipsContainer.innerHTML = playa.tips.map(tip => `
            <li class="flex items-start gap-2">
                <i class="fa-solid fa-check text-green-500 mt-1"></i>
                <span>${tip}</span>
            </li>
        `).join('');

        // Lista de Precauciones
        const precaucionesContainer = document.getElementById('lista-precauciones');
        // Verificamos si existe el array en el JSON (por si acaso faltara en alguno)
        const precauciones = playa.precauciones || ["Precaución general al ingresar al mar."];
        
        precaucionesContainer.innerHTML = precauciones.map(warn => `
            <li class="flex items-start gap-2">
                <i class="fa-solid fa-circle-exclamation text-red-500 mt-1"></i>
                <span>${warn}</span>
            </li>
        `).join('');
    }
}

function actualizarGrafico(playa) {
    const canvas = document.getElementById('grafico-accidentes');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (currentChart) currentChart.destroy();

    currentChart = new Chart(ctx, {
        type: 'line', 
        data: {
            labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'],
            datasets: [{
                label: `Incidentes - ${playa.nombre}`,
                data: playa.estadisticas,
                backgroundColor: 'rgba(6, 182, 212, 0.2)',
                borderColor: '#06b6d4',
                borderWidth: 3,
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { position: 'top' } },
            scales: {
                y: { beginAtZero: true, grid: { color: '#f3f4f6' } },
                x: { grid: { display: false } }
            }
        }
    });
}


// ==========================================
// SECCIÓN 4: CONTACTO (MAPA Y VALIDACIÓN)
// ==========================================

function iniciarContacto() {
    initMap();
    
    const form = document.getElementById('contacto-form');
    if (form) form.addEventListener('submit', validarFormulario);

    // Cerrar modal
    const btnCerrar = document.getElementById('btn-cerrar-modal');
    if (btnCerrar) {
        btnCerrar.addEventListener('click', () => {
            const modal = document.getElementById('modal-exito');
            if(modal) modal.classList.add('hidden');
        });
    }
    // Cerrar modal al hacer clic fuera (opcional, buena práctica)
    const modal = document.getElementById('modal-exito');
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.classList.add('hidden');
        });
    }
}

function initMap() {
    if (!document.getElementById('map')) return;

    // Coordenadas UTN Sede Central (Alajuela, Villa Bonita)
    const utnLat = 10.0070;
    const utnLng = -84.2167;

    const map = L.map('map').setView([utnLat, utnLng], 15);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    L.marker([utnLat, utnLng]).addTo(map)
        .bindPopup('<b>Universidad Técnica Nacional</b><br>Sede Central<br>Alajuela, Costa Rica')
        .openPopup();
}

function validarFormulario(e) {
    e.preventDefault();
    let isValid = true;

    const toggleError = (id, show) => {
        const input = document.getElementById(id);
        const errorText = document.getElementById(`error-${id}`);
        if (input && errorText) {
            input.classList.toggle('border-red-500', show);
            input.classList.toggle('focus:ring-red-200', show);
            input.classList.toggle('border-gray-300', !show);
            errorText.classList.toggle('hidden', !show);
        }
    };

    // 1. Obtener Elementos
    const nombreEl = document.getElementById('nombre');
    const correoEl = document.getElementById('correo');
    const asuntoEl = document.getElementById('asunto');
    const mensajeEl = document.getElementById('mensaje');

    // 2. Validaciones
    if (!nombreEl || nombreEl.value.trim() === '') { toggleError('nombre', true); isValid = false; } else toggleError('nombre', false);
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!correoEl || !emailRegex.test(correoEl.value.trim())) { toggleError('correo', true); isValid = false; } else toggleError('correo', false);
    
    if (!asuntoEl || asuntoEl.value.trim() === '') { toggleError('asunto', true); isValid = false; } else toggleError('asunto', false);
    
    if (!mensajeEl || mensajeEl.value.trim() === '') { toggleError('mensaje', true); isValid = false; } else toggleError('mensaje', false);

    // 3. Validación Captcha
    const captchaErr = document.getElementById('error-captcha');
    if (typeof grecaptcha !== 'undefined') {
        if (grecaptcha.getResponse().length === 0) {
            if(captchaErr) captchaErr.classList.remove('hidden');
            isValid = false;
        } else {
            if(captchaErr) captchaErr.classList.add('hidden');
        }
    }

    // 4. Acción
    if (isValid) {
        const datos = {
            nombre: nombreEl.value,
            correo: correoEl.value,
            asunto: asuntoEl.value,
            mensaje: mensajeEl.value
        };
        mostrarModalExito(datos);
        e.target.reset();
        if (typeof grecaptcha !== 'undefined') grecaptcha.reset();
    }
}

function mostrarModalExito(datos) {
    const modal = document.getElementById('modal-exito');
    const elNombre = document.getElementById('modal-nombre');
    const elCorreo = document.getElementById('modal-correo'); // Si decides mostrarlo
    const elAsunto = document.getElementById('modal-asunto');
    const elMensaje = document.getElementById('modal-mensaje'); // Si decides mostrarlo

    if (modal && elNombre && elAsunto) {
        elNombre.textContent = datos.nombre;
        elAsunto.textContent = datos.asunto;
        
        // Si existen los campos extras en el HTML del modal
        if(elCorreo) elCorreo.textContent = datos.correo;
        if(elMensaje) elMensaje.textContent = datos.mensaje;

        modal.classList.remove('hidden');
    }
}