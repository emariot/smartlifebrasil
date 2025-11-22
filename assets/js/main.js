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

    function updateCarousel(newIndex) {
        index = newIndex;
        carousel.style.transform = `translateX(-${index * 100}%)`;

        if (statusElement) statusElement.textContent = `Imagem ${index + 1} de ${total}`;

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

        document.querySelectorAll('.thumbnail').forEach((thumb, i) => {
            if (i === index) thumb.classList.add('ring-2', 'ring-blue-500');
            else thumb.classList.remove('ring-2', 'ring-blue-500');
        });

        lazyLoadAdjacent(index);
    }

    function pauseAutoplay() {
        if (autoplay) {
            clearInterval(autoplay);
            autoplay = null;
        }
        isUserInteracting = true;
    }

    function resumeAutoplay() {
        isUserInteracting = false;
        if (!autoplay) startAutoplay();
    }

    function startAutoplay() {
        if (!isUserInteracting) {
            autoplay = setInterval(() => {
                if (!isUserInteracting) updateCarousel((index + 1) % total);
            }, 5000);
        }
    }

    const nextBtn = document.getElementById('next');
    const prevBtn = document.getElementById('prev');
    const carouselContainer = carousel.parentElement;

    if (nextBtn) nextBtn.onclick = () => { pauseAutoplay(); updateCarousel((index + 1) % total); setTimeout(resumeAutoplay, 3000); };
    if (prevBtn) prevBtn.onclick = () => { pauseAutoplay(); updateCarousel((index - 1 + total) % total); setTimeout(resumeAutoplay, 3000); };

    document.querySelectorAll('.carousel-indicator').forEach((dot, i) => {
        dot.onclick = () => { pauseAutoplay(); updateCarousel(i); setTimeout(resumeAutoplay, 3000); };
    });
    document.querySelectorAll('.thumbnail').forEach((thumb, i) => {
        thumb.onclick = () => { pauseAutoplay(); updateCarousel(i); setTimeout(resumeAutoplay, 3000); };
    });

    if (carouselContainer) {
        carouselContainer.addEventListener('mouseenter', pauseAutoplay);
        carouselContainer.addEventListener('mouseleave', () => { setTimeout(() => { if (!isUserInteracting) resumeAutoplay(); }, 500); });
        carouselContainer.addEventListener('focusin', pauseAutoplay);
        carouselContainer.addEventListener('focusout', () => { setTimeout(() => { if (!isUserInteracting) resumeAutoplay(); }, 500); });
    }

    lazyLoadAdjacent(0);
    updateCarousel(0);
    startAutoplay();
    if (images[0] && images[0].complete && skeleton) skeleton.classList.add('loaded');
}

// ===================================
// 1.5. CARROSSEL HOME (LARGURA DINÂMICA + TOUCH)
// ===================================
document.querySelectorAll('.produtos-carousel-container').forEach(container => {
    const carousel = container.querySelector('.produtos-carousel');
    const prevBtn = container.querySelector('.carousel-nav-prev');
    const nextBtn = container.querySelector('.carousel-nav-next');
    const indicatorsContainer = container.querySelector('.carousel-indicators');
    
    if (!carousel) return;
    
    const cards = carousel.querySelectorAll('.produto-carousel-card');
    if (cards.length === 0) return;
    
    let currentPage = 0;
    let cardsPerPage = 1;
    let totalPages = 1;
    let cardWidth = 0;
    
    // ===== ATUALIZA MÉTRICAS (Largura Real do Card) =====
    function updateMetrics() {
        const firstCard = cards[0];
        // Pega largura real + gap do grid (gap-4 = 16px)
        if (firstCard) {
            cardWidth = firstCard.offsetWidth + 16;
        }
        
        const containerWidth = carousel.offsetWidth;
        cardsPerPage = Math.floor(containerWidth / cardWidth);
        
        // No mobile (85vw), o cálculo pode dar 0 ou quase 1. Forçamos 1.
        if (cardsPerPage < 1) cardsPerPage = 1;
        
        totalPages = Math.ceil(cards.length / cardsPerPage);
    }

    // ===== CALCULAR PÁGINAS =====
    function calculatePages() {
        updateMetrics();
        createIndicators();
    }
    
    // ===== CRIAR INDICADORES =====
    function createIndicators() {
        if (!indicatorsContainer) return;
        indicatorsContainer.innerHTML = '';
        
        // Se só tiver 1 página, esconde
        if (totalPages <= 1) return;

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
    
    // ===== LAZY LOADING =====
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
        updateMetrics(); // Garante medida atualizada
        
        const scrollLeft = carousel.scrollLeft;
        // Calcula página atual baseado no scroll
        const newPage = Math.round(scrollLeft / (cardsPerPage * cardWidth));
        
        if (newPage !== currentPage) {
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
        updateMetrics();
        if (page < 0) page = 0;
        if (page >= totalPages) page = totalPages - 1;
        
        const targetScroll = page * cardsPerPage * cardWidth;
        carousel.scrollTo({
            left: targetScroll,
            behavior: 'smooth'
        });
        currentPage = page;
    }
    
    function scrollCarousel(direction) {
        updateMetrics();
        let targetPage;
        if (direction === 'next') {
            targetPage = currentPage + 1;
            if (targetPage >= totalPages) targetPage = 0;
        } else {
            targetPage = currentPage - 1;
            if (targetPage < 0) targetPage = totalPages - 1;
        }
        goToPage(targetPage);
    }
    
    // ===== EVENT LISTENERS =====
    if (prevBtn) prevBtn.addEventListener('click', () => scrollCarousel('prev'));
    if (nextBtn) nextBtn.addEventListener('click', () => scrollCarousel('next'));
    
    let scrollTimeout;
    carousel.addEventListener('scroll', () => {
        if (scrollTimeout) clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(updateIndicators, 50);
    }, { passive: true });
    
    // Touch logic
    let touchStartX = 0;
    carousel.addEventListener('touchstart', (e) => { touchStartX = e.touches[0].clientX; }, { passive: true });
    carousel.addEventListener('touchend', (e) => {
        const touchEndX = e.changedTouches[0].clientX;
        if (Math.abs(touchStartX - touchEndX) > 50) {
            setTimeout(updateIndicators, 100);
        }
    }, { passive: true });
    
    // Resize
    window.addEventListener('resize', () => {
        calculatePages();
        goToPage(currentPage);
    });
    
    // Teclado
    document.addEventListener('keydown', (e) => {
        const rect = carousel.getBoundingClientRect();
        if (rect.top < window.innerHeight && rect.bottom > 0) {
            if(e.key === 'ArrowLeft') scrollCarousel('prev');
            if(e.key === 'ArrowRight') scrollCarousel('next');
        }
    });
    
    // Inicialização
    setTimeout(() => {
        calculatePages();
        lazyLoadNearby(0);
        updateIndicators();
    }, 100);
});

// ===================================
// 2. FUNÇÕES GERAIS (DOM READY)
// ===================================
document.addEventListener('DOMContentLoaded', () => {
    // Menu Mobile
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

    // Tabs
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

    // Ofertas Overlay
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

    // Filtros
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

    // Pesquisa
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

    // Share Buttons
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

    // Progress Bar
    const progressBar = document.getElementById('progress-bar');
    if (progressBar) {
        window.addEventListener('scroll', () => {
            const winScroll = document.documentElement.scrollTop || document.body.scrollTop;
            const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
            const scrolled = (winScroll / height) * 100;
            progressBar.style.width = scrolled + '%';
        });
    }

    // Smooth Scroll
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const target = document.querySelector(this.getAttribute('href'));
            if (target) { e.preventDefault(); target.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
        });
    });

    // Links Externos
    document.querySelectorAll('.post-content a').forEach(link => {
        const href = link.getAttribute('href');
        if (href && (href.startsWith('http://') || href.startsWith('https://')) && !href.includes(window.location.hostname)) {
            link.setAttribute('target', '_blank');
            link.setAttribute('rel', 'noopener noreferrer');
        }
    });
});