/**
 * ÉDIPO PIMENTEL - ESTÉTICA AUTOMOTIVA & DETALHAMENTO PREMIUM
 * Módulos: WhatsApp Builder, Google Maps, Slider Antes/Depois, Animações e Segurança
 */

const EDIApp = (() => {
  'use strict';

  // Configurações Oficiais da Empresa (Cartão e Perfil Oficial)
  const CONFIG = {
    whatsappNumber: '5549988449865', // (49) 9.8844-9865
    businessName: 'Édipo Pimentel Estética Automotiva',
    email: 'edipopimentel0307@yahoo.com',
    address: "Rua Luiza Piovesan Martini, 50 - Loteamento Trevisan, Bairro São Jorge - Herval d'Oeste - SC, 89610-000",
    mapsUrl: "https://maps.google.com/?q=Rua+Luiza+Piovesan+Martini,+50,+Herval+d%27Oeste+-+SC",
    wazeUrl: "https://waze.com/ul?q=Rua+Luiza+Piovesan+Martini+50+Herval+d+Oeste",
    rateLimitCooldownMs: 2500 // Proteção contra múltiplos cliques
  };

  // Multiplicadores por Porte de Veículo
  const VEHICLE_MULTIPLIERS = {
    'Hatch / Compacto': 1.0,
    'Sedan Médio': 1.15,
    'SUV / Crossover': 1.30,
    'Picape / SUV Grande': 1.45
  };

  let lastSubmitTime = 0;

  /* ==========================================================================
     1. Módulo de Segurança Web Básica (Anti-XSS e Sanitização)
     ========================================================================== */
  const sanitizeInput = (str) => {
    if (!str || typeof str !== 'string') return '';
    return str
      .trim()
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  };

  const cleanPlainText = (str) => {
    if (!str) return '';
    return str.trim().replace(/[<>]/g, '');
  };

  /* ==========================================================================
     2. Status Operacional em Tempo Real
     ========================================================================== */
  const initBusinessStatus = () => {
    const dot = document.getElementById('business-dot');
    const label = document.getElementById('business-status');
    if (!dot || !label) return;

    const now = new Date();
    const day = now.getDay(); // 0 = Domingo, 6 = Sábado
    const hour = now.getHours();
    const minute = now.getMinutes();
    const currentTime = hour + minute / 60;

    let isOpen = false;
    let closingTime = '18:30';

    if (day >= 1 && day <= 5) { // Seg a Sex: 08:00 - 18:30
      if (currentTime >= 8.0 && currentTime < 18.5) {
        isOpen = true;
        closingTime = '18:30';
      }
    } else if (day === 6) { // Sábado: 08:00 - 13:00 com agendamento
      if (currentTime >= 8.0 && currentTime < 13.0) {
        isOpen = true;
        closingTime = '13:00';
      }
    }

    if (isOpen) {
      dot.className = 'status-dot pulsing';
      dot.style.background = 'var(--whatsapp-light)';
      label.textContent = `Estúdio Aberto Hoje (até às ${closingTime})`;
    } else {
      dot.className = 'status-dot';
      dot.style.background = 'var(--card-gray)';
      const openMessage = day === 0 ? 'Abre segunda às 08:00' : (currentTime < 8 ? 'Abre hoje às 08:00' : 'Abre amanhã às 08:00');
      label.textContent = `Fechado no momento (${openMessage})`;
    }
  };

  /* ==========================================================================
     3. Simulador de Orçamento & Integração WhatsApp Oficial
     ========================================================================== */
  const calculateEstimate = () => {
    const vehicleRadio = document.querySelector('input[name="vehicle_type"]:checked');
    const vehicleType = vehicleRadio ? vehicleRadio.value : 'Hatch / Compacto';
    const multiplier = VEHICLE_MULTIPLIERS[vehicleType] || 1.0;

    const selectedCheckboxes = document.querySelectorAll('input[name="services"]:checked');
    let baseTotal = 0;
    const selectedServices = [];

    selectedCheckboxes.forEach(cb => {
      const price = parseFloat(cb.dataset.base || '0');
      baseTotal += price;
      selectedServices.push(cb.value);
    });

    const calculatedTotal = Math.round(baseTotal * multiplier);

    const summaryVehicle = document.getElementById('summary-vehicle');
    const summaryServicesCount = document.getElementById('summary-services-count');
    const summaryTotal = document.getElementById('summary-total');

    if (summaryVehicle) summaryVehicle.textContent = vehicleType;
    if (summaryServicesCount) {
      summaryServicesCount.textContent = `${selectedServices.length} serviço${selectedServices.length !== 1 ? 's' : ''} selecionado${selectedServices.length !== 1 ? 's' : ''}`;
    }
    if (summaryTotal) {
      if (calculatedTotal > 0) {
        summaryTotal.textContent = `A partir de R$ ${calculatedTotal.toLocaleString('pt-BR')}`;
      } else {
        summaryTotal.textContent = 'Sob Consulta';
      }
    }

    return {
      vehicleType,
      selectedServices,
      calculatedTotal
    };
  };

  const handleQuoteSubmit = (event) => {
    if (event) event.preventDefault();

    const now = Date.now();
    if (now - lastSubmitTime < CONFIG.rateLimitCooldownMs) {
      showToast('Por favor, aguarde alguns segundos antes de reenviar.');
      return;
    }

    const trap = document.getElementById('website_trap_field');
    if (trap && trap.value.trim() !== '') {
      console.warn('Bot detectado.');
      return;
    }

    const nameInput = document.getElementById('client_name');
    const carInput = document.getElementById('car_model');
    const nameError = document.getElementById('name-error');
    const carError = document.getElementById('car-error');

    if (nameError) nameError.textContent = '';
    if (carError) carError.textContent = '';

    const cleanName = cleanPlainText(nameInput ? nameInput.value : '');
    const cleanCar = cleanPlainText(carInput ? carInput.value : '');

    let hasError = false;

    if (!cleanName || cleanName.length < 2) {
      if (nameError) nameError.textContent = 'Por favor, informe seu nome (mínimo 2 caracteres).';
      if (nameInput) nameInput.focus();
      hasError = true;
    }

    if (!cleanCar || cleanCar.length < 2) {
      if (carError) carError.textContent = 'Por favor, informe o modelo e ano do seu carro.';
      if (!hasError && carInput) carInput.focus();
      hasError = true;
    }

    if (hasError) return;

    const estimate = calculateEstimate();
    if (estimate.selectedServices.length === 0) {
      showToast('Selecione ao menos 1 serviço para simulação.');
      return;
    }

    lastSubmitTime = now;

    const saudacao = getSaudacaoHorario();
    let msg = `${saudacao} Édipo! Meu nome é *${cleanName}*.\n`;
    msg += `Gostaria de agendar um atendimento para meu veículo:\n\n`;
    msg += `🚗 *Carro:* ${cleanCar}\n`;
    msg += `🏷️ *Categoria:* ${estimate.vehicleType}\n\n`;
    msg += `✨ *Serviços Selecionados:*\n`;

    estimate.selectedServices.forEach((serv) => {
      msg += ` • ${serv}\n`;
    });

    if (estimate.calculatedTotal > 0) {
      msg += `\n💰 *Estimativa Base do Site:* A partir de R$ ${estimate.calculatedTotal.toLocaleString('pt-BR')}\n`;
    }
    msg += `\nVi o site da *Édipo Pimentel Estética Automotiva* e gostaria de agendar uma data. Você teria disponibilidade?`;

    const encodedMsg = encodeURIComponent(msg);
    const whatsappLink = `https://wa.me/${CONFIG.whatsappNumber}?text=${encodedMsg}`;
    window.open(whatsappLink, '_blank', 'noopener,noreferrer');

    showToast('Abrindo WhatsApp de Édipo Pimentel...');
  };

  const openDirectWhatsApp = (customText) => {
    const saudacao = getSaudacaoHorario();
    const safeText = cleanPlainText(customText);
    const msg = `${saudacao} Édipo! Estava no site de Estética Automotiva e ${safeText}. Poderia me passar mais informações?`;
    const encoded = encodeURIComponent(msg);
    window.open(`https://wa.me/${CONFIG.whatsappNumber}?text=${encoded}`, '_blank', 'noopener,noreferrer');
  };

  const getSaudacaoHorario = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'Bom dia';
    if (hour >= 12 && hour < 18) return 'Boa tarde';
    return 'Boa noite';
  };

  /* ==========================================================================
     4. Módulo Google Maps & Cópia de Endereço
     ========================================================================== */
  const copyAddress = () => {
    const address = CONFIG.address;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(address).then(() => {
        showToast('Endereço copiado para a área de transferência!');
      }).catch(() => {
        fallbackCopy(address);
      });
    } else {
      fallbackCopy(address);
    }
  };

  const fallbackCopy = (text) => {
    const tempInput = document.createElement('textarea');
    tempInput.value = text;
    tempInput.style.position = 'fixed';
    tempInput.style.opacity = '0';
    document.body.appendChild(tempInput);
    tempInput.select();
    try {
      document.execCommand('copy');
      showToast('Endereço copiado!');
    } catch (e) {
      showToast('Endereço: ' + text);
    }
    document.body.removeChild(tempInput);
  };

  /* ==========================================================================
     5. Slider Interativo de Antes & Depois (Com Touch Estável para Mobile)
     ========================================================================== */
  const initComparisonSlider = () => {
    const container = document.getElementById('comparison-slider');
    const afterLayer = document.getElementById('comp-after-layer');
    const handle = document.getElementById('comp-handle');
    if (!container || !afterLayer || !handle) return;

    let isSliding = false;
    let startX = 0;
    let startY = 0;

    const setPosition = (clientX) => {
      const rect = container.getBoundingClientRect();
      let positionX = clientX - rect.left;
      if (positionX < 0) positionX = 0;
      if (positionX > rect.width) positionX = rect.width;

      const percentage = (positionX / rect.width) * 100;
      afterLayer.style.width = `${percentage}%`;
      handle.style.left = `${percentage}%`;
    };

    // Mouse Events
    container.addEventListener('mousedown', (e) => {
      isSliding = true;
      setPosition(e.clientX);
    });

    window.addEventListener('mouseup', () => {
      isSliding = false;
    });

    window.addEventListener('mousemove', (e) => {
      if (!isSliding) return;
      setPosition(e.clientX);
    });

    // Touch Events sem travar o scroll vertical no mobile
    container.addEventListener('touchstart', (e) => {
      if (e.touches && e.touches[0]) {
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
        isSliding = true;
        setPosition(startX);
      }
    }, { passive: true });

    window.addEventListener('touchend', () => {
      isSliding = false;
    });

    window.addEventListener('touchcancel', () => {
      isSliding = false;
    });

    container.addEventListener('touchmove', (e) => {
      if (!isSliding || !e.touches || !e.touches[0]) return;
      const currentX = e.touches[0].clientX;
      const currentY = e.touches[0].clientY;
      const diffX = Math.abs(currentX - startX);
      const diffY = Math.abs(currentY - startY);

      // Se o usuário estiver arrastando na horizontal, atualiza o slider
      if (diffX > diffY) {
        setPosition(currentX);
      }
    }, { passive: true });

    // Acessibilidade por Teclado
    container.addEventListener('keydown', (e) => {
      const currentPct = parseFloat(afterLayer.style.width || '50');
      if (e.key === 'ArrowLeft') {
        const next = Math.max(0, currentPct - 5);
        afterLayer.style.width = `${next}%`;
        handle.style.left = `${next}%`;
      } else if (e.key === 'ArrowRight') {
        const next = Math.min(100, currentPct + 5);
        afterLayer.style.width = `${next}%`;
        handle.style.left = `${next}%`;
      }
    });
  };

  /* ==========================================================================
     6. Animações e Scroll Reveal Suaves
     ========================================================================== */
  const initScrollAnimations = () => {
    const navbar = document.getElementById('navbar');
    
    window.addEventListener('scroll', () => {
      if (window.scrollY > 40) {
        navbar?.classList.add('scrolled');
      } else {
        navbar?.classList.remove('scrolled');
      }
    }, { passive: true });

    const revealItems = document.querySelectorAll('.reveal-item');
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver((entries, obs) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('revealed');
            obs.unobserve(entry.target);
          }
        });
      }, {
        threshold: 0.12,
        rootMargin: '0px 0px -40px 0px'
      });

      revealItems.forEach(el => observer.observe(el));
    } else {
      revealItems.forEach(el => el.classList.add('revealed'));
    }
  };

  /* ==========================================================================
     7. Navegação Mobile & Modais
     ========================================================================== */
  const initMobileNavigation = () => {
    const toggleBtn = document.getElementById('mobile-toggle');
    const navMenu = document.getElementById('nav-menu');
    const navLinks = document.querySelectorAll('.nav-link');

    if (!toggleBtn || !navMenu) return;

    toggleBtn.addEventListener('click', () => {
      navMenu.classList.toggle('mobile-open');
    });

    navLinks.forEach(link => {
      link.addEventListener('click', () => {
        navMenu.classList.remove('mobile-open');
      });
    });
  };

  const openModal = (modalId) => {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.add('open');
  };

  const closeModal = (modalId) => {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.remove('open');
  };

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal-overlay.open').forEach(m => m.classList.remove('open'));
    }
  });

  document.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal-overlay')) {
      e.target.classList.remove('open');
    }
  });

  /* ==========================================================================
     8. Notificações Toast
     ========================================================================== */
  let toastTimer = null;
  const showToast = (message) => {
    const toast = document.getElementById('toast');
    if (!toast) return;

    toast.innerHTML = `<i class="fa-solid fa-circle-check"></i> ${sanitizeInput(message)}`;
    toast.classList.add('show');

    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toast.classList.remove('show');
    }, 3500);
  };

  /* ==========================================================================
     9. Inicialização
     ========================================================================== */
  const init = () => {
    initBusinessStatus();
    initComparisonSlider();
    initScrollAnimations();
    initMobileNavigation();
    calculateEstimate();

    setInterval(initBusinessStatus, 60000);
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  return {
    calculateEstimate,
    handleQuoteSubmit,
    openDirectWhatsApp,
    copyAddress,
    openModal,
    closeModal,
    showToast
  };
})();
