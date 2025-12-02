console.log("SafeWave App Iniciada");

// --- Variables Globales ---
let appData = null;
let currentChart = null; // Instancia del gráfico para destruir/actualizar
let autoPlayInterval;    // Para controlar el carrusel

// --- Inicialización ---
document.addEventListener('DOMContentLoaded', async () => {
    // Menú móvil
    initMobileMenu();

    // Carga de Datos (JSON)
    try {
        const response = await fetch('data/datos.json');
        if (!response.ok) throw new Error('Error al cargar datos.json');
        appData = await response.json();
        console.log("Datos cargados:", appData);

        // --- LÓGICA DE LA PÁGINA DE INICIO (NUEVO) ---
        initCarousel();             // Requerimiento: Carrusel funcional
        cargarCintaAlertas();       // Interacción JS #1: Cinta de noticias (Ticker)
        cargarMonitorEstadistico(); // Interacción JS #2: Monitor de riesgo
        cargarPilares();            // Contenido desde JSON
        cargarConsejo();            // Consejo del día

        // --- LÓGICA DE OTRAS PÁGINAS (EXISTENTE) ---
        cargarAutores();            // Página Acerca de
        iniciarSimulador();         // Página Centro de Seguridad
        if (typeof cargarGuiaBanderas === 'function') cargarGuiaBanderas(); // Si implementaste la guía
        iniciarContacto();          // Página Contacto

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
            const expanded = btn.getAttribute('aria-expanded') === 'true' || false;
            btn.setAttribute('aria-expanded', !expanded);
            menu.classList.toggle('hidden');
        });
    }
}

// ==========================================
// SECCIÓN: PÁGINA DE INICIO (REQUERIMIENTOS)
// ==========================================

// --- 1. Lógica del Carrusel Mejorado ---
function initCarousel() {
    const slidesContainer = document.getElementById('carousel-slides');
    const indicatorsContainer = document.getElementById('carousel-indicators');
    
    // Escudo: Si no existen los elementos en esta página, salir.
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

    // Control del Carrusel
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

    // Listeners
    document.getElementById('next-slide')?.addEventListener('click', () => { showSlide(currentSlide + 1); resetTimer(); });
    document.getElementById('prev-slide')?.addEventListener('click', () => { showSlide(currentSlide - 1); resetTimer(); });
    
    dots.forEach((dot, idx) => {
        dot.addEventListener('click', () => { showSlide(idx); resetTimer(); });
    });

    // Auto Play
    const startTimer = () => { autoPlayInterval = setInterval(() => showSlide(currentSlide + 1), 5000); };
    const resetTimer = () => { clearInterval(autoPlayInterval); startTimer(); };
    startTimer();
}

// --- 2. Interacción Novedosa A: Cinta de Alertas (Ticker) ---
function cargarCintaAlertas() {
    const container = document.getElementById('cinta-alertas');
    if (!container || !appData?.playas) return;

    // Crear string de alertas basado en banderas
    const alertas = appData.playas.map(playa => {
        let icon = playa.bandera.color === 'red' ? '<i class="fa-solid fa-circle text-red-500"></i>' : 
                  (playa.bandera.color === 'yellow' ? '<i class="fa-solid fa-circle text-yellow-400"></i>' : 
                   '<i class="fa-solid fa-circle text-green-500"></i>');
        return `<span class="mx-6 font-medium flex items-center gap-2 inline-flex">${icon} ${playa.nombre}: ${playa.bandera.significado.toUpperCase()}</span>`;
    }).join(' | ');

    // Duplicar contenido para efecto infinito suave
    container.innerHTML = `<div class="inline-block">${alertas} | ${alertas}</div>`;
}

// --- 3. Interacción Novedosa B: Monitor Estadístico ---
function cargarMonitorEstadistico() {
    const container = document.getElementById('stats-dashboard');
    if (!container || !appData?.playas) return;

    // Calcular estadísticas en tiempo real
    const total = appData.playas.length;
    const highRisk = appData.playas.filter(p => p.bandera.color === 'red').length;
    const mediumRisk = appData.playas.filter(p => p.bandera.color === 'yellow').length;
    const safe = total - (highRisk + mediumRisk);

    const stats = [
        { label: 'Playas Monitoreadas', val: total, icon: 'fa-umbrella-beach', color: 'text-blue-400' },
        { label: 'Alto Riesgo', val: highRisk, icon: 'fa-triangle-exclamation', color: 'text-red-500' },
        { label: 'Precaución', val: mediumRisk, icon: 'fa-flag', color: 'text-yellow-400' },
        { label: 'Condición Segura', val: safe, icon: 'fa-check-circle', color: 'text-green-500' }
    ];

    container.innerHTML = stats.map(stat => `
        <div class="bg-gray-800 rounded-xl p-4 border border-gray-700 hover:border-gray-500 transition-colors transform hover:-translate-y-1 duration-300">
            <i class="fa-solid ${stat.icon} ${stat.color} text-3xl mb-2"></i>
            <div class="text-3xl font-bold text-white">${stat.val}</div>
            <div class="text-xs text-gray-400 uppercase tracking-widest mt-1">${stat.label}</div>
        </div>
    `).join('');
}

// --- 4. Cargar Pilares (Contenido JSON) ---
function cargarPilares() {
    const container = document.getElementById('pilares-container');
    if (!container || !appData?.pilares) return;

    container.innerHTML = appData.pilares.map(pilar => `
        <div class="bg-white p-8 rounded-xl shadow-lg border-t-4 border-secondary hover:-translate-y-2 transition-transform duration-300 group">
            <div class="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center text-primary text-2xl mb-6 mx-auto group-hover:scale-110 transition-transform">
                <i class="${pilar.icono}"></i>
            </div>
            <h3 class="text-xl font-bold text-center text-gray-800 mb-3">${pilar.titulo}</h3>
            <p class="text-gray-600 text-center text-sm leading-relaxed">${pilar.descripcion}</p>
        </div>
    `).join('');
}

// --- 5. Funcionalidad "Leer Más" ---
window.toggleLeerMas = function () {
    const textElement = document.getElementById('intro-text');
    const btnElement = document.getElementById('btn-leer-mas');
    if (!textElement || !btnElement) return;

    const isExpanded = textElement.style.maxHeight === 'none';
    const span = btnElement.querySelector('span') || btnElement; // Soporte para el botón complejo o simple
    
    if (isExpanded) {
        textElement.style.maxHeight = '6em'; 
        if(btnElement.tagName === 'BUTTON') span.textContent = 'Leer más';
    } else {
        textElement.style.maxHeight = 'none';
        if(btnElement.tagName === 'BUTTON') span.textContent = 'Leer menos';
    }
};

// --- 6. Consejo del Día ---
function cargarConsejo() {
    const container = document.getElementById('consejo-texto');
    if (!container || !appData?.consejos) return;

    const randomIndex = Math.floor(Math.random() * appData.consejos.length);
    container.textContent = `"${appData.consejos[randomIndex]}"`;
}


// ==========================================
// SECCIÓN: OTRAS PÁGINAS (FUNCIONALIDAD BASE)
// ==========================================

// --- Autores (Acerca de) ---
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

// --- Simulador (Centro de Seguridad) ---
function iniciarSimulador() {
    const select = document.getElementById('playa-select');
    if (!select || !appData?.playas) return;

    // Llenar Select
    select.innerHTML = appData.playas.map(playa => 
        `<option value="${playa.id}">${playa.nombre}</option>`
    ).join('');

    select.addEventListener('change', (e) => actualizarSimulador(e.target.value));
    actualizarSimulador(appData.playas[0].id); // Cargar primera playa
}

function actualizarSimulador(playaId) {
    const playa = appData.playas.find(p => p.id === playaId);
    if (!playa) return;

    const elements = {
        oleaje: document.getElementById('resultado-oleaje'),
        banderaTxt: document.getElementById('resultado-bandera-texto'),
        banderaCol: document.getElementById('resultado-bandera-color'),
        riesgoCard: document.getElementById('card-riesgo'),
        riesgoTxt: document.getElementById('resultado-riesgo'),
        img: document.getElementById('resultado-imagen'),
        video: document.getElementById('resultado-video')
    };

    if (!elements.oleaje) return; // Escudo parcial

    // Actualizar Texto y Multimedia
    elements.oleaje.textContent = playa.oleaje;
    elements.banderaTxt.textContent = playa.bandera.significado;
    if (elements.img) { elements.img.src = playa.imagen; elements.img.alt = playa.nombre; }
    if (elements.video) elements.video.src = `https://www.youtube.com/embed/${playa.video_id}?rel=0`;

    // Colores y Estilos
    const colors = { 'red': 'bg-red-500', 'yellow': 'bg-yellow-400', 'green': 'bg-green-500' };
    const borderColors = { 'red': 'border-red-500 bg-red-50', 'yellow': 'border-yellow-500 bg-yellow-50', 'green': 'border-green-500 bg-green-50' };
    
    elements.banderaCol.className = `w-4 h-4 rounded-full block ${colors[playa.bandera.color] || 'bg-gray-300'}`;
    elements.riesgoCard.className = `rounded-lg p-6 border-2 shadow-sm transition-colors duration-300 ${borderColors[playa.bandera.color]}`;
    
    // Texto de Riesgo
    elements.riesgoTxt.className = `text-lg font-bold mt-2 ${playa.bandera.color === 'red' ? 'text-red-700' : (playa.bandera.color === 'yellow' ? 'text-yellow-700' : 'text-green-700')}`;
    elements.riesgoTxt.textContent = playa.descripcion_riesgo || "Información no disponible";

    actualizarGrafico(playa);
}

function actualizarGrafico(playa) {
    const canvas = document.getElementById('grafico-accidentes');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (currentChart) currentChart.destroy();

    currentChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'],
            datasets: [{
                label: `Incidentes en ${playa.nombre}`,
                data: playa.estadisticas,
                backgroundColor: '#06b6d4',
                borderColor: '#1e3a8a',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: { y: { beginAtZero: true } }
        }
    });
}

// --- Contacto (Formulario y Mapa) ---
function iniciarContacto() {
    initMap();
    
    const form = document.getElementById('contacto-form');
    if (form) form.addEventListener('submit', validarFormulario);

    const btnCerrar = document.getElementById('btn-cerrar-modal');
    if (btnCerrar) {
        btnCerrar.addEventListener('click', () => {
            document.getElementById('modal-exito').classList.add('hidden');
        });
    }
}

function initMap() {
    if (!document.getElementById('map')) return; // Escudo

    // Coordenadas UTN Sede Central (Villa Bonita, Alajuela)
    // Latitud: 10.0070, Longitud: -84.2167
    const utnLat = 10.0070;
    const utnLng = -84.2167;

    const map = L.map('map').setView([utnLat, utnLng], 15); // Zoom 15 para ver detalles

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    L.marker([utnLat, utnLng]).addTo(map)
        .bindPopup('<b>Universidad Técnica Nacional</b><br>Sede Central<br>Alajuela, Costa Rica')
        .openPopup();
}

// ... (resto del código anterior sin cambios) ...

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

    // 1. Obtener elementos
    const nombreEl = document.getElementById('nombre');
    const correoEl = document.getElementById('correo');
    const asuntoEl = document.getElementById('asunto');
    const mensajeEl = document.getElementById('mensaje');

    // 2. Validaciones
    // Nombre
    if (!nombreEl || nombreEl.value.trim() === '') { toggleError('nombre', true); isValid = false; } 
    else toggleError('nombre', false);

    // Correo
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!correoEl || !emailRegex.test(correoEl.value.trim())) { toggleError('correo', true); isValid = false; } 
    else toggleError('correo', false);

    // Asunto
    if (!asuntoEl || asuntoEl.value.trim() === '') { toggleError('asunto', true); isValid = false; } 
    else toggleError('asunto', false);

    // Mensaje
    if (!mensajeEl || mensajeEl.value.trim() === '') { toggleError('mensaje', true); isValid = false; } 
    else toggleError('mensaje', false);

    // Captcha
    const captchaErr = document.getElementById('error-captcha');
    if (typeof grecaptcha !== 'undefined') {
        if (grecaptcha.getResponse().length === 0) {
            if (captchaErr) captchaErr.classList.remove('hidden');
            isValid = false;
        } else {
            if (captchaErr) captchaErr.classList.add('hidden');
        }
    }

    // 3. Acción Final
    if (isValid) {
        // RECOLECCIÓN DE TODOS LOS DATOS PARA EL MODAL
        const datos = {
            nombre: nombreEl.value,
            correo: correoEl.value,
            asunto: asuntoEl.value,
            mensaje: mensajeEl.value
        };
        
        // Llamada a la función actualizada con los 4 datos
        mostrarModalExito(datos);
        
        e.target.reset();
        if (typeof grecaptcha !== 'undefined') grecaptcha.reset();
    }
}

// --- FUNCIÓN ACTUALIZADA: Recibe un objeto con todos los datos ---
function mostrarModalExito(datos) {
    const modal = document.getElementById('modal-exito');
    
    // Referencias a los campos del modal
    const elNombre = document.getElementById('modal-nombre');
    const elCorreo = document.getElementById('modal-correo');
    const elAsunto = document.getElementById('modal-asunto');
    const elMensaje = document.getElementById('modal-mensaje');

    // Escudo: Verificar que todo exista antes de intentar escribir
    if (modal && elNombre && elCorreo && elAsunto && elMensaje) {
        
        // Inyectar texto (usamos textContent por seguridad)
        elNombre.textContent = datos.nombre;
        elCorreo.textContent = datos.correo;
        elAsunto.textContent = datos.asunto;
        elMensaje.textContent = datos.mensaje;
        
        // Mostrar Modal
        modal.classList.remove('hidden');
    } else {
        console.error("Error: Elementos del modal no encontrados en el DOM.");
    }
}

// Cerrar modal al hacer click en el botón (asegurar que el evento existe)
document.addEventListener('click', function(e) {
    if (e.target && e.target.id === 'btn-cerrar-modal') {
        const modal = document.getElementById('modal-exito');
        if(modal) modal.classList.add('hidden');
    }
});