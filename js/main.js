/* ==========================================================================
   Portfolio · Iván Jaureguiberry
   main.js — Interacciones de la página
   --------------------------------------------------------------------------
   1. Utilidades
   2. Tema claro / oscuro
   3. Menú móvil
   4. Inspector del nombre (hero)
   5. Reloj de Buenos Aires y año del footer
   6. Mini carrito de FitTrade
   7. Copiar email
   8. Formulario de contacto
   ========================================================================== */

'use strict';

/* --------------------------------------------------------------------------
   1. Utilidades
   -------------------------------------------------------------------------- */

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => document.querySelectorAll(selector);

const CONTACT_EMAIL = 'ivanjaureguiberry4@gmail.com';
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

let toastTimer = null;

/**
 * Muestra un aviso breve en la parte inferior de la pantalla.
 * @param {string} message - Texto a mostrar.
 */
function showToast(message) {
  const toast = $('#toast');

  toast.textContent = message;
  toast.classList.add('show');

  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2200);
}

/* --------------------------------------------------------------------------
   2. Tema claro / oscuro
   -------------------------------------------------------------------------- */

function initTheme() {
  const root = document.documentElement;
  const themeButton = $('#themeBtn');

  // Recupera el tema elegido en una visita anterior (si existe)
  try {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) root.dataset.theme = savedTheme;
  } catch (error) {
    // localStorage no disponible (modo privado, etc.): se usa el tema del sistema
  }

  themeButton.addEventListener('click', () => {
    const isDark = root.dataset.theme
      ? root.dataset.theme === 'dark'
      : window.matchMedia('(prefers-color-scheme: dark)').matches;

    root.dataset.theme = isDark ? 'light' : 'dark';

    try {
      localStorage.setItem('theme', root.dataset.theme);
    } catch (error) {
      // Sin persistencia: el cambio vale solo para esta visita
    }
  });
}

/* --------------------------------------------------------------------------
   3. Menú móvil
   -------------------------------------------------------------------------- */

function initMobileMenu() {
  const nav = $('#nav');
  const menuButton = $('#menuBtn');

  const setMenuOpen = (isOpen) => {
    nav.dataset.open = String(isOpen);
    menuButton.setAttribute('aria-expanded', String(isOpen));
  };

  menuButton.addEventListener('click', () => {
    setMenuOpen(nav.dataset.open !== 'true');
  });

  // Cierra el menú al elegir una sección
  nav.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => setMenuOpen(false));
  });
}

/* --------------------------------------------------------------------------
   4. Inspector del nombre (hero)
   Simula el resaltado de las DevTools mostrando las medidas reales del <h1>.
   -------------------------------------------------------------------------- */

function initNameInspector() {
  const inspector = $('#inspect');
  const heading = inspector.querySelector('h1');
  const dimensions = $('#dims');

  const updateDimensions = () => {
    const { width, height } = heading.getBoundingClientRect();
    dimensions.textContent = `${Math.round(width)} × ${Math.round(height)}`;
  };

  updateDimensions();
  window.addEventListener('resize', updateDimensions);

  if (document.fonts) {
    document.fonts.ready.then(updateDimensions);
  }

  // Muestra el efecto una vez al cargar, salvo que el usuario prefiera menos movimiento
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (!prefersReducedMotion) {
    setTimeout(() => inspector.classList.add('on'), 600);
    setTimeout(() => inspector.classList.remove('on'), 3200);
  }
}

/* --------------------------------------------------------------------------
   5. Reloj de Buenos Aires y año del footer
   -------------------------------------------------------------------------- */

function initClock() {
  const clock = $('#clock');
  const formatter = new Intl.DateTimeFormat('es-AR', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Argentina/Buenos_Aires',
  });

  const updateClock = () => {
    clock.textContent = formatter.format(new Date());
  };

  updateClock();
  setInterval(updateClock, 30_000);
}

function initFooterYear() {
  $('#year').textContent = new Date().getFullYear();
}

/* --------------------------------------------------------------------------
   6. Mini carrito de FitTrade
   Cada producto descuenta stock al agregarse; sin stock, se deshabilita.
   -------------------------------------------------------------------------- */

function initMiniCart() {
  const cartBadge = $('#cart');
  let itemsInCart = 0;

  const bumpCartBadge = () => {
    cartBadge.classList.add('bump');
    setTimeout(() => cartBadge.classList.remove('bump'), 200);
  };

  $$('.prod').forEach((product) => {
    const addButton = product.querySelector('button');
    const stockLabel = product.querySelector('.s');

    addButton.addEventListener('click', () => {
      let stock = Number(stockLabel.dataset.s);

      if (stock <= 0) {
        showToast('Sin stock disponible');
        return;
      }

      stock -= 1;
      itemsInCart += 1;

      stockLabel.dataset.s = stock;
      stockLabel.textContent = stock;
      cartBadge.textContent = `Carrito ${itemsInCart}`;
      bumpCartBadge();

      if (stock === 0) {
        addButton.textContent = 'Sin stock';
        addButton.disabled = true;
      }
    });
  });
}

/* --------------------------------------------------------------------------
   7. Copiar email
   -------------------------------------------------------------------------- */

function initCopyEmail() {
  const emailText = $('#email');
  const copyButton = $('#copyEmail');

  // Si el portapapeles no está disponible, selecciona el texto para copiarlo a mano
  const selectEmailText = () => {
    const range = document.createRange();
    const selection = window.getSelection();

    range.selectNodeContents(emailText);
    selection.removeAllRanges();
    selection.addRange(range);

    showToast('Email seleccionado: copialo con Ctrl+C');
  };

  copyButton.addEventListener('click', () => {
    if (!navigator.clipboard) {
      selectEmailText();
      return;
    }

    navigator.clipboard
      .writeText(emailText.textContent)
      .then(() => showToast('Email copiado'))
      .catch(selectEmailText);
  });
}

/* --------------------------------------------------------------------------
   8. Formulario de contacto
   Valida los campos y abre la app de correo con el mensaje armado.
   -------------------------------------------------------------------------- */

function initContactForm() {
  const form = $('#form');
  const note = $('#formNote');

  const fields = {
    name: { input: $('#f-name'), error: $('#e-name') },
    email: { input: $('#f-mail'), error: $('#e-mail') },
    message: { input: $('#f-msg'), error: $('#e-msg') },
  };

  /**
   * Devuelve un objeto { campo: mensajeDeError } solo con los campos inválidos.
   */
  const validate = ({ name, email, message }) => {
    const errors = {};

    if (!name) errors.name = 'Escribí tu nombre.';
    if (!EMAIL_PATTERN.test(email)) errors.email = 'Revisá el email: falta el @ o el dominio.';
    if (message.length < 10) errors.message = 'El mensaje necesita al menos 10 caracteres.';

    return errors;
  };

  const buildMailtoLink = ({ name, email, message }) => {
    const subject = encodeURIComponent(`Contacto desde el portfolio · ${name}`);
    const body = encodeURIComponent(`${message}\n\n— ${name} (${email})`);

    return `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`;
  };

  form.addEventListener('submit', (event) => {
    event.preventDefault();

    const values = {
      name: fields.name.input.value.trim(),
      email: fields.email.input.value.trim(),
      message: fields.message.input.value.trim(),
    };

    const errors = validate(values);

    Object.entries(fields).forEach(([key, field]) => {
      field.error.textContent = errors[key] || '';
    });

    if (Object.keys(errors).length > 0) return;

    window.location.href = buildMailtoLink(values);

    note.classList.add('ok');
    note.textContent = `Abrimos tu app de correo con el mensaje. Si no se abrió, escribí directamente a ${CONTACT_EMAIL}.`;
  });
}

/* --------------------------------------------------------------------------
   Inicio
   -------------------------------------------------------------------------- */

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initMobileMenu();
  initNameInspector();
  initClock();
  initFooterYear();
  initMiniCart();
  initCopyEmail();
  initContactForm();
});
