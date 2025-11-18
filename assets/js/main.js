// ===================================
// 1. CARROSSEL DE IMAGENS MELHORADO (PÁGINA PRODUTO)
// ===================================
const carousel = document.getElementById('carousel');
if (carousel && carousel.children.length > 1) {
    const total = carousel.children.length;
    const images = Array.from(carousel.children);
    const skeleton = document.querySelector('.carousel-skeleton');
    const statusElement = document.getElementById('carousel-status');
    let index = 0;
    let autoplay;
    let isUserInteracting = false;

    // Carrega imagens adjacentes (lazy load inteligente)
    function lazyLoadAdjacent(currentIndex) {
        const toLoad = [
            currentIndex - 1 < 0 ? total - 1 : currentIndex - 1,
            currentIndex,
            currentIndex + 1 >= total ? 0 : currentIndex + 1
        ];
        toLoad.forEach(i => {
            const img = images[i];
            if (img && img.dataset.src && !img.src) {
                img.src = img.dataset.src;
                img.onload = () => {
                    img.classList.add('loaded');
                    if (i === 0 && skeleton) skeleton.classList.add('loaded');
                };
            }
        });
    }

    // Atualiza posição do carrossel e indicadores
    function updateCarousel(newIndex) {
        index = newIndex;
        carousel.style.transform = `translateX(-${index * 100}%)`;

        // Atualiza ARIA para screen readers
        if (statusElement) statusElement.textContent = `Imagem ${index + 1} de ${total}`;

        // Atualiza indicadores (bolinhas)
        document.querySelectorAll('.carousel-indicator').forEach((dot, i) => {
            if (i === index) {
                dot.classList.remove('bg-white/50');
                dot.classList.add('bg-white', 'scale-125');
                dot.setAttribute('aria-current', 'true');
            } else {
                dot.classList.remove('bg-white', 'scale-125');
                dot.classList.add('bg-white/50');
                dot.removeAttribute('aria-current');
            }
        });

        // Atualiza thumbnails
        document.querySelectorAll('.thumbnail').forEach((thumb, i) => {
            if (i === index) thumb.classList.add('ring-2', 'ring-blue-500');
            else thumb.classList.remove('ring-2', 'ring-blue-500');
        });

        lazyLoadAdjacent(index);
    }

    // Pausa autoplay
    function pauseAutoplay() {
        if (autoplay) {
            clearInterval(autoplay);
            autoplay = null;
        }
        isUserInteracting = true;
    }

    // Retoma autoplay
    function resumeAutoplay() {
        isUserInteracting = false;
        if (!autoplay) startAutoplay();
    }

    // Inicia autoplay
    function startAutoplay() {
        if (!isUserInteracting) {
            autoplay = setInterval(() => {
                if (!isUserInteracting) updateCarousel((index + 1) % total);
            }, 5000);
        }
    }

    // Botões Next/Prev
    const nextBtn = document.getElementById('next');
    const prevBtn = document.getElementById('prev');
    const carouselContainer = carousel.parentElement;

    if (nextBtn) nextBtn.onclick = () => { pauseAutoplay(); updateCarousel((index + 1) % total); setTimeout(resumeAutoplay, 3000); };
    if (prevBtn) prevBtn.onclick = () => { pauseAutoplay(); updateCarousel((index - 1 + total) % total); setTimeout(resumeAutoplay, 3000); };

    // Indicadores e thumbnails clicáveis
    document.querySelectorAll('.carousel-indicator').forEach((dot, i) => {
        dot.onclick = () => { pauseAutoplay(); updateCarousel(i); setTimeout(resumeAutoplay, 3000); };
    });
    document.querySelectorAll('.thumbnail').forEach((thumb, i) => {
        thumb.onclick = () => { pauseAutoplay(); updateCarousel(i); setTimeout(resumeAutoplay, 3000); };
    });

    // Pause on hover/focus
    if (carouselContainer) {
        carouselContainer.addEventListener('mouseenter', pauseAutoplay);
        carouselContainer.addEventListener('mouseleave', () => { setTimeout(() => { if (!isUserInteracting) resumeAutoplay(); }, 500); });
        carouselContainer.addEventListener('focusin', pauseAutoplay);
        carouselContainer.addEventListener('focusout', () => { setTimeout(() => { if (!isUserInteracting) resumeAutoplay(); }, 500); });
    }

    // Inicialização
    lazyLoadAdjacent(0);
    updateCarousel(0);
    startAutoplay();
    if (images[0] && images[0].complete && skeleton) skeleton.classList.add('loaded');
}

// ===================================
// 1.5. CARROSSÉIS DE PRODUTOS NA HOME (COM TOUCH)
// ===================================
document.querySelectorAll('.produtos-carousel-container').forEach(container => {
    const carousel = container.querySelector('.produtos-carousel');
    const prevBtn = container.querySelector('.carousel-nav-prev');
    const nextBtn = container.querySelector('.carousel-nav-next');
    const indicatorsContainer = container.querySelector('.carousel-indicators');
    
    if (!carousel) return;
    
    const cards = carousel.querySelectorAll('.produto-carousel-card');
    if (cards.length === 0) return;
    
    const cardWidth = 280 + 16; // largura do card + gap
    let currentPage = 0;
    let cardsPerPage = 1;
    let totalPages = 1;
    
    // ===== CALCULAR PÁGINAS =====
    function calculatePages() {
        const containerWidth = carousel.offsetWidth;
        cardsPerPage = Math.floor(containerWidth / cardWidth);
        if (cardsPerPage < 1) cardsPerPage = 1;
        totalPages = Math.ceil(cards.length / cardsPerPage);
        
        // Criar indicadores dinamicamente
        createIndicators();
    }
    
    // ===== CRIAR INDICADORES =====
    function createIndicators() {
        if (!indicatorsContainer) return;
        indicatorsContainer.innerHTML = '';
        
        for (let i = 0; i < totalPages; i++) {
            const indicator = document.createElement('button');
            indicator.className = 'carousel-indicator w-2 h-2 rounded-full bg-blue-400 hover:bg-blue-500 transition-all';
            indicator.setAttribute('data-page', i);
            indicator.setAttribute('aria-label', `Ir para página ${i + 1}`);
            indicator.addEventListener('click', () => goToPage(i));
            indicatorsContainer.appendChild(indicator);
        }
        
        updateIndicators();
    }
    
    // ===== LAZY LOADING INTELIGENTE =====
    function lazyLoadNearby(page) {
        const startIndex = page * cardsPerPage;
        const endIndex = Math.min(startIndex + cardsPerPage + 2, cards.length);
        
        for (let i = Math.max(0, startIndex - 1); i < endIndex; i++) {
            const img = cards[i]?.querySelector('img[loading="lazy"]');
            if (img && img.dataset.src && !img.src) {
                img.src = img.dataset.src;
            }
        }
    }
    
    // ===== ATUALIZAR INDICADORES =====
    function updateIndicators() {
        const scrollLeft = carousel.scrollLeft;
        const pageWidth = cardsPerPage * cardWidth;
        const newPage = Math.round(scrollLeft / pageWidth);
        
        if (newPage !== currentPage && newPage >= 0 && newPage < totalPages) {
            currentPage = newPage;
            lazyLoadNearby(currentPage);
        }
        
        const indicators = indicatorsContainer?.querySelectorAll('.carousel-indicator');
        indicators?.forEach((indicator, i) => {
            if (i === currentPage) {
                indicator.classList.add('active');
            } else {
                indicator.classList.remove('active');
            }
        });
    }
    
    // ===== NAVEGAÇÃO =====
    function goToPage(page) {
        if (page < 0 || page >= totalPages) return;
        
        const targetScroll = page * cardsPerPage * cardWidth;
        carousel.scrollTo({
            left: targetScroll,
            behavior: 'smooth'
        });
        currentPage = page;
    }
    
    function scrollCarousel(direction) {
        let targetPage;
        if (direction === 'next') {
            targetPage = currentPage + 1;
            if (targetPage >= totalPages) targetPage = 0; // Loop
        } else {
            targetPage = currentPage - 1;
            if (targetPage < 0) targetPage = totalPages - 1; // Loop reverso
        }
        goToPage(targetPage);
    }
    
    // ===== EVENT LISTENERS =====
    
    // Botões de navegação
    if (prevBtn) prevBtn.addEventListener('click', () => scrollCarousel('prev'));
    if (nextBtn) nextBtn.addEventListener('click', () => scrollCarousel('next'));
    
    // Scroll listener
    carousel.addEventListener('scroll', updateIndicators);
    
    // ===== TOUCH SUPPORT (Mobile/Tablet) =====
    let touchStartX = 0;
    let touchEndX = 0;
    let scrollStartLeft = 0;
    
    carousel.addEventListener('touchstart', (e) => {
        touchStartX = e.touches[0].clientX;
        scrollStartLeft = carousel.scrollLeft;
    }, { passive: true });
    
    carousel.addEventListener('touchmove', (e) => {
        // O scroll nativo do navegador já cuida do movimento
        // Este listener é apenas para rastrear
    }, { passive: true });
    
    carousel.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].clientX;
        const swipeDistance = touchStartX - touchEndX;
        
        // Se deslizou mais de 50px, considera como swipe
        if (Math.abs(swipeDistance) > 50) {
            // Atualiza o indicador baseado na posição final
            setTimeout(updateIndicators, 100);
        }
    }, { passive: true });
    
    // Resize listener - recalcular páginas
    window.addEventListener('resize', () => {
        calculatePages();
        goToPage(currentPage); // Reposiciona
    });
    
    // ===== KEYBOARD NAVIGATION =====
    document.addEventListener('keydown', (e) => {
        // Só funciona se o carrossel estiver visível na tela
        const rect = carousel.getBoundingClientRect();
        const isVisible = rect.top < window.innerHeight && rect.bottom > 0;
        
        if (!isVisible) return;
        
        switch(e.key) {
            case 'ArrowLeft':
                e.preventDefault();
                scrollCarousel('prev');
                break;
            case 'ArrowRight':
                e.preventDefault();
                scrollCarousel('next');
                break;
        }
    });
    
    // Inicialização
    calculatePages();
    lazyLoadNearby(0);
    updateIndicators();
});

// ===================================
// 2. FUNÇÕES QUE PRECISAM DO DOM PRONTO
// ===================================
document.addEventListener('DOMContentLoaded', () => {

    // ===================== MENU MOBILE =====================
    const menuBtn = document.getElementById('menu-btn');
    const mobileMenu = document.getElementById('mobile-menu');
    if (menuBtn && mobileMenu) {
        menuBtn.addEventListener('click', () => {
            mobileMenu.classList.toggle('hidden');
            menuBtn.textContent = mobileMenu.classList.contains('hidden') ? '☰' : '✕';
        });
        mobileMenu.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => { mobileMenu.classList.add('hidden'); menuBtn.textContent = '☰'; });
        });
    }

    // ===================== SISTEMA DE TABS =====================
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabId = button.dataset.tab;
            tabButtons.forEach(btn => { btn.classList.remove('active', 'border-blue-500', 'text-gray-700'); btn.classList.add('border-transparent', 'text-gray-500'); });
            tabContents.forEach(content => content.classList.add('hidden'));
            button.classList.add('active', 'border-blue-500', 'text-gray-700');
            button.classList.remove('border-transparent', 'text-gray-500');
            const targetContent = document.getElementById(`tab-${tabId}`);
            if (targetContent) targetContent.classList.remove('hidden');
        });
    });

    // ===================== OVERLAY DE OFERTAS =====================
    document.querySelectorAll('.toggle-ofertas').forEach(btn => {
        btn.addEventListener('click', e => { 
            e.stopPropagation(); 
            e.preventDefault(); 
            const overlay = btn.closest('.produto-carousel-card')?.querySelector('.ofertas-overlay') || btn.closest('.product-card')?.querySelector('.ofertas-overlay'); 
            if (overlay) overlay.classList.add('show'); 
        });
    });
    document.querySelectorAll('.close-ofertas').forEach(btn => {
        btn.addEventListener('click', e => { e.stopPropagation(); const overlay = btn.closest('.ofertas-overlay'); if (overlay) overlay.classList.remove('show'); });
    });
    document.querySelectorAll('.ofertas-overlay').forEach(overlay => {
        overlay.addEventListener('click', e => { if (e.target === overlay) overlay.classList.remove('show'); });
    });

    // ===================== FILTROS =====================
    const filterBtns = document.querySelectorAll('.filter-btn');
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const filtro = btn.dataset.filter;
            const produtosCards = document.querySelectorAll('.grid-produtos > div');
            produtosCards.forEach(p => { p.classList.toggle('hidden', !(filtro === 'all' || p.dataset.categoria === filtro)); });
            filterBtns.forEach(b => { b.classList.remove('ring-2', 'ring-blue-300', 'bg-blue-600'); b.classList.add('bg-blue-500'); });
            btn.classList.add('ring-2', 'ring-blue-300', 'bg-blue-600'); btn.classList.remove('bg-blue-500');
        });
    });

    // ===================== PESQUISA =====================
    const searchInput = document.getElementById('search-input');
    const searchBtn = document.getElementById('search-btn');
    if (searchInput && searchBtn) {
        function pesquisar() {
            const termo = searchInput.value.toLowerCase();
            document.querySelectorAll('.grid-produtos > div').forEach(p => {
                const nome = p.querySelector('h3')?.textContent.toLowerCase() || '';
                p.classList.toggle('hidden', !nome.includes(termo));
            });
        }
        searchBtn.addEventListener('click', pesquisar);
        searchInput.addEventListener('keyup', e => { if (e.key === 'Enter') pesquisar(); });
    }

    // ===================== SHARE BUTTONS =====================
    window.shareOnTwitter = () => { const url = window.location.href; const title = document.querySelector('h1')?.textContent || ''; window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`, '_blank'); };
    window.shareOnFacebook = () => { const url = window.location.href; window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank'); };
    window.shareOnWhatsApp = () => { const url = window.location.href; const title = document.querySelector('h1')?.textContent || ''; window.open(`https://wa.me/?text=${encodeURIComponent(title + ' ' + url)}`, '_blank'); };
    window.copyLink = event => {
        const url = window.location.href;
        navigator.clipboard.writeText(url).then(() => {
            const btn = event.target.closest('button'); if (!btn) return;
            const originalText = btn.innerHTML; btn.innerHTML = '✓ Copiado!'; btn.classList.add('bg-green-500');
            setTimeout(() => { btn.innerHTML = originalText; btn.classList.remove('bg-green-500'); }, 2000);
        });
    };

    // ===================== PROGRESS BAR DE LEITURA =====================
    const progressBar = document.getElementById('progress-bar');
    if (progressBar) {
        window.addEventListener('scroll', () => {
            const winScroll = document.documentElement.scrollTop || document.body.scrollTop;
            const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
            const scrolled = (winScroll / height) * 100;
            progressBar.style.width = scrolled + '%';
        });
    }

    // ===================== SMOOTH SCROLL =====================
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const target = document.querySelector(this.getAttribute('href'));
            if (target) { e.preventDefault(); target.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
        });
    });

    // ===================== LINKS EXTERNOS =====================
    document.querySelectorAll('.post-content a').forEach(link => {
        const href = link.getAttribute('href');
        if (href && (href.startsWith('http://') || href.startsWith('https://')) && !href.includes(window.location.hostname)) {
            link.setAttribute('target', '_blank');
            link.setAttribute('rel', 'noopener noreferrer');
        }
    });

});