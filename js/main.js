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
     3. Carrossel Interativo de Vídeos dos Trabalhos Reais
     ========================================================================== */
  let currentVideoIndex = 0;

  const initVideosCarousel = () => {
    const wrapper = document.getElementById('videos-carousel-wrapper');
    const track = document.getElementById('videos-track');
    const prevBtn = document.getElementById('video-prev-btn');
    const nextBtn = document.getElementById('video-next-btn');
    const currentIndexEl = document.getElementById('video-current-index');
    const totalCountEl = document.getElementById('video-total-count');
    const dotsContainer = document.getElementById('carousel-dots');

    if (!wrapper || !track) return;

    const cards = track.querySelectorAll('.video-card');
    const totalCards = cards.length;
    if (totalCards === 0) return;

    if (totalCountEl) totalCountEl.textContent = totalCards;

    // Criar dots indicadores
    if (dotsContainer) {
      dotsContainer.innerHTML = '';
      for (let i = 0; i < totalCards; i++) {
        const dot = document.createElement('button');
        dot.className = `dot ${i === 0 ? 'active' : ''}`;
        dot.setAttribute('aria-label', `Ir para o vídeo ${i + 1}`);
        dot.addEventListener('click', () => {
          goToSlide(i);
        });
        dotsContainer.appendChild(dot);
      }
    }

    const getVisibleCount = () => {
      const w = window.innerWidth;
      if (w <= 768) return 1;
      if (w <= 992) return 2;
      return 3;
    };

    const getMaxIndex = () => {
      const visible = getVisibleCount();
      return Math.max(0, totalCards - visible);
    };

    const pauseAllVideos = () => {
      track.querySelectorAll('video').forEach(vid => {
        if (!vid.paused) {
          vid.pause();
        }
      });
    };

    const updateCarousel = () => {
      const maxIndex = getMaxIndex();
      if (currentVideoIndex > maxIndex) {
        currentVideoIndex = maxIndex;
      }
      if (currentVideoIndex < 0) {
        currentVideoIndex = 0;
      }

      const card = cards[0];
      if (!card) return;

      const cardWidth = card.getBoundingClientRect().width;
      const gap = 24; // 1.5rem
      const offset = currentVideoIndex * (cardWidth + gap);

      track.style.transform = `translateX(-${offset}px)`;

      if (currentIndexEl) {
        currentIndexEl.textContent = currentVideoIndex + 1;
      }

      if (prevBtn) {
        prevBtn.disabled = currentVideoIndex === 0;
      }
      if (nextBtn) {
        nextBtn.disabled = currentVideoIndex >= maxIndex;
      }

      if (dotsContainer) {
        const dots = dotsContainer.querySelectorAll('.dot');
        dots.forEach((dot, idx) => {
          dot.classList.toggle('active', idx === currentVideoIndex);
        });
      }
    };

    const goToSlide = (index) => {
      pauseAllVideos();
      const maxIndex = getMaxIndex();
      currentVideoIndex = Math.max(0, Math.min(index, maxIndex));
      updateCarousel();
    };

    const nextSlide = () => {
      pauseAllVideos();
      const maxIndex = getMaxIndex();
      if (currentVideoIndex < maxIndex) {
        currentVideoIndex++;
      } else {
        currentVideoIndex = 0;
      }
      updateCarousel();
    };

    const prevSlide = () => {
      pauseAllVideos();
      const maxIndex = getMaxIndex();
      if (currentVideoIndex > 0) {
        currentVideoIndex--;
      } else {
        currentVideoIndex = maxIndex;
      }
      updateCarousel();
    };

    if (prevBtn) {
      prevBtn.addEventListener('click', prevSlide);
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', nextSlide);
    }

    // Suporte a Touch & Swipe em Dispositivos Móveis
    let touchStartX = 0;
    let touchStartY = 0;
    let touchEndX = 0;
    let touchEndY = 0;
    let isSwiping = false;

    wrapper.addEventListener('touchstart', (e) => {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
      touchEndX = touchStartX;
      touchEndY = touchStartY;
      isSwiping = true;
    }, { passive: true });

    wrapper.addEventListener('touchmove', (e) => {
      if (!isSwiping) return;
      touchEndX = e.touches[0].clientX;
      touchEndY = e.touches[0].clientY;
    }, { passive: true });

    wrapper.addEventListener('touchend', () => {
      if (!isSwiping) return;
      isSwiping = false;
      const deltaX = touchStartX - touchEndX;
      const deltaY = touchStartY - touchEndY;

      // Dispara se o movimento for horizontal e maior que 40px
      if (Math.abs(deltaX) > 40 && Math.abs(deltaX) > Math.abs(deltaY)) {
        if (deltaX > 0) {
          nextSlide();
        } else {
          prevSlide();
        }
      }
    });

    // Redimensionamento responsivo
    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(updateCarousel, 150);
    });

    // Garantir silêncio total (áudio desativado) e pausar outros vídeos quando um der play
    cards.forEach(card => {
      const vid = card.querySelector('video');
      if (vid) {
        vid.muted = true;
        vid.defaultMuted = true;
        vid.volume = 0;

        vid.addEventListener('volumechange', () => {
          if (!vid.muted || vid.volume > 0) {
            vid.muted = true;
            vid.volume = 0;
          }
        });

        vid.addEventListener('play', () => {
          track.querySelectorAll('video').forEach(otherVid => {
            if (otherVid !== vid && !otherVid.paused) {
              otherVid.pause();
            }
          });
        });
      }
    });

    updateCarousel();
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
    initScrollAnimations();
    initMobileNavigation();
    initVideosCarousel();

    setInterval(initBusinessStatus, 60000);
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  return {
    initVideosCarousel,
    openDirectWhatsApp,
    copyAddress,
    openModal,
    closeModal,
    showToast
  };
})();
