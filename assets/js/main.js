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
// 1.5. CARROSSÉIS DE PRODUTOS NA HOME (COMPLETO)
// ===================================
document.querySelectorAll('.produtos-carousel-container').forEach(container => {
    const carousel = container.querySelector('.produtos-carousel');
    const prevBtn = container.querySelector('.carousel-nav-prev');
    const nextBtn = container.querySelector('.carousel-nav-next');
    const playPauseBtn = container.querySelector('.carousel-play-pause');
    const indicators = container.querySelectorAll('.carousel-indicator');
    const progressBar = container.querySelector('.carousel-progress-bar');
    const collapseHeader = container.closest('.subcategoria-section')?.querySelector('.collapse-header');
    
    if (!carousel) return;
    
    const cards = carousel.querySelectorAll('.produto-carousel-card');
    const cardWidth = 280 + 16; // largura do card + gap
    const autoplayEnabled = container.dataset.autoplay === 'true';
    
    let autoplayInterval = null;
    let autoplayProgress = 0;
    let isPlaying = autoplayEnabled;
    let currentIndex = 0;
    
    // ===== LAZY LOADING INTELIGENTE =====
    function lazyLoadNearby(index) {
        const toLoad = [
            Math.max(0, index - 1),
            index,
            Math.min(cards.length - 1, index + 1),
            Math.min(cards.length - 1, index + 2)
        ];
        
        toLoad.forEach(i => {
            const img = cards[i]?.querySelector('img[loading="lazy"]');
            if (img && img.dataset.src && !img.src) {
                img.src = img.dataset.src;
            }
        });
    }
    
    // ===== ATUALIZAR INDICADORES =====
    function updateIndicators() {
        const scrollLeft = carousel.scrollLeft;
        const newIndex = Math.round(scrollLeft / cardWidth);
        
        if (newIndex !== currentIndex) {
            currentIndex = newIndex;
            lazyLoadNearby(currentIndex);
        }
        
        indicators.forEach((indicator, i) => {
            if (i === currentIndex) {
                indicator.classList.add('active');
            } else {
                indicator.classList.remove('active');
            }
        });
    }
    
    // ===== NAVEGAÇÃO =====
    function scrollToIndex(index) {
        const targetScroll = index * cardWidth;
        carousel.scrollTo({
            left: targetScroll,
            behavior: 'smooth'
        });
    }
    
    function scrollCarousel(direction) {
        const currentScroll = carousel.scrollLeft;
        const maxScroll = carousel.scrollWidth - carousel.clientWidth;
        
        let targetIndex;
        if (direction === 'next') {
            targetIndex = Math.min(currentIndex + 1, cards.length - 1);
            if (currentScroll >= maxScroll - 10) {
                targetIndex = 0; // Volta pro início
            }
        } else {
            targetIndex = Math.max(currentIndex - 1, 0);
        }
        
        scrollToIndex(targetIndex);
        stopAutoplay();
    }
    
    // ===== AUTOPLAY =====
    function startAutoplay() {
        if (!autoplayEnabled || autoplayInterval) return;
        
        isPlaying = true;
        updatePlayPauseButton();
        
        autoplayInterval = setInterval(() => {
            autoplayProgress += 1;
            
            if (progressBar) {
                const progress = (autoplayProgress / 50) * 100; // 5 segundos = 50 * 100ms
                progressBar.style.width = `${progress}%`;
            }
            
            if (autoplayProgress >= 50) {
                autoplayProgress = 0;
                const maxScroll = carousel.scrollWidth - carousel.clientWidth;
                
                if (carousel.scrollLeft >= maxScroll - 10) {
                    scrollToIndex(0); // Volta pro início
                } else {
                    scrollCarousel('next');
                }
            }
        }, 100);
    }
    
    function stopAutoplay() {
        if (autoplayInterval) {
            clearInterval(autoplayInterval);
            autoplayInterval = null;
        }
        isPlaying = false;
        autoplayProgress = 0;
        if (progressBar) progressBar.style.width = '0%';
        updatePlayPauseButton();
    }
    
    function toggleAutoplay() {
        if (isPlaying) {
            stopAutoplay();
        } else {
            startAutoplay();
        }
    }
    
    function updatePlayPauseButton() {
        if (!playPauseBtn) return;
        const playIcon = playPauseBtn.querySelector('.play-icon');
        const pauseIcon = playPauseBtn.querySelector('.pause-icon');
        
        if (isPlaying) {
            playIcon.classList.add('hidden');
            pauseIcon.classList.remove('hidden');
        } else {
            playIcon.classList.remove('hidden');
            pauseIcon.classList.add('hidden');
        }
    }
    
    // ===== EVENT LISTENERS =====
    
    // Botões de navegação
    if (prevBtn) prevBtn.addEventListener('click', () => scrollCarousel('prev'));
    if (nextBtn) nextBtn.addEventListener('click', () => scrollCarousel('next'));
    if (playPauseBtn) playPauseBtn.addEventListener('click', toggleAutoplay);
    
    // Indicadores
    indicators.forEach((indicator, i) => {
        indicator.addEventListener('click', () => {
            scrollToIndex(i);
            stopAutoplay();
        });
    });
    
    // Scroll listener
    carousel.addEventListener('scroll', updateIndicators);
    
    // Pause on hover/focus
    carousel.addEventListener('mouseenter', stopAutoplay);
    carousel.addEventListener('mouseleave', () => {
        if (autoplayEnabled) setTimeout(startAutoplay, 1000);
    });
    
    // ===== KEYBOARD NAVIGATION =====
    carousel.addEventListener('keydown', (e) => {
        switch(e.key) {
            case 'ArrowLeft':
                e.preventDefault();
                scrollCarousel('prev');
                break;
            case 'ArrowRight':
                e.preventDefault();
                scrollCarousel('next');
                break;
            case ' ':
                e.preventDefault();
                toggleAutoplay();
                break;
            case 'Home':
                e.preventDefault();
                scrollToIndex(0);
                stopAutoplay();
                break;
            case 'End':
                e.preventDefault();
                scrollToIndex(cards.length - 1);
                stopAutoplay();
                break;
        }
    });
    
    // ===== DRAG & DROP =====
    let isDown = false;
    let startX;
    let scrollLeft;
    
    carousel.addEventListener('mousedown', (e) => {
        isDown = true;
        carousel.style.cursor = 'grabbing';
        startX = e.pageX - carousel.offsetLeft;
        scrollLeft = carousel.scrollLeft;
        stopAutoplay();
    });
    
    carousel.addEventListener('mouseleave', () => {
        isDown = false;
        carousel.style.cursor = 'grab';
    });
    
    carousel.addEventListener('mouseup', () => {
        isDown = false;
        carousel.style.cursor = 'grab';
    });
    
    carousel.addEventListener('mousemove', (e) => {
        if (!isDown) return;
        e.preventDefault();
        const x = e.pageX - carousel.offsetLeft;
        const walk = (x - startX) * 2;
        carousel.scrollLeft = scrollLeft - walk;
    });
    
    // ===== SEÇÕES COLAPSÁVEIS =====
    if (collapseHeader) {
        const collapseContent = container.closest('.subcategoria-section')?.querySelector('.collapse-content');
        
        collapseHeader.addEventListener('click', (e) => {
            // Não colapsa se clicar no link "Ver Todos"
            if (e.target.closest('a')) return;
            
            collapseHeader.classList.toggle('collapsed');
            collapseContent?.classList.toggle('collapsed');
            
            if (collapseContent?.classList.contains('collapsed')) {
                stopAutoplay();
            }
        });
    }
    
    // Inicialização
    carousel.style.cursor = 'grab';
    lazyLoadNearby(0);
    updateIndicators();
    if (autoplayEnabled) startAutoplay();
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