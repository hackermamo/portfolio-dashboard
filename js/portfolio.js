// =====================================================
// PORTFOLIO MAIN JAVASCRIPT
// =====================================================

class Portfolio {
    constructor() {
        this.config = null;
        this.apiBase = '/api';
        this.init();
    }
    
    async init() {
        try {
            // Load configuration
            await this.loadConfig();
            
            // Populate content
            this.populateContent();
            
            // Initialize components
            this.initNavigation();
            this.initCursor();
            this.initTypewriter();
            this.initFilters();
            this.initScrollAnimations();
            this.initContactForm();
            this.initBackToTop();
            this.initMobileMenu();
            
            // Hide preloader
            this.hidePreloader();
            
        } catch (error) {
            console.error('Failed to initialize portfolio:', error);
            this.showToast('Failed to load portfolio data', 'error');
            this.hidePreloader();
        }
    }
    
    async loadConfig() {
        try {
            const response = await fetch(`${this.apiBase}/config`);
            if (!response.ok) throw new Error('Failed to fetch config');
            this.config = await response.json();
        } catch (error) {
            // Try loading from static file
            const response = await fetch('config/portfolio_config.json');
            if (!response.ok) throw new Error('Failed to load config');
            this.config = await response.json();
        }
    }
    
    populateContent() {
        const { personal_info, social_links, skills, projects, experience, education, certifications } = this.config;
        
        // Page title
        document.getElementById('page-title').textContent = `${personal_info.name} | Portfolio`;
        
        // Navigation
        document.getElementById('nav-name').textContent = personal_info.name.split(' ')[0];
        
        // Hero section
        document.getElementById('hero-name').textContent = personal_info.name;
        document.getElementById('hero-subtitle').textContent = personal_info.subtitle;
        
        // Resume buttons
        const resumeLinks = ['resume-nav-btn', 'resume-mobile-btn', 'about-resume-btn'];
        resumeLinks.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.href = personal_info.resume_link;
        });
        
        // Profile images
        if (personal_info.profile_image) {
            const profileImg = document.getElementById('hero-profile-img');
            if (profileImg) profileImg.src = personal_info.profile_image;
            
            const aboutImg = document.getElementById('about-image');
            if (aboutImg) aboutImg.src = personal_info.profile_image;
        }
        
        // About section
        document.getElementById('about-title').textContent = personal_info.title;
        document.getElementById('about-bio').textContent = personal_info.bio;
        document.getElementById('about-email').textContent = personal_info.email;
        document.getElementById('about-location').textContent = personal_info.location;
        document.getElementById('about-phone').textContent = personal_info.phone;
        
        // Years of experience
        if (this.config.stats) {
            document.getElementById('years-exp').textContent = `${this.config.stats.years_experience}+`;
        }
        
        // Social links
        this.populateSocialLinks('hero-social', social_links);
        this.populateSocialLinks('contact-social', social_links);
        
        // Skills
        this.populateSkills(skills);
        
        // Projects
        this.populateProjects(projects);
        
        // Experience
        this.populateExperience(experience);
        
        // Education
        this.populateEducation(education);
        
        // Certifications
        this.populateCertifications(certifications);
        
        // Contact section
        document.getElementById('contact-email').textContent = personal_info.email;
        document.getElementById('contact-phone').textContent = personal_info.phone;
        document.getElementById('contact-location').textContent = personal_info.location;
        
        // Footer
        document.getElementById('footer-year').textContent = new Date().getFullYear();
        document.getElementById('footer-name').textContent = personal_info.name;
        
        // Update skills 3D visualization
        if (window.skillsViz && skills) {
            window.skillsViz.createSkillBars(skills.slice(0, 8));
        }
    }
    
    populateSocialLinks(containerId, links) {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        const iconMap = {
            github: 'fab fa-github',
            linkedin: 'fab fa-linkedin-in',
            twitter: 'fab fa-twitter',
            instagram: 'fab fa-instagram',
            youtube: 'fab fa-youtube',
            dribbble: 'fab fa-dribbble',
            facebook: 'fab fa-facebook-f',
            codepen: 'fab fa-codepen'
        };
        
        let html = '';
        Object.entries(links).forEach(([platform, url]) => {
            if (url && iconMap[platform]) {
                html += `
                    <a href="${url}" target="_blank" rel="noopener" class="social-link" title="${platform}">
                        <i class="${iconMap[platform]}"></i>
                    </a>
                `;
            }
        });
        
        container.innerHTML = html;
    }
    
    populateSkills(skills) {
        const container = document.getElementById('skills-grid');
        if (!container) return;
        
        let html = '';
        skills.forEach((skill, index) => {
            html += `
                <div class="skill-card" data-category="${skill.category}" style="animation-delay: ${index * 0.1}s">
                    <div class="skill-card-content">
                        <div class="flex items-center gap-4 mb-4">
                            <div class="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center">
                                <i class="${skill.icon} text-primary text-xl"></i>
                            </div>
                            <div class="flex-1">
                                <h4 class="text-white font-semibold">${skill.name}</h4>
                                <span class="text-primary text-sm">${skill.level}%</span>
                            </div>
                        </div>
                        <div class="skill-progress">
                            <div class="skill-progress-bar" style="width: 0%" data-level="${skill.level}"></div>
                        </div>
                    </div>
                </div>
            `;
        });
        
        container.innerHTML = html;
        
        // Animate progress bars on scroll
        this.animateSkillBars();
    }
    
    populateProjects(projects) {
        const container = document.getElementById('projects-grid');
        if (!container) return;
        
        let html = '';
        projects.forEach((project, index) => {
            const techTags = project.technologies.map(tech => 
                `<span class="project-tech-tag">${tech}</span>`
            ).join('');
            
            html += `
                <div class="project-card" 
                     data-category="${project.category}" 
                     data-featured="${project.featured}"
                     style="animation-delay: ${index * 0.1}s">
                    <div class="project-image">
                        <img src="${project.image}" alt="${project.title}" 
                             onerror="this.src='https://via.placeholder.com/400x250?text=Project'">
                        <div class="project-overlay">
                            <div class="flex gap-3">
                                <a href="${project.github_link}" target="_blank" 
                                   class="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-white hover:bg-primary transition-colors">
                                    <i class="fab fa-github"></i>
                                </a>
                                <a href="${project.live_link}" target="_blank" 
                                   class="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-white hover:bg-primary transition-colors">
                                    <i class="fas fa-external-link-alt"></i>
                                </a>
                                <button onclick="portfolio.showProjectModal('${project.id}')" 
                                        class="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-white hover:bg-primary transition-colors">
                                    <i class="fas fa-expand"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                    <div class="project-content">
                        <div class="flex items-center gap-2 mb-2">
                            ${project.featured ? '<span class="px-2 py-0.5 bg-primary/20 text-primary text-xs rounded-full">Featured</span>' : ''}
                            <span class="text-gray-500 text-sm">${project.date}</span>
                        </div>
                        <h3 class="text-xl font-bold text-white mb-2">${project.title}</h3>
                        <p class="text-gray-400 text-sm mb-4 line-clamp-2">${project.description}</p>
                        <div class="flex flex-wrap gap-1">
                            ${techTags}
                        </div>
                    </div>
                </div>
            `;
        });
        
        container.innerHTML = html;
    }
    
    populateExperience(experience) {
        const container = document.getElementById('experience-timeline');
        if (!container) return;
        
        // Keep timeline line
        let html = '<div class="absolute left-0 md:left-1/2 transform md:-translate-x-1/2 w-1 h-full bg-gradient-to-b from-primary via-secondary to-accent rounded-full"></div>';
        
        experience.forEach((exp, index) => {
            const techTags = exp.technologies.map(tech => 
                `<span class="px-2 py-1 bg-primary/10 text-primary text-xs rounded-full">${tech}</span>`
            ).join('');
            
            const responsibilities = exp.responsibilities ? exp.responsibilities.map(r => 
                `<li class="text-gray-400 text-sm">${r}</li>`
            ).join('') : '';
            
            html += `
                <div class="timeline-item" style="animation-delay: ${index * 0.2}s">
                    <div class="timeline-dot"></div>
                    <div class="timeline-content">
                        <span class="text-primary text-sm font-medium">${exp.period}</span>
                        <h4 class="text-xl font-bold text-white mt-1">${exp.title}</h4>
                        <p class="text-secondary font-medium">${exp.company}</p>
                        <p class="text-gray-500 text-sm mb-3">${exp.location}</p>
                        <p class="text-gray-400 text-sm mb-3">${exp.description}</p>
                        ${responsibilities ? `<ul class="list-disc list-inside space-y-1 mb-3">${responsibilities}</ul>` : ''}
                        <div class="flex flex-wrap gap-2">${techTags}</div>
                    </div>
                </div>
            `;
        });
        
        container.innerHTML = html;
    }
    
    populateEducation(education) {
        const container = document.getElementById('education-list');
        if (!container) return;
        
        let html = '';
        education.forEach((edu, index) => {
            const achievements = edu.achievements ? edu.achievements.map(a => 
                `<li class="text-gray-400 text-sm flex items-center gap-2">
                    <i class="fas fa-check text-green-500 text-xs"></i>${a}
                </li>`
            ).join('') : '';
            
            html += `
                <div class="education-card" style="animation-delay: ${index * 0.1}s">
                    <div class="flex items-start gap-4">
                        <div class="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center flex-shrink-0">
                            <i class="fas fa-graduation-cap text-primary text-xl"></i>
                        </div>
                        <div class="flex-1">
                            <span class="text-primary text-sm font-medium">${edu.period}</span>
                            <h4 class="text-lg font-bold text-white mt-1">${edu.degree}</h4>
                            <p class="text-gray-300">${edu.institution}</p>
                            <p class="text-gray-500 text-sm">${edu.location}</p>
                            ${edu.gpa ? `<p class="text-secondary text-sm mt-1">GPA: ${edu.gpa}</p>` : ''}
                            ${edu.description ? `<p class="text-gray-400 text-sm mt-2">${edu.description}</p>` : ''}
                            ${achievements ? `<ul class="mt-3 space-y-1">${achievements}</ul>` : ''}
                        </div>
                    </div>
                </div>
            `;
        });
        
        container.innerHTML = html;
    }
    
    populateCertifications(certifications) {
        const container = document.getElementById('certifications-list');
        if (!container) return;
        
        let html = '';
        certifications.forEach((cert, index) => {
            html += `
                <a href="${cert.link}" target="_blank" class="certification-card block group" style="animation-delay: ${index * 0.1}s">
                    <div class="flex items-center gap-4">
                        <div class="w-16 h-16 bg-secondary/20 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-secondary/30 transition-colors">
                            <i class="fas fa-award text-secondary text-2xl"></i>
                        </div>
                        <div class="flex-1">
                            <h4 class="text-white font-semibold group-hover:text-secondary transition-colors">${cert.name}</h4>
                            <p class="text-gray-400 text-sm">${cert.issuer}</p>
                            <p class="text-gray-500 text-sm">${cert.date}</p>
                        </div>
                        <i class="fas fa-external-link-alt text-gray-500 group-hover:text-secondary transition-colors"></i>
                    </div>
                </a>
            `;
        });
        
        container.innerHTML = html;
    }
    
    // Navigation
    initNavigation() {
        const navbar = document.getElementById('navbar');
        const navLinks = document.querySelectorAll('.nav-link');
        const sections = document.querySelectorAll('section[id]');
        
        // Scroll effect
        window.addEventListener('scroll', () => {
            if (window.scrollY > 100) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }
            
            // Active section highlighting
            let current = '';
            sections.forEach(section => {
                const sectionTop = section.offsetTop - 200;
                if (window.scrollY >= sectionTop) {
                    current = section.getAttribute('id');
                }
            });
            
            navLinks.forEach(link => {
                link.classList.remove('active');
                if (link.getAttribute('href') === `#${current}`) {
                    link.classList.add('active');
                }
            });
        });
        
        // Smooth scroll
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', (e) => {
                e.preventDefault();
                const target = document.querySelector(anchor.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    
                    // Close mobile menu if open
                    document.getElementById('mobile-menu').classList.remove('open');
                    document.body.classList.remove('menu-open');
                }
            });
        });
    }
    
    // Custom cursor
    initCursor() {
        const cursor = document.getElementById('cursor');
        const follower = document.getElementById('cursor-follower');
        
        if (window.innerWidth < 1024) return;
        
        let mouseX = 0, mouseY = 0;
        let cursorX = 0, cursorY = 0;
        let followerX = 0, followerY = 0;
        
        document.addEventListener('mousemove', (e) => {
            mouseX = e.clientX;
            mouseY = e.clientY;
        });
        
        const animateCursor = () => {
            cursorX += (mouseX - cursorX) * 0.2;
            cursorY += (mouseY - cursorY) * 0.2;
            followerX += (mouseX - followerX) * 0.1;
            followerY += (mouseY - followerY) * 0.1;
            
            cursor.style.left = `${cursorX}px`;
            cursor.style.top = `${cursorY}px`;
            cursor.style.transform = 'translate(-50%, -50%)';
            
            follower.style.left = `${followerX}px`;
            follower.style.top = `${followerY}px`;
            follower.style.transform = 'translate(-50%, -50%)';
            
            requestAnimationFrame(animateCursor);
        };
        
        animateCursor();
        
        // Hover effects
        const interactiveElements = document.querySelectorAll('a, button, .hover-effect');
        interactiveElements.forEach(el => {
            el.addEventListener('mouseenter', () => {
                cursor.style.transform = 'translate(-50%, -50%) scale(1.5)';
                follower.style.transform = 'translate(-50%, -50%) scale(1.5)';
                follower.style.borderColor = 'var(--primary)';
            });
            el.addEventListener('mouseleave', () => {
                cursor.style.transform = 'translate(-50%, -50%) scale(1)';
                follower.style.transform = 'translate(-50%, -50%) scale(1)';
                follower.style.borderColor = 'rgba(99, 102, 241, 0.5)';
            });
        });
    }
    
    // Typewriter effect
    initTypewriter() {
        const element = document.getElementById('typewriter');
        if (!element) return;
        
        const words = [
            this.config.personal_info.title,
            'Web Developer',
            '3D Enthusiast',
            'Problem Solver',
            'Creative Thinker'
        ];
        
        let wordIndex = 0;
        let charIndex = 0;
        let isDeleting = false;
        
        const type = () => {
            const currentWord = words[wordIndex];
            
            if (isDeleting) {
                element.textContent = currentWord.substring(0, charIndex - 1);
                charIndex--;
            } else {
                element.textContent = currentWord.substring(0, charIndex + 1);
                charIndex++;
            }
            
            let typeSpeed = isDeleting ? 50 : 100;
            
            if (!isDeleting && charIndex === currentWord.length) {
                typeSpeed = 2000;
                isDeleting = true;
            } else if (isDeleting && charIndex === 0) {
                isDeleting = false;
                wordIndex = (wordIndex + 1) % words.length;
                typeSpeed = 500;
            }
            
            setTimeout(type, typeSpeed);
        };
        
        type();
    }
    
    // Filters
    initFilters() {
        // Skill filters
        const skillFilters = document.querySelectorAll('.skill-filter');
        const skillCards = document.querySelectorAll('.skill-card');
        
        skillFilters.forEach(filter => {
            filter.addEventListener('click', () => {
                const category = filter.dataset.category;
                
                skillFilters.forEach(f => f.classList.remove('active'));
                filter.classList.add('active');
                
                skillCards.forEach(card => {
                    if (category === 'all' || card.dataset.category === category) {
                        card.style.display = 'block';
                        gsap.fromTo(card, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.4 });
                    } else {
                        card.style.display = 'none';
                    }
                });
                
                // Re-animate skill bars
                this.animateSkillBars();
            });
        });
        
        // Project filters
        const projectFilters = document.querySelectorAll('.project-filter');
        const projectCards = document.querySelectorAll('.project-card');
        
        projectFilters.forEach(filter => {
            filter.addEventListener('click', () => {
                const category = filter.dataset.category;
                
                projectFilters.forEach(f => f.classList.remove('active'));
                filter.classList.add('active');
                
                projectCards.forEach(card => {
                    const cardCategory = card.dataset.category;
                    const isFeatured = card.dataset.featured === 'true';
                    
                    let show = false;
                    if (category === 'all') show = true;
                    else if (category === 'featured' && isFeatured) show = true;
                    else if (cardCategory === category) show = true;
                    
                    if (show) {
                        card.style.display = 'block';
                        gsap.fromTo(card, { opacity: 0, scale: 0.9 }, { opacity: 1, scale: 1, duration: 0.4 });
                    } else {
                        card.style.display = 'none';
                    }
                });
            });
        });
    }
    
    // Animate skill bars
    animateSkillBars() {
        const progressBars = document.querySelectorAll('.skill-progress-bar');
        
        progressBars.forEach(bar => {
            const level = bar.dataset.level;
            bar.style.width = '0%';
            
            setTimeout(() => {
                bar.style.width = `${level}%`;
            }, 200);
        });
    }
    
    // Scroll animations
    initScrollAnimations() {
        gsap.registerPlugin(ScrollTrigger);
        
        // Animate sections on scroll
        const sections = document.querySelectorAll('section');
        sections.forEach(section => {
            gsap.fromTo(section,
                { opacity: 0, y: 50 },
                {
                    opacity: 1,
                    y: 0,
                    duration: 0.8,
                    scrollTrigger: {
                        trigger: section,
                        start: 'top 80%',
                        toggleActions: 'play none none reverse'
                    }
                }
            );
        });
        
        // Animate skill bars on scroll
        ScrollTrigger.create({
            trigger: '#skills',
            start: 'top 70%',
            onEnter: () => this.animateSkillBars()
        });
    }
    
    // Contact form
    initContactForm() {
        const form = document.getElementById('contact-form');
        const successMessage = document.getElementById('form-success');
        
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const formData = new FormData(form);
            const data = Object.fromEntries(formData.entries());
            
            const submitBtn = form.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Sending...';
            submitBtn.disabled = true;
            
            try {
                const response = await fetch(`${this.apiBase}/messages`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });
                
                if (response.ok) {
                    successMessage.classList.remove('hidden');
                    form.reset();
                    this.showToast('Message sent successfully!', 'success');
                    
                    setTimeout(() => {
                        successMessage.classList.add('hidden');
                    }, 5000);
                } else {
                    throw new Error('Failed to send message');
                }
            } catch (error) {
                this.showToast('Failed to send message. Please try again.', 'error');
            } finally {
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
            }
        });
    }
    
    // Back to top
    initBackToTop() {
        const button = document.getElementById('back-to-top');
        
        window.addEventListener('scroll', () => {
            if (window.scrollY > 500) {
                button.classList.add('visible');
            } else {
                button.classList.remove('visible');
            }
        });
        
        button.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }
    
    // Mobile menu
    initMobileMenu() {
        const menuBtn = document.getElementById('mobile-menu-btn');
        const closeBtn = document.getElementById('close-menu-btn');
        const mobileMenu = document.getElementById('mobile-menu');
        
        menuBtn.addEventListener('click', () => {
            mobileMenu.classList.add('open');
            document.body.classList.add('menu-open');
        });
        
        closeBtn.addEventListener('click', () => {
            mobileMenu.classList.remove('open');
            document.body.classList.remove('menu-open');
        });
    }
    
    // Project modal
    showProjectModal(projectId) {
        const project = this.config.projects.find(p => p.id === projectId);
        if (!project) return;
        
        const modal = document.getElementById('project-modal');
        const content = document.getElementById('modal-content');
        
        const techTags = project.technologies.map(tech => 
            `<span class="project-tech-tag">${tech}</span>`
        ).join('');
        
        content.innerHTML = `
            <div class="relative">
                <img src="${project.image}" alt="${project.title}" class="w-full h-64 object-cover">
                <div class="absolute inset-0 bg-gradient-to-t from-dark-100 to-transparent"></div>
            </div>
            <div class="p-8">
                <div class="flex items-center gap-2 mb-4">
                    ${project.featured ? '<span class="px-3 py-1 bg-primary/20 text-primary text-sm rounded-full">Featured</span>' : ''}
                    <span class="text-gray-500">${project.date}</span>
                </div>
                <h2 class="text-3xl font-bold text-white mb-4">${project.title}</h2>
                <p class="text-gray-300 mb-6 leading-relaxed">${project.long_description || project.description}</p>
                <div class="flex flex-wrap gap-2 mb-8">
                    ${techTags}
                </div>
                <div class="flex gap-4">
                    <a href="${project.github_link}" target="_blank" 
                       class="flex-1 py-3 bg-dark-200 rounded-xl font-medium text-center hover:bg-dark-300 transition-colors flex items-center justify-center gap-2">
                        <i class="fab fa-github"></i>View Code
                    </a>
                    <a href="${project.live_link}" target="_blank" 
                       class="flex-1 py-3 bg-gradient-to-r from-primary to-secondary rounded-xl font-medium text-center hover:opacity-90 transition-opacity flex items-center justify-center gap-2">
                        <i class="fas fa-external-link-alt"></i>Live Demo
                    </a>
                </div>
            </div>
        `;
        
        modal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
        
        // Close handlers
        const closeModal = () => {
            modal.classList.add('hidden');
            document.body.style.overflow = '';
        };
        
        document.getElementById('close-modal').onclick = closeModal;
        document.getElementById('modal-backdrop').onclick = closeModal;
        
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') closeModal();
        }, { once: true });
    }
    
    // Toast notification
    showToast(message, type = 'info') {
        const container = document.getElementById('toast-container');
        
        const icons = {
            success: 'fas fa-check-circle',
            error: 'fas fa-times-circle',
            warning: 'fas fa-exclamation-circle',
            info: 'fas fa-info-circle'
        };
        
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <i class="${icons[type]} toast-icon text-xl"></i>
            <span class="flex-1 text-white">${message}</span>
            <button class="text-gray-400 hover:text-white" onclick="this.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        container.appendChild(toast);
        
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(100%)';
            setTimeout(() => toast.remove(), 300);
        }, 5000);
    }
    
    // Hide preloader
    hidePreloader() {
        const preloader = document.getElementById('preloader');
        setTimeout(() => {
            preloader.style.opacity = '0';
            setTimeout(() => {
                preloader.style.display = 'none';
            }, 500);
        }, 1000);
    }
}

// Initialize portfolio
const portfolio = new Portfolio();