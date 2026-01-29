// =====================================================
// ADMIN PANEL JAVASCRIPT
// =====================================================

class AdminPanel {
    constructor() {
        this.apiBase = '/api';
        this.config = null;
        this.currentSection = 'dashboard';
        this.deleteCallback = null;
        this.editingItem = null;
        
        this.init();
    }
    
    async init() {
        // Check authentication
        if (!this.checkAuth()) {
            window.location.href = 'index.html';
            return;
        }
        
        try {
            // Load configuration
            await this.loadConfig();
            
            // Initialize UI
            this.initSidebar();
            this.initMobileMenu();
            this.initEventListeners();
            
            // Populate data
            this.updateStats();
            this.populatePersonalInfo();
            this.populateProjects();
            this.populateSkills();
            this.populateExperience();
            this.populateEducation();
            this.populateMessages();
            
        } catch (error) {
            console.error('Failed to initialize admin panel:', error);
            this.showToast('Failed to load data', 'error');
        }
    }
    
    checkAuth() {
        const token = localStorage.getItem('admin_token');
        if (!token) {
            window.location.href = '/admin/index.html';
            return false;
        }
        return true;
    }
    
    async loadConfig() {
        try {
            const response = await fetch(`${this.apiBase}/config`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
                }
            });
            
            if (!response.ok) throw new Error('Failed to load config');
            this.config = await response.json();
        } catch (error) {
            // Fallback to static file
            const response = await fetch('/config/portfolio_config.json');
            this.config = await response.json();
        }
    }
    
    async saveConfig() {
        try {
            const token = localStorage.getItem('admin_token');
            if (!token) {
                console.error('No token found');
                this.showToast('Authentication failed. Please login again.', 'error');
                window.location.href = '/admin/index.html';
                return false;
            }
            
            const response = await fetch(`${this.apiBase}/config`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(this.config)
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                console.error('Save error:', response.status, errorData);
                throw new Error(errorData.detail || 'Failed to save');
            }
            
            this.showToast('Changes saved successfully!', 'success');
            return true;
        } catch (error) {
            console.error('Save config error:', error);
            this.showToast('Failed to save changes: ' + error.message, 'error');
            return false;
        }
    }
    
    // Sidebar Navigation
    initSidebar() {
        const sidebarLinks = document.querySelectorAll('.sidebar-link');
        
        sidebarLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const section = link.dataset.section;
                this.showSection(section);
                
                // Update active state
                sidebarLinks.forEach(l => l.classList.remove('active'));
                link.classList.add('active');
                
                // Close mobile sidebar
                this.closeMobileSidebar();
            });
        });
    }
    
    showSection(section) {
        this.currentSection = section;
        
        // Hide all sections
        document.querySelectorAll('.content-section').forEach(s => {
            s.classList.add('hidden');
        });
        
        // Show target section
        const targetSection = document.getElementById(`section-${section}`);
        if (targetSection) {
            targetSection.classList.remove('hidden');
        }
        
        // Update page title
        const titles = {
            dashboard: 'Dashboard',
            personal: 'Personal Information',
            projects: 'Projects',
            skills: 'Skills',
            experience: 'Experience',
            education: 'Education',
            messages: 'Messages',
            settings: 'Settings'
        };
        
        document.getElementById('page-title').textContent = titles[section] || 'Dashboard';
        
        // Update sidebar active state
        document.querySelectorAll('.sidebar-link').forEach(link => {
            link.classList.remove('active');
            if (link.dataset.section === section) {
                link.classList.add('active');
            }
        });
    }
    
    // Mobile Menu
    initMobileMenu() {
        const toggleBtn = document.getElementById('mobile-menu-toggle');
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('sidebar-overlay');
        
        toggleBtn.addEventListener('click', () => {
            sidebar.classList.remove('-translate-x-full');
            overlay.classList.remove('hidden');
        });
        
        overlay.addEventListener('click', () => {
            this.closeMobileSidebar();
        });
    }
    
    closeMobileSidebar() {
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('sidebar-overlay');
        
        sidebar.classList.add('-translate-x-full');
        overlay.classList.add('hidden');
    }
    
    // Event Listeners
    initEventListeners() {
        // Logout
        document.getElementById('logout-btn').addEventListener('click', () => {
            localStorage.removeItem('admin_token');
            window.location.href = 'index.html';
        });
        
        // Save personal info
        document.getElementById('save-personal-btn').addEventListener('click', () => {
            this.savePersonalInfo();
        });
        
        // Profile image upload
        document.getElementById('profile-image-input').addEventListener('change', (e) => {
            this.handleImageUpload(e, 'profile');
        });
        
        // Modal backdrop click
        document.getElementById('modal-backdrop')?.addEventListener('click', () => {
            this.closeModal();
        });
        
        // Theme color sync
        document.getElementById('theme-primary')?.addEventListener('change', (e) => {
            document.getElementById('theme-primary-hex').value = e.target.value;
        });
        
        document.getElementById('theme-secondary')?.addEventListener('change', (e) => {
            document.getElementById('theme-secondary-hex').value = e.target.value;
        });
    }
    
    // Update Stats
    updateStats() {
        document.getElementById('stat-projects').textContent = this.config.projects?.length || 0;
        document.getElementById('stat-skills').textContent = this.config.skills?.length || 0;
        document.getElementById('stat-messages').textContent = this.config.messages?.length || 0;
        document.getElementById('stat-visitors').textContent = this.config.stats?.total_visitors || 0;
        
        // Update message badge
        const unreadCount = this.config.messages?.filter(m => !m.read).length || 0;
        const badge = document.getElementById('message-badge');
        if (unreadCount > 0) {
            badge.textContent = unreadCount;
            badge.classList.remove('hidden');
        } else {
            badge.classList.add('hidden');
        }
        
        // Recent messages
        this.updateRecentMessages();
    }
    
    updateRecentMessages() {
        const container = document.getElementById('recent-messages');
        const messages = (this.config.messages || []).slice(0, 3);
        
        if (messages.length === 0) {
            container.innerHTML = '<p class="text-gray-500 text-center py-4">No messages yet</p>';
            return;
        }
        
        container.innerHTML = messages.map(msg => `
            <div class="p-3 bg-dark-100 rounded-xl ${!msg.read ? 'border-l-4 border-primary' : ''}">
                <div class="flex items-center justify-between mb-1">
                    <p class="font-medium text-sm">${msg.firstName} ${msg.lastName}</p>
                    <span class="text-gray-500 text-xs">${this.formatDate(msg.timestamp)}</span>
                </div>
                <p class="text-gray-400 text-sm truncate">${msg.subject}</p>
            </div>
        `).join('');
    }
    
    // Populate Personal Info
    populatePersonalInfo() {
        const { personal_info, social_links } = this.config;
        
        document.getElementById('personal-name').value = personal_info?.name || '';
        document.getElementById('personal-title').value = personal_info?.title || '';
        document.getElementById('personal-subtitle').value = personal_info?.subtitle || '';
        document.getElementById('personal-bio').value = personal_info?.bio || '';
        document.getElementById('personal-email').value = personal_info?.email || '';
        document.getElementById('personal-phone').value = personal_info?.phone || '';
        document.getElementById('personal-location').value = personal_info?.location || '';
        document.getElementById('personal-resume').value = personal_info?.resume_link || '';
        
        if (personal_info?.profile_image) {
            document.getElementById('profile-preview').src = personal_info.profile_image;
        }
        
        // Social links
        document.getElementById('social-github').value = social_links?.github || '';
        document.getElementById('social-linkedin').value = social_links?.linkedin || '';
        document.getElementById('social-twitter').value = social_links?.twitter || '';
        document.getElementById('social-instagram').value = social_links?.instagram || '';
        document.getElementById('social-youtube').value = social_links?.youtube || '';
        document.getElementById('social-dribbble').value = social_links?.dribbble || '';
    }
    
    async savePersonalInfo() {
        this.config.personal_info = {
            ...this.config.personal_info,
            name: document.getElementById('personal-name').value,
            title: document.getElementById('personal-title').value,
            subtitle: document.getElementById('personal-subtitle').value,
            bio: document.getElementById('personal-bio').value,
            email: document.getElementById('personal-email').value,
            phone: document.getElementById('personal-phone').value,
            location: document.getElementById('personal-location').value,
            resume_link: document.getElementById('personal-resume').value
        };
        
        this.config.social_links = {
            github: document.getElementById('social-github').value,
            linkedin: document.getElementById('social-linkedin').value,
            twitter: document.getElementById('social-twitter').value,
            instagram: document.getElementById('social-instagram').value,
            youtube: document.getElementById('social-youtube').value,
            dribbble: document.getElementById('social-dribbble').value
        };
        
        await this.saveConfig();
    }
    
    // Populate Projects
    populateProjects() {
        const container = document.getElementById('projects-list');
        const projects = this.config.projects || [];
        
        if (projects.length === 0) {
            container.innerHTML = `
                <div class="col-span-full text-center py-12">
                    <i class="fas fa-folder-open text-gray-600 text-5xl mb-4"></i>
                    <p class="text-gray-500">No projects yet. Add your first project!</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = projects.map(project => `
            <div class="glass rounded-2xl overflow-hidden group">
                <div class="relative h-48">
                    <img src="${project.image || 'https://via.placeholder.com/400x200'}" 
                         alt="${project.title}" 
                         class="w-full h-full object-cover">
                    <div class="absolute inset-0 bg-gradient-to-t from-dark-400 to-transparent"></div>
                    ${project.featured ? '<span class="absolute top-3 left-3 px-2 py-1 bg-primary text-white text-xs rounded-full">Featured</span>' : ''}
                    <div class="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onclick="admin.editProject('${project.id}')" class="w-8 h-8 bg-dark-100/80 rounded-lg flex items-center justify-center hover:bg-primary transition-colors">
                            <i class="fas fa-edit text-sm"></i>
                        </button>
                        <button onclick="admin.confirmDelete('project', '${project.id}')" class="w-8 h-8 bg-dark-100/80 rounded-lg flex items-center justify-center hover:bg-red-500 transition-colors">
                            <i class="fas fa-trash text-sm"></i>
                        </button>
                    </div>
                </div>
                <div class="p-4">
                    <h4 class="font-semibold text-lg mb-1">${project.title}</h4>
                    <p class="text-gray-400 text-sm mb-3 line-clamp-2">${project.description}</p>
                    <div class="flex flex-wrap gap-1">
                        ${project.technologies.slice(0, 3).map(tech => 
                            `<span class="px-2 py-0.5 bg-primary/20 text-primary text-xs rounded-full">${tech}</span>`
                        ).join('')}
                        ${project.technologies.length > 3 ? `<span class="px-2 py-0.5 bg-gray-700 text-gray-400 text-xs rounded-full">+${project.technologies.length - 3}</span>` : ''}
                    </div>
                </div>
            </div>
        `).join('');
    }
    
    // Populate Skills
    populateSkills() {
        const container = document.getElementById('skills-list');
        const skills = this.config.skills || [];
        
        if (skills.length === 0) {
            container.innerHTML = `
                <div class="col-span-full text-center py-12">
                    <i class="fas fa-code text-gray-600 text-5xl mb-4"></i>
                    <p class="text-gray-500">No skills yet. Add your first skill!</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = skills.map(skill => `
            <div class="glass rounded-xl p-4 group">
                <div class="flex items-center justify-between mb-3">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
                            <i class="${skill.icon || 'fas fa-code'} text-primary"></i>
                        </div>
                        <div>
                            <h4 class="font-medium">${skill.name}</h4>
                            <span class="text-gray-500 text-sm capitalize">${skill.category}</span>
                        </div>
                    </div>
                    <div class="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onclick="admin.editSkill('${skill.id}')" class="w-8 h-8 bg-dark-100 rounded-lg flex items-center justify-center hover:bg-primary transition-colors">
                            <i class="fas fa-edit text-xs"></i>
                        </button>
                        <button onclick="admin.confirmDelete('skill', '${skill.id}')" class="w-8 h-8 bg-dark-100 rounded-lg flex items-center justify-center hover:bg-red-500 transition-colors">
                            <i class="fas fa-trash text-xs"></i>
                        </button>
                    </div>
                </div>
                <div class="flex items-center gap-3">
                    <div class="flex-1 h-2 bg-dark-100 rounded-full overflow-hidden">
                        <div class="h-full bg-gradient-to-r from-primary to-secondary rounded-full" style="width: ${skill.level}%"></div>
                    </div>
                    <span class="text-primary text-sm font-medium">${skill.level}%</span>
                </div>
            </div>
        `).join('');
    }
    
    // Populate Experience
    populateExperience() {
        const container = document.getElementById('experience-list');
        const experience = this.config.experience || [];
        
        if (experience.length === 0) {
            container.innerHTML = `
                <div class="text-center py-12">
                    <i class="fas fa-briefcase text-gray-600 text-5xl mb-4"></i>
                    <p class="text-gray-500">No experience yet. Add your first experience!</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = experience.map(exp => `
            <div class="glass rounded-xl p-6 group">
                <div class="flex items-start justify-between">
                    <div class="flex items-start gap-4">
                        <div class="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center flex-shrink-0">
                            <i class="fas fa-briefcase text-primary"></i>
                        </div>
                        <div>
                            <span class="text-primary text-sm">${exp.period}</span>
                            <h4 class="font-semibold text-lg">${exp.title}</h4>
                            <p class="text-gray-400">${exp.company} • ${exp.location}</p>
                            <p class="text-gray-500 text-sm mt-2">${exp.description}</p>
                            <div class="flex flex-wrap gap-2 mt-3">
                                ${exp.technologies.map(tech => 
                                    `<span class="px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-full">${tech}</span>`
                                ).join('')}
                            </div>
                        </div>
                    </div>
                    <div class="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onclick="admin.editExperience('${exp.id}')" class="w-8 h-8 bg-dark-100 rounded-lg flex items-center justify-center hover:bg-primary transition-colors">
                            <i class="fas fa-edit text-sm"></i>
                        </button>
                        <button onclick="admin.confirmDelete('experience', '${exp.id}')" class="w-8 h-8 bg-dark-100 rounded-lg flex items-center justify-center hover:bg-red-500 transition-colors">
                            <i class="fas fa-trash text-sm"></i>
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    }
    
    // Populate Education
    populateEducation() {
        const container = document.getElementById('education-list');
        const education = this.config.education || [];
        
        if (education.length === 0) {
            container.innerHTML = `
                <div class="text-center py-12">
                    <i class="fas fa-graduation-cap text-gray-600 text-5xl mb-4"></i>
                    <p class="text-gray-500">No education yet. Add your first education!</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = education.map(edu => `
            <div class="glass rounded-xl p-6 group">
                <div class="flex items-start justify-between">
                    <div class="flex items-start gap-4">
                        <div class="w-12 h-12 bg-secondary/20 rounded-xl flex items-center justify-center flex-shrink-0">
                            <i class="fas fa-graduation-cap text-secondary"></i>
                        </div>
                        <div>
                            <span class="text-secondary text-sm">${edu.period}</span>
                            <h4 class="font-semibold text-lg">${edu.degree}</h4>
                            <p class="text-gray-400">${edu.institution}</p>
                            <p class="text-gray-500 text-sm">${edu.location}</p>
                            ${edu.gpa ? `<p class="text-primary text-sm mt-1">GPA: ${edu.gpa}</p>` : ''}
                        </div>
                    </div>
                    <div class="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onclick="admin.editEducation('${edu.id}')" class="w-8 h-8 bg-dark-100 rounded-lg flex items-center justify-center hover:bg-primary transition-colors">
                            <i class="fas fa-edit text-sm"></i>
                        </button>
                        <button onclick="admin.confirmDelete('education', '${edu.id}')" class="w-8 h-8 bg-dark-100 rounded-lg flex items-center justify-center hover:bg-red-500 transition-colors">
                            <i class="fas fa-trash text-sm"></i>
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    }
    
    // Populate Messages
    populateMessages() {
        const container = document.getElementById('messages-list');
        const messages = this.config.messages || [];
        
        if (messages.length === 0) {
            container.innerHTML = `
                <div class="text-center py-12">
                    <i class="fas fa-inbox text-gray-600 text-5xl mb-4"></i>
                    <p class="text-gray-500">No messages yet.</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = messages.map(msg => `
            <div class="glass rounded-xl p-6 ${!msg.read ? 'border-l-4 border-primary' : ''}">
                <div class="flex items-start justify-between mb-4">
                    <div>
                        <h4 class="font-semibold">${msg.firstName} ${msg.lastName}</h4>
                        <p class="text-gray-400 text-sm">${msg.email}</p>
                    </div>
                    <div class="flex items-center gap-3">
                        <span class="text-gray-500 text-sm">${this.formatDate(msg.timestamp)}</span>
                        ${!msg.read ? '<span class="px-2 py-0.5 bg-primary text-white text-xs rounded-full">New</span>' : ''}
                    </div>
                </div>
                <p class="text-primary font-medium mb-2">${msg.subject}</p>
                <p class="text-gray-300">${msg.message}</p>
                <div class="flex gap-2 mt-4">
                    ${!msg.read ? `
                        <button onclick="admin.markAsRead('${msg.id}')" class="px-4 py-2 bg-dark-100 rounded-lg text-sm hover:bg-dark-200 transition-colors">
                            <i class="fas fa-check mr-1"></i>Mark as Read
                        </button>
                    ` : ''}
                    <a href="mailto:${msg.email}?subject=Re: ${msg.subject}" class="px-4 py-2 bg-primary/20 text-primary rounded-lg text-sm hover:bg-primary/30 transition-colors">
                        <i class="fas fa-reply mr-1"></i>Reply
                    </a>
                    <button onclick="admin.confirmDelete('message', '${msg.id}')" class="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg text-sm hover:bg-red-500/30 transition-colors">
                        <i class="fas fa-trash mr-1"></i>Delete
                    </button>
                </div>
            </div>
        `).join('');
    }
    
    // Modal Management
    openAddModal(type) {
        this.editingItem = null;
        const modal = document.getElementById('modal');
        const title = document.getElementById('modal-title');
        const body = document.getElementById('modal-body');
        
        const titles = {
            project: 'Add New Project',
            skill: 'Add New Skill',
            experience: 'Add New Experience',
            education: 'Add New Education'
        };
        
        title.textContent = titles[type];
        body.innerHTML = this.getModalForm(type);
        
        modal.classList.remove('hidden');
        
        this.setupFormSubmit(type);
    }
    
    getModalForm(type, data = null) {
        switch (type) {
            case 'project':
                return `
                    <form id="modal-form" class="space-y-4">
                        <div>
                            <label class="block text-gray-400 text-sm mb-2">Project Title *</label>
                            <input type="text" name="title" value="${data?.title || ''}" required class="w-full px-4 py-3 bg-dark-100 border border-gray-700 rounded-xl text-white focus:border-primary outline-none">
                        </div>
                        <div>
                            <label class="block text-gray-400 text-sm mb-2">Short Description *</label>
                            <textarea name="description" rows="2" required class="w-full px-4 py-3 bg-dark-100 border border-gray-700 rounded-xl text-white focus:border-primary outline-none resize-none">${data?.description || ''}</textarea>
                        </div>
                        <div>
                            <label class="block text-gray-400 text-sm mb-2">Long Description</label>
                            <textarea name="long_description" rows="3" class="w-full px-4 py-3 bg-dark-100 border border-gray-700 rounded-xl text-white focus:border-primary outline-none resize-none">${data?.long_description || ''}</textarea>
                        </div>
                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <label class="block text-gray-400 text-sm mb-2">Category *</label>
                                <select name="category" required class="w-full px-4 py-3 bg-dark-100 border border-gray-700 rounded-xl text-white focus:border-primary outline-none">
                                    <option value="web" ${data?.category === 'web' ? 'selected' : ''}>Web App</option>
                                    <option value="mobile" ${data?.category === 'mobile' ? 'selected' : ''}>Mobile</option>
                                    <option value="ai" ${data?.category === 'ai' ? 'selected' : ''}>AI/ML</option>
                                    <option value="other" ${data?.category === 'other' ? 'selected' : ''}>Other</option>
                                </select>
                            </div>
                            <div>
                                <label class="block text-gray-400 text-sm mb-2">Date</label>
                                <input type="month" name="date" value="${data?.date || ''}" class="w-full px-4 py-3 bg-dark-100 border border-gray-700 rounded-xl text-white focus:border-primary outline-none">
                            </div>
                        </div>
                        <div>
                            <label class="block text-gray-400 text-sm mb-2">Technologies (comma separated) *</label>
                            <input type="text" name="technologies" value="${data?.technologies?.join(', ') || ''}" required placeholder="React, Node.js, MongoDB" class="w-full px-4 py-3 bg-dark-100 border border-gray-700 rounded-xl text-white focus:border-primary outline-none">
                        </div>
                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <label class="block text-gray-400 text-sm mb-2">GitHub Link</label>
                                <input type="url" name="github_link" value="${data?.github_link || ''}" class="w-full px-4 py-3 bg-dark-100 border border-gray-700 rounded-xl text-white focus:border-primary outline-none">
                            </div>
                            <div>
                                <label class="block text-gray-400 text-sm mb-2">Live Link</label>
                                <input type="url" name="live_link" value="${data?.live_link || ''}" class="w-full px-4 py-3 bg-dark-100 border border-gray-700 rounded-xl text-white focus:border-primary outline-none">
                            </div>
                        </div>
                        <div>
                            <label class="block text-gray-400 text-sm mb-2">Project Image</label>
                            <input type="file" name="image" accept="image/*" class="w-full px-4 py-3 bg-dark-100 border border-gray-700 rounded-xl text-white focus:border-primary outline-none">
                            ${data?.image ? `<img src="${data.image}" class="mt-2 h-20 rounded-lg object-cover">` : ''}
                        </div>
                        <div class="flex items-center gap-2">
                            <input type="checkbox" name="featured" id="featured" ${data?.featured ? 'checked' : ''} class="w-4 h-4 rounded">
                            <label for="featured" class="text-gray-400 text-sm">Featured Project</label>
                        </div>
                        <div class="flex gap-4 pt-4">
                            <button type="button" onclick="admin.closeModal()" class="flex-1 py-3 bg-dark-100 rounded-xl font-medium hover:bg-dark-300 transition-colors">
                                Cancel
                            </button>
                            <button type="submit" class="flex-1 py-3 bg-gradient-to-r from-primary to-secondary rounded-xl font-medium hover:opacity-90 transition-opacity">
                                ${data ? 'Update' : 'Add'} Project
                            </button>
                        </div>
                    </form>
                `;
            
            case 'skill':
                return `
                    <form id="modal-form" class="space-y-4">
                        <div>
                            <label class="block text-gray-400 text-sm mb-2">Skill Name *</label>
                            <input type="text" name="name" value="${data?.name || ''}" required class="w-full px-4 py-3 bg-dark-100 border border-gray-700 rounded-xl text-white focus:border-primary outline-none">
                        </div>
                        <div>
                            <label class="block text-gray-400 text-sm mb-2">Category *</label>
                            <select name="category" required class="w-full px-4 py-3 bg-dark-100 border border-gray-700 rounded-xl text-white focus:border-primary outline-none">
                                <option value="programming" ${data?.category === 'programming' ? 'selected' : ''}>Programming</option>
                                <option value="framework" ${data?.category === 'framework' ? 'selected' : ''}>Framework</option>
                                <option value="database" ${data?.category === 'database' ? 'selected' : ''}>Database</option>
                                <option value="tool" ${data?.category === 'tool' ? 'selected' : ''}>Tool</option>
                            </select>
                        </div>
                        <div>
                            <label class="block text-gray-400 text-sm mb-2">Proficiency Level: <span id="level-display">${data?.level || 50}%</span></label>
                            <input type="range" name="level" min="0" max="100" value="${data?.level || 50}" class="w-full" oninput="document.getElementById('level-display').textContent = this.value + '%'">
                        </div>
                        <div>
                            <label class="block text-gray-400 text-sm mb-2">Icon Class (Font Awesome)</label>
                            <input type="text" name="icon" value="${data?.icon || 'fas fa-code'}" placeholder="fab fa-react" class="w-full px-4 py-3 bg-dark-100 border border-gray-700 rounded-xl text-white focus:border-primary outline-none">
                            <p class="text-gray-500 text-xs mt-1">Example: fab fa-python, fas fa-database</p>
                        </div>
                        <div class="flex gap-4 pt-4">
                            <button type="button" onclick="admin.closeModal()" class="flex-1 py-3 bg-dark-100 rounded-xl font-medium hover:bg-dark-300 transition-colors">
                                Cancel
                            </button>
                            <button type="submit" class="flex-1 py-3 bg-gradient-to-r from-primary to-secondary rounded-xl font-medium hover:opacity-90 transition-opacity">
                                ${data ? 'Update' : 'Add'} Skill
                            </button>
                        </div>
                    </form>
                `;
            
            case 'experience':
                return `
                    <form id="modal-form" class="space-y-4">
                        <div>
                            <label class="block text-gray-400 text-sm mb-2">Job Title *</label>
                            <input type="text" name="title" value="${data?.title || ''}" required class="w-full px-4 py-3 bg-dark-100 border border-gray-700 rounded-xl text-white focus:border-primary outline-none">
                        </div>
                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <label class="block text-gray-400 text-sm mb-2">Company *</label>
                                <input type="text" name="company" value="${data?.company || ''}" required class="w-full px-4 py-3 bg-dark-100 border border-gray-700 rounded-xl text-white focus:border-primary outline-none">
                            </div>
                            <div>
                                <label class="block text-gray-400 text-sm mb-2">Location *</label>
                                <input type="text" name="location" value="${data?.location || ''}" required class="w-full px-4 py-3 bg-dark-100 border border-gray-700 rounded-xl text-white focus:border-primary outline-none">
                            </div>
                        </div>
                        <div>
                            <label class="block text-gray-400 text-sm mb-2">Period *</label>
                            <input type="text" name="period" value="${data?.period || ''}" required placeholder="2022 - Present" class="w-full px-4 py-3 bg-dark-100 border border-gray-700 rounded-xl text-white focus:border-primary outline-none">
                        </div>
                        <div>
                            <label class="block text-gray-400 text-sm mb-2">Description *</label>
                            <textarea name="description" rows="3" required class="w-full px-4 py-3 bg-dark-100 border border-gray-700 rounded-xl text-white focus:border-primary outline-none resize-none">${data?.description || ''}</textarea>
                        </div>
                        <div>
                            <label class="block text-gray-400 text-sm mb-2">Technologies (comma separated)</label>
                            <input type="text" name="technologies" value="${data?.technologies?.join(', ') || ''}" class="w-full px-4 py-3 bg-dark-100 border border-gray-700 rounded-xl text-white focus:border-primary outline-none">
                        </div>
                        <div class="flex gap-4 pt-4">
                            <button type="button" onclick="admin.closeModal()" class="flex-1 py-3 bg-dark-100 rounded-xl font-medium hover:bg-dark-300 transition-colors">
                                Cancel
                            </button>
                            <button type="submit" class="flex-1 py-3 bg-gradient-to-r from-primary to-secondary rounded-xl font-medium hover:opacity-90 transition-opacity">
                                ${data ? 'Update' : 'Add'} Experience
                            </button>
                        </div>
                    </form>
                `;
            
            case 'education':
                return `
                    <form id="modal-form" class="space-y-4">
                        <div>
                            <label class="block text-gray-400 text-sm mb-2">Degree *</label>
                            <input type="text" name="degree" value="${data?.degree || ''}" required class="w-full px-4 py-3 bg-dark-100 border border-gray-700 rounded-xl text-white focus:border-primary outline-none">
                        </div>
                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <label class="block text-gray-400 text-sm mb-2">Institution *</label>
                                <input type="text" name="institution" value="${data?.institution || ''}" required class="w-full px-4 py-3 bg-dark-100 border border-gray-700 rounded-xl text-white focus:border-primary outline-none">
                            </div>
                            <div>
                                <label class="block text-gray-400 text-sm mb-2">Location *</label>
                                <input type="text" name="location" value="${data?.location || ''}" required class="w-full px-4 py-3 bg-dark-100 border border-gray-700 rounded-xl text-white focus:border-primary outline-none">
                            </div>
                        </div>
                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <label class="block text-gray-400 text-sm mb-2">Period *</label>
                                <input type="text" name="period" value="${data?.period || ''}" required placeholder="2017 - 2021" class="w-full px-4 py-3 bg-dark-100 border border-gray-700 rounded-xl text-white focus:border-primary outline-none">
                            </div>
                            <div>
                                <label class="block text-gray-400 text-sm mb-2">GPA</label>
                                <input type="text" name="gpa" value="${data?.gpa || ''}" placeholder="3.8/4.0" class="w-full px-4 py-3 bg-dark-100 border border-gray-700 rounded-xl text-white focus:border-primary outline-none">
                            </div>
                        </div>
                        <div>
                            <label class="block text-gray-400 text-sm mb-2">Description</label>
                            <textarea name="description" rows="2" class="w-full px-4 py-3 bg-dark-100 border border-gray-700 rounded-xl text-white focus:border-primary outline-none resize-none">${data?.description || ''}</textarea>
                        </div>
                        <div class="flex gap-4 pt-4">
                            <button type="button" onclick="admin.closeModal()" class="flex-1 py-3 bg-dark-100 rounded-xl font-medium hover:bg-dark-300 transition-colors">
                                Cancel
                            </button>
                            <button type="submit" class="flex-1 py-3 bg-gradient-to-r from-primary to-secondary rounded-xl font-medium hover:opacity-90 transition-opacity">
                                ${data ? 'Update' : 'Add'} Education
                            </button>
                        </div>
                    </form>
                `;
            
            default:
                return '';
        }
    }
    
    closeModal() {
        document.getElementById('modal').classList.add('hidden');
        this.editingItem = null;
    }
    
    // Edit Functions
    editProject(id) {
        const project = this.config.projects.find(p => p.id === id);
        if (!project) return;
        
        this.editingItem = { type: 'project', id };
        
        const modal = document.getElementById('modal');
        const title = document.getElementById('modal-title');
        const body = document.getElementById('modal-body');
        
        title.textContent = 'Edit Project';
        body.innerHTML = this.getModalForm('project', project);
        
        modal.classList.remove('hidden');
        
        this.setupFormSubmit('project');
    }
    
    editSkill(id) {
        const skill = this.config.skills.find(s => s.id === id);
        if (!skill) return;
        
        this.editingItem = { type: 'skill', id };
        
        const modal = document.getElementById('modal');
        const title = document.getElementById('modal-title');
        const body = document.getElementById('modal-body');
        
        title.textContent = 'Edit Skill';
        body.innerHTML = this.getModalForm('skill', skill);
        
        modal.classList.remove('hidden');
        
        this.setupFormSubmit('skill');
    }
    
    editExperience(id) {
        const exp = this.config.experience.find(e => e.id === id);
        if (!exp) return;
        
        this.editingItem = { type: 'experience', id };
        
        const modal = document.getElementById('modal');
        const title = document.getElementById('modal-title');
        const body = document.getElementById('modal-body');
        
        title.textContent = 'Edit Experience';
        body.innerHTML = this.getModalForm('experience', exp);
        
        modal.classList.remove('hidden');
        
        this.setupFormSubmit('experience');
    }
    
    editEducation(id) {
        const edu = this.config.education.find(e => e.id === id);
        if (!edu) return;
        
        this.editingItem = { type: 'education', id };
        
        const modal = document.getElementById('modal');
        const title = document.getElementById('modal-title');
        const body = document.getElementById('modal-body');
        
        title.textContent = 'Edit Education';
        body.innerHTML = this.getModalForm('education', edu);
        
        modal.classList.remove('hidden');
        
        this.setupFormSubmit('education');
    }
    
    setupFormSubmit(type) {
        const form = document.getElementById('modal-form');
        
        // Remove old event listeners by cloning and replacing
        const newForm = form.cloneNode(true);
        form.parentNode.replaceChild(newForm, form);
        const updatedForm = document.getElementById('modal-form');
        
        updatedForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const formData = new FormData(updatedForm);
            const data = {};
            
            // Get file if present
            const imageFile = formData.get('image');
            let uploadedImagePath = null;
            
            // Upload image if file exists
            if (imageFile && imageFile.size > 0) {
                const uploadFormData = new FormData();
                uploadFormData.append('file', imageFile);
                // Use correct type for projects
                uploadFormData.append('type', type === 'project' ? 'project' : 'misc');
                
                try {
                    const uploadResponse = await fetch(`${this.apiBase}/upload`, {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
                        },
                        body: uploadFormData
                    });
                    
                    if (uploadResponse.ok) {
                        const uploadData = await uploadResponse.json();
                        uploadedImagePath = uploadData.path;
                    } else {
                        throw new Error('Image upload failed');
                    }
                } catch (error) {
                    console.error('Image upload error:', error);
                    this.showToast('Failed to upload image', 'error');
                    return;
                }
            }
            
            // Process form fields
            formData.forEach((value, key) => {
                if (key === 'technologies') {
                    data[key] = value.split(',').map(t => t.trim()).filter(t => t);
                } else if (key === 'featured') {
                    data[key] = true;
                } else if (key === 'level') {
                    data[key] = parseInt(value);
                } else if (key !== 'image') {
                    data[key] = value;
                }
            });
            
            // Add uploaded image path if available
            if (uploadedImagePath) {
                data.image = uploadedImagePath;
            }
            
            if (!formData.has('featured') && type === 'project') {
                data.featured = false;
            }
            
            if (this.editingItem) {
                // Update existing
                data.id = this.editingItem.id;
                await this.updateItem(type, data);
            } else {
                // Add new
                data.id = `${type}_${Date.now()}`;
                await this.addItem(type, data);
            }
        });
    }
    
    async addItem(type, data) {
        const collections = {
            project: 'projects',
            skill: 'skills',
            experience: 'experience',
            education: 'education'
        };
        
        const collection = collections[type];
        if (!this.config[collection]) {
            this.config[collection] = [];
        }
        
        this.config[collection].push(data);
        
        if (await this.saveConfig()) {
            this.closeModal();
            this.refreshSection(type);
            this.updateStats();
        }
    }
    
    async updateItem(type, data) {
        const collections = {
            project: 'projects',
            skill: 'skills',
            experience: 'experience',
            education: 'education'
        };
        
        const collection = collections[type];
        const index = this.config[collection].findIndex(item => item.id === data.id);
        
        if (index !== -1) {
            this.config[collection][index] = { ...this.config[collection][index], ...data };
            
            if (await this.saveConfig()) {
                this.closeModal();
                this.refreshSection(type);
            }
        }
    }
    
    // Delete Functions
    confirmDelete(type, id) {
        const modal = document.getElementById('delete-modal');
        modal.classList.remove('hidden');
        
        this.deleteCallback = async () => {
            await this.deleteItem(type, id);
            this.closeDeleteModal();
        };
        
        document.getElementById('confirm-delete-btn').onclick = this.deleteCallback;
    }
    
    closeDeleteModal() {
        document.getElementById('delete-modal').classList.add('hidden');
        this.deleteCallback = null;
    }
    
    async deleteItem(type, id) {
        const collections = {
            project: 'projects',
            skill: 'skills',
            experience: 'experience',
            education: 'education',
            message: 'messages'
        };
        
        const collection = collections[type];
        const index = this.config[collection].findIndex(item => item.id === id);
        
        if (index !== -1) {
            // If it's a project with an image, delete the image too
            if (type === 'project' && this.config[collection][index].image) {
                await this.deleteImage(this.config[collection][index].image);
            }
            
            this.config[collection].splice(index, 1);
            
            if (await this.saveConfig()) {
                this.refreshSection(type);
                this.updateStats();
                this.showToast('Item deleted successfully', 'success');
            }
        }
    }
    
    async deleteImage(imagePath) {
        try {
            await fetch(`${this.apiBase}/images`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
                },
                body: JSON.stringify({ path: imagePath })
            });
        } catch (error) {
            console.error('Failed to delete image:', error);
        }
    }
    
    // Messages
    async markAsRead(id) {
        const message = this.config.messages.find(m => m.id === id);
        if (message) {
            message.read = true;
            await this.saveConfig();
            this.populateMessages();
            this.updateStats();
        }
    }
    
    async markAllAsRead() {
        this.config.messages.forEach(m => m.read = true);
        await this.saveConfig();
        this.populateMessages();
        this.updateStats();
        this.showToast('All messages marked as read', 'success');
    }
    
    // Image Upload
    async handleImageUpload(event, type) {
        const file = event.target.files[0];
        if (!file) return;
        
        const formData = new FormData();
        formData.append('file', file);
        formData.append('type', type);
        
        try {
            const response = await fetch(`${this.apiBase}/upload`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
                },
                body: formData
            });
            
            if (!response.ok) throw new Error('Upload failed');
            
            const data = await response.json();
            
            if (type === 'profile') {
                this.config.personal_info.profile_image = data.path;
                document.getElementById('profile-preview').src = data.path;
                await this.saveConfig();
            }
            
            this.showToast('Image uploaded successfully', 'success');
        } catch (error) {
            this.showToast('Failed to upload image', 'error');
        }
    }
    
    // Export/Import
    exportData() {
        const dataStr = JSON.stringify(this.config, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `portfolio_backup_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        this.showToast('Data exported successfully', 'success');
    }
    
    async createBackup() {
        try {
            const response = await fetch(`${this.apiBase}/backup`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
                }
            });
            
            if (!response.ok) throw new Error('Backup failed');
            
            this.showToast('Backup created successfully', 'success');
        } catch (error) {
            this.showToast('Failed to create backup', 'error');
        }
    }
    
    // Refresh Sections
    refreshSection(type) {
        switch (type) {
            case 'project':
                this.populateProjects();
                break;
            case 'skill':
                this.populateSkills();
                break;
            case 'experience':
                this.populateExperience();
                break;
            case 'education':
                this.populateEducation();
                break;
            case 'message':
                this.populateMessages();
                break;
        }
    }
    
    // Utilities
    formatDate(timestamp) {
        if (!timestamp) return '';
        const date = new Date(timestamp);
        return date.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric',
            year: 'numeric'
        });
    }
    
    showToast(message, type = 'info') {
        const container = document.getElementById('toast-container');
        
        const icons = {
            success: 'fas fa-check-circle text-green-500',
            error: 'fas fa-times-circle text-red-500',
            warning: 'fas fa-exclamation-circle text-yellow-500',
            info: 'fas fa-info-circle text-blue-500'
        };
        
        const toast = document.createElement('div');
        toast.className = 'flex items-center gap-3 px-4 py-3 bg-dark-200 border border-gray-700 rounded-xl shadow-xl animate-slide-in min-w-[300px]';
        toast.innerHTML = `
            <i class="${icons[type]} text-xl"></i>
            <span class="flex-1 text-white">${message}</span>
            <button onclick="this.parentElement.remove()" class="text-gray-400 hover:text-white">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        container.appendChild(toast);
        
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(100%)';
            toast.style.transition = 'all 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 5000);
    }
}

// Initialize admin panel
const admin = new AdminPanel();