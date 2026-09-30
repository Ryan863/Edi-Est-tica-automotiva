/**
 * EDI ESTÉTICA AUTOMOTIVA - JAVASCRIPT PRINCIPAL
 * Módulos: WhatsApp Builder, Google Maps, Antes & Depois, Animações e Segurança Web
 */

const EDIApp = (() => {
  'use strict';

  // Configurações Oficiais da Empresa (Extraídas do Perfil no Google)
  const CONFIG = {
    whatsappNumber: '5549988449865', // (49) 98844-9865
    businessName: 'EDI Estética Automotiva',
    address: "Rua Luiza Piovesan Martini, 50 - Loteamento Trevisan, Bairro São Jorge - Herval d'Oeste - SC, 89610-000",
    mapsUrl: "https://maps.google.com/?q=Rua+Luiza+Piovesan+Martini,+50,+Herval+d%27Oeste+-+SC",
    wazeUrl: "https://waze.com/ul?q=Rua+Luiza+Piovesan+Martini+50+Herval+d+Oeste",
    rateLimitCooldownMs: 2500 // Prevenção contra spam de cliques
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
     1. Módulo de Segurança Web Básica (Anti-XSS, Sanitização e Anti-Spam)
     ========================================================================== */
  
  /**
   * Sanitiza strings para neutralizar injeções de script (XSS)
   * @param {string} str - Texto recebido do usuário
   * @returns {string} - Texto seguro sem tags executáveis
   */
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

  /**
   * Remove caracteres não permitidos para envio limpo
   */
  const cleanPlainText = (str) => {
    if (!str) return '';
    return str.trim().replace(/[<>]/g, '');
  };

  /* ==========================================================================
     2. Status Operacional em Tempo Real (Horário de Funcionamento)
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
    } else if (day === 6) { // Sábado: 08:00 - 14:00
      if (currentTime >= 8.0 && currentTime < 14.0) {
        isOpen = true;
        closingTime = '14:00';
      }
    }

    if (isOpen) {
      dot.className = 'status-dot pulsing';
      dot.style.background = 'var(--whatsapp-green)';
      label.textContent = `Estúdio Aberto Hoje (até às ${closingTime})`;
    } else {
      dot.className = 'status-dot';
      dot.style.background = '#eab308';
      const openMessage = day === 0 ? 'Abre amanhã às 08:00' : (currentTime < 8 ? 'Abre hoje às 08:00' : 'Abre amanhã às 08:00');
      label.textContent = `Fechado no momento (${openMessage})`;
    }
  };

  /* ==========================================================================
     3. Simulador de Orçamento & Integração com WhatsApp
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

    // Atualiza o resumo visual
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

    // 1. Verificação Anti-Spam (Rate limiting)
    const now = Date.now();
    if (now - lastSubmitTime < CONFIG.rateLimitCooldownMs) {
      showToast('Por favor, aguarde alguns segundos antes de reenviar.');
      return;
    }

    // 2. Verificação de Honeypot contra Robôs
    const trap = document.getElementById('website_trap_field');
    if (trap && trap.value.trim() !== '') {
      console.warn('Bot detectado pelo campo de segurança.');
      return;
    }

    // 3. Validação dos Campos de Entrada
    const nameInput = document.getElementById('client_name');
    const carInput = document.getElementById('car_model');
    const nameError = document.getElementById('name-error');
    const carError = document.getElementById('car-error');

    if (nameError) nameError.textContent = '';
    if (carError) carError.textContent = '';

    const rawName = nameInput ? nameInput.value : '';
    const rawCar = carInput ? carInput.value : '';

    const cleanName = cleanPlainText(rawName);
    const cleanCar = cleanPlainText(rawCar);

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

    // 4. Montagem dos Dados do Orçamento
    const estimate = calculateEstimate();
    if (estimate.selectedServices.length === 0) {
      showToast('Selecione ao menos 1 serviço para o orçamento.');
      return;
    }

    lastSubmitTime = now;

    // 5. Construção da Mensagem Formatada para o WhatsApp
    const saudacao = getSaudacaoHorario();
    let msg = `${saudacao}! Meu nome é *${cleanName}*.\n`;
    msg += `Gostaria de solicitar um orçamento para meu veículo:\n\n`;
    msg += `🚗 *Veículo:* ${cleanCar}\n`;
    msg += `🏷️ *Categoria:* ${estimate.vehicleType}\n\n`;
    msg += `✨ *Serviços Selecionados:*\n`;

    estimate.selectedServices.forEach((serv) => {
      msg += ` • ${serv}\n`;
    });

    if (estimate.calculatedTotal > 0) {
      msg += `\n💰 *Estimativa do Site:* A partir de R$ ${estimate.calculatedTotal.toLocaleString('pt-BR')}\n`;
    }
    msg += `\nVi o site da *EDI Estética Automotiva* e gostaria de agendar uma data. Aguardo seu retorno!`;

    // 6. Abertura Segura do WhatsApp
    const encodedMsg = encodeURIComponent(msg);
    const whatsappLink = `https://wa.me/${CONFIG.whatsappNumber}?text=${encodedMsg}`;
    window.open(whatsappLink, '_blank', 'noopener,noreferrer');

    showToast('Redirecionando para o WhatsApp da EDI...');
  };

  /**
   * Atalho para mensagem direta vinda dos cards de serviços
   */
  const openDirectWhatsApp = (customText) => {
    const saudacao = getSaudacaoHorario();
    const safeText = cleanPlainText(customText);
    const msg = `${saudacao}! Estava no site da EDI Estética Automotiva e ${safeText}. Poderiam me passar mais informações sobre valores e disponibilidade?`;
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
     4. Módulo Google Maps & Copiar Endereço
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
     5. Slider Interativo de Antes & Depois
     ========================================================================== */
  const initComparisonSlider = () => {
    const container = document.getElementById('comparison-slider');
    const afterLayer = document.getElementById('comp-after-layer');
    const handle = document.getElementById('comp-handle');
    if (!container || !afterLayer || !handle) return;

    let isSliding = false;

    const setPosition = (clientX) => {
      const rect = container.getBoundingClientRect();
      let positionX = clientX - rect.left;
      if (positionX < 0) positionX = 0;
      if (positionX > rect.width) positionX = rect.width;

      const percentage = (positionX / rect.width) * 100;
      afterLayer.style.width = `${percentage}%`;
      handle.style.left = `${percentage}%`;
    };

    // Eventos de Mouse
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

    // Eventos de Touch (Mobile)
    container.addEventListener('touchstart', (e) => {
      isSliding = true;
      if (e.touches && e.touches[0]) setPosition(e.touches[0].clientX);
    }, { passive: true });

    window.addEventListener('touchend', () => {
      isSliding = false;
    });

    window.addEventListener('touchmove', (e) => {
      if (!isSliding) return;
      if (e.touches && e.touches[0]) setPosition(e.touches[0].clientX);
    }, { passive: true });

    // Acessibilidade via Teclado
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
     6. Animações Modernas & Scroll Reveal
     ========================================================================== */
  const initScrollAnimations = () => {
    const navbar = document.getElementById('navbar');
    
    // Navbar com efeito de vidro ao rolar
    window.addEventListener('scroll', () => {
      if (window.scrollY > 40) {
        navbar?.classList.add('scrolled');
      } else {
        navbar?.classList.remove('scrolled');
      }
    }, { passive: true });

    // Intersection Observer para reveal suave dos elementos
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
        threshold: 0.15,
        rootMargin: '0px 0px -50px 0px'
      });

      revealItems.forEach(el => observer.observe(el));
    } else {
      // Fallback para navegadores sem observer
      revealItems.forEach(el => el.classList.add('revealed'));
    }

    // Microinteração de mouse parallax no carro hero (Desktop)
    const heroCar = document.getElementById('hero-car');
    if (heroCar && window.innerWidth > 992) {
      const heroSec = document.getElementById('hero');
      heroSec?.addEventListener('mousemove', (e) => {
        const rect = heroSec.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width - 0.5;
        const y = (e.clientY - rect.top) / rect.height - 0.5;
        heroCar.style.transform = `perspective(1000px) rotateY(${x * 4}deg) rotateX(${-y * 3}deg) scale(1.01)`;
      }, { passive: true });

      heroSec?.addEventListener('mouseleave', () => {
        heroCar.style.transform = 'perspective(1000px) rotateY(0deg) rotateX(0deg) scale(1)';
      });
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

  // Fechamento de modal com clique fora ou tecla ESC
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
     9. Inicialização Geral
     ========================================================================== */
  const init = () => {
    initBusinessStatus();
    initComparisonSlider();
    initScrollAnimations();
    initMobileNavigation();
    calculateEstimate();

    // Atualiza status a cada 60 segundos
    setInterval(initBusinessStatus, 60000);
  };

  // Executa ao carregar o DOM
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // API Pública
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
