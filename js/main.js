/* ==========================================================================
   Portfolio · Iván Jaureguiberry
   main.js — Interacciones de la página
   --------------------------------------------------------------------------
   1. Utilidades
   2. Tema claro / oscuro
   3. Menú móvil
   4. Año del footer
   5. Copiar email
   6. Formulario de contacto
   7. Versiones de prueba
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
    // localStorage no disponible (modo privado, etc.): se usa el tema del sistema.
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
   4. Año del footer
   -------------------------------------------------------------------------- */

function initFooterYear() {
  $('#year').textContent = new Date().getFullYear();
}

/* --------------------------------------------------------------------------
   5. Copiar email
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
   6. Formulario de contacto
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
   7. Versiones de prueba
   "Probalo acá" abre el sitio dentro de una ventana, o la terminal del
   inventario (la lógica del programa está en demo-inventario.js).
   -------------------------------------------------------------------------- */

function initDemos() {
  const webDialog = $('#demoWeb');
  const webFrame = $('#demoWebFrame');
  const webTitle = $('#demoWebTitle');
  const webOpen = $('#demoWebOpen');
  const stage = webDialog.querySelector('.demo-stage');
  const deviceButtons = webDialog.querySelectorAll('[data-device]');

  const invDialog = $('#demoInventario');
  let inventarioIniciado = false;

  InventarioDemo.iniciar({
    salida: $('#consoleOutput'),
    form: $('#consoleForm'),
    entrada: $('#consoleEntry'),
  });

  const setDevice = (device) => {
    stage.dataset.device = device;
    deviceButtons.forEach((button) => {
      button.setAttribute('aria-pressed', String(button.dataset.device === device));
    });
  };

  const openWebDemo = (title, url) => {
    webTitle.textContent = title;
    webOpen.href = url;
    webFrame.title = `Versión de prueba de ${title}`;
    if (webFrame.src !== url) webFrame.src = url;
    setDevice('desktop');
    webDialog.showModal();
  };

  const openInventario = () => {
    invDialog.showModal();
    if (!inventarioIniciado) {
      InventarioDemo.reiniciar();
      inventarioIniciado = true;
    }
    $('#consoleEntry').focus();
  };

  $$('[data-demo]').forEach((button) => {
    button.addEventListener('click', () => {
      if (button.dataset.demo === 'web') openWebDemo(button.dataset.title, button.dataset.url);
      else openInventario();
    });
  });

  deviceButtons.forEach((button) => {
    button.addEventListener('click', () => setDevice(button.dataset.device));
  });

  $('#demoInvReset').addEventListener('click', () => {
    InventarioDemo.reiniciar();
    $('#consoleEntry').focus();
  });

  // Cerrar con la X o haciendo clic afuera de la ventana
  [webDialog, invDialog].forEach((dialog) => {
    dialog.querySelector('.demo-close').addEventListener('click', () => dialog.close());
    dialog.addEventListener('click', (event) => {
      if (event.target === dialog) dialog.close();
    });
  });
}

/* --------------------------------------------------------------------------
   Inicio
   -------------------------------------------------------------------------- */

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initMobileMenu();
  initFooterYear();
  initCopyEmail();
  initContactForm();
  initDemos();
});
