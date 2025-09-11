// Main application JavaScript
class AXONApp {
    constructor() {
        this.apiBase = 'http://localhost:8001/api';  // Use file scanner for main API
        this.fileServiceBase = 'http://localhost:8001';
        this.urlServiceBase = 'http://localhost:8002';
        this.currentSection = 'login';
        this.isLoggedIn = false;
        this.init();
    }

    init() {
        this.setupLoginHandler();
        this.setupNavigation();
        this.setupEventListeners();
        
        // Load saved theme first
        const savedTheme = localStorage.getItem('theme') || 'light';
        this.setTheme(savedTheme);
        
        // Check if user is already logged in
        const token = localStorage.getItem('authToken');
        if (token) {
            this.isLoggedIn = true;
            this.loadUserProfile();
            this.showDashboard();
        } else {
            this.showLogin();
        }
    }

    setupLoginHandler() {
        // Add a small delay to ensure elements are available
        setTimeout(() => {
            const loginForm = document.getElementById('loginForm');
            const signupForm = document.getElementById('signupForm');
            const showSignupLink = document.getElementById('showSignup');
            const showLoginLink = document.getElementById('showLogin');
            const themeToggleLogin = document.getElementById('theme-toggle-login');
            
            console.log('Elements found:', {
                loginForm: !!loginForm,
                signupForm: !!signupForm,
                showSignupLink: !!showSignupLink,
                showLoginLink: !!showLoginLink
            });
            
            // Login form handler
            if (loginForm) {
                loginForm.addEventListener('submit', (e) => {
                    e.preventDefault();
                    this.handleLogin();
                });
            }
            
            // Signup form handler
            if (signupForm) {
                signupForm.addEventListener('submit', (e) => {
                    e.preventDefault();
                    this.handleSignup();
                });
            }
            
            // Switch between login and signup
            if (showSignupLink) {
                showSignupLink.addEventListener('click', (e) => {
                    console.log('Signup link clicked!');
                    e.preventDefault();
                    this.showSignupForm();
                });
            } else {
                console.error('showSignup element not found!');
            }
        
            if (showLoginLink) {
                showLoginLink.addEventListener('click', (e) => {
                    console.log('Login link clicked!');
                    e.preventDefault();
                    this.showLoginForm();
                });
            }
            
            // Theme toggle on login page
            if (themeToggleLogin) {
                themeToggleLogin.addEventListener('click', () => {
                    this.toggleTheme();
                });
            }
            
            // Password toggle functionality
            this.setupPasswordToggles();
            
            // Setup real-time password validation
            this.setupPasswordValidation();
            
            // Setup profile functionality
            this.setupProfileFeatures();
        }, 100); // Small delay to ensure DOM elements are available
    }

    setupPasswordToggles() {
        const passwordToggles = [
            { toggleId: 'loginPasswordToggle', inputId: 'loginPassword' },
            { toggleId: 'signupPasswordToggle', inputId: 'signupPassword' },
            { toggleId: 'confirmPasswordToggle', inputId: 'confirmPassword' }
        ];
        
        passwordToggles.forEach(({ toggleId, inputId }) => {
            const toggle = document.getElementById(toggleId);
            const input = document.getElementById(inputId);
            
            if (toggle && input) {
                toggle.addEventListener('click', () => {
                    const icon = toggle.querySelector('i');
                    if (input.type === 'password') {
                        input.type = 'text';
                        icon.classList.remove('fa-eye');
                        icon.classList.add('fa-eye-slash');
                    } else {
                        input.type = 'password';
                        icon.classList.remove('fa-eye-slash');
                        icon.classList.add('fa-eye');
                    }
                });
            }
        });
    }

    setupPasswordValidation() {
        const signupPasswordInput = document.getElementById('signupPassword');
        const passwordCriteria = document.getElementById('passwordCriteria');
        
        if (signupPasswordInput && passwordCriteria) {
            signupPasswordInput.addEventListener('input', (e) => {
                this.updatePasswordCriteria(e.target.value);
            });
        }
    }

    updatePasswordCriteria(password) {
        const criteria = {
            length: password.length >= 8,
            uppercase: /[A-Z]/.test(password),
            lowercase: /[a-z]/.test(password),
            special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)
        };

        Object.keys(criteria).forEach(criterion => {
            const element = document.querySelector(`[data-criterion="${criterion}"]`);
            if (element) {
                const icon = element.querySelector('i');
                const isValid = criteria[criterion];
                
                element.classList.remove('valid', 'invalid');
                element.classList.add(isValid ? 'valid' : 'invalid');
                
                icon.classList.remove('fa-check', 'fa-times');
                icon.classList.add(isValid ? 'fa-check' : 'fa-times');
            }
        });
    }

    setupProfileFeatures() {
        // Profile picture upload
        this.setupProfilePictureUpload();
        
        // Profile dropdown menu
        this.setupProfileDropdown();
    }

    setupProfilePictureUpload() {
        const profilePicInput = document.getElementById('profilePic');
        const profilePicPreview = document.getElementById('profilePicPreview');
        
        if (profilePicInput && profilePicPreview) {
            profilePicInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        const img = document.createElement('img');
                        img.src = e.target.result;
                        img.alt = 'Profile Preview';
                        
                        // Clear existing content and add image
                        profilePicPreview.innerHTML = '';
                        profilePicPreview.appendChild(img);
                        
                        // Store the image data for later use
                        this.selectedProfilePic = e.target.result;
                    };
                    reader.readAsDataURL(file);
                }
            });
        }
    }

    setupProfileDropdown() {
        const profileBtn = document.getElementById('profileBtn');
        const profileDropdown = document.querySelector('.profile-dropdown');
        
        if (profileBtn && profileDropdown) {
            // Toggle dropdown on profile button click
            profileBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                profileDropdown.classList.toggle('active');
            });
            
            // Close dropdown when clicking outside
            document.addEventListener('click', (e) => {
                if (!profileDropdown.contains(e.target)) {
                    profileDropdown.classList.remove('active');
                }
            });
            
            // Handle dropdown menu items
            const menuItems = profileDropdown.querySelectorAll('.profile-menu-item');
            menuItems.forEach(item => {
                item.addEventListener('click', (e) => {
                    e.preventDefault();
                    const href = item.getAttribute('href');
                    
                    if (href === '#logout') {
                        this.handleLogout();
                    } else if (href === '#profile') {
                        this.showProfile();
                    } else if (href === '#settings') {
                        this.showSection('settings');
                    }
                    
                    profileDropdown.classList.remove('active');
                });
            });
        }
    }

    updateNavbarProfile() {
        const navProfilePic = document.getElementById('navProfilePic');
        const navProfileIcon = document.getElementById('navProfileIcon');
        
        if (this.selectedProfilePic && navProfilePic && navProfileIcon) {
            navProfilePic.src = this.selectedProfilePic;
            navProfilePic.style.display = 'block';
            navProfileIcon.style.display = 'none';
        }
    }

    showProfile() {
        // Show profile section and hide other sections
        this.showSection('profile');
        document.body.className = '';
        
        // Load current user data into profile form
        this.loadProfileData();
        
        // Setup profile form handlers
        this.setupProfileHandlers();
    }

    loadProfileData() {
        // Load saved user data into profile form
        const savedUsername = localStorage.getItem('userName') || '';
        const savedEmail = localStorage.getItem('userEmail') || localStorage.getItem('userIdentifier') || '';
        const savedProfilePic = localStorage.getItem('userProfilePic') || '';
        
        // Populate form fields
        const usernameField = document.getElementById('profileUsername');
        const emailField = document.getElementById('profileEmail');
        const profileImageLarge = document.getElementById('profileImageLarge');
        const profileIconLarge = document.getElementById('profileIconLarge');
        
        if (usernameField) usernameField.value = savedUsername;
        if (emailField) emailField.value = savedEmail;
        
        // Load profile picture
        if (savedProfilePic && profileImageLarge && profileIconLarge) {
            profileImageLarge.src = savedProfilePic;
            profileImageLarge.style.display = 'block';
            profileIconLarge.style.display = 'none';
        }
    }

    setupProfileHandlers() {
        // Profile picture upload handler
        const profilePicEdit = document.getElementById('profilePicEdit');
        const profileImageLarge = document.getElementById('profileImageLarge');
        const profileIconLarge = document.getElementById('profileIconLarge');
        
        if (profilePicEdit && profileImageLarge && profileIconLarge) {
            profilePicEdit.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        profileImageLarge.src = e.target.result;
                        profileImageLarge.style.display = 'block';
                        profileIconLarge.style.display = 'none';
                        
                        // Store the new profile picture
                        this.selectedProfilePic = e.target.result;
                    };
                    reader.readAsDataURL(file);
                }
            });
        }
        
        // Profile form submit handler
        const profileForm = document.getElementById('profile-form');
        if (profileForm) {
            profileForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleProfileSave();
            });
        }
        
        // Cancel button handler
        const cancelBtn = document.getElementById('cancelProfile');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                this.showDashboard();
            });
        }
        
        // Password toggles for profile form
        this.setupProfilePasswordToggles();
        
        // Setup profile password validation
        this.setupProfilePasswordValidation();
    }

    setupProfilePasswordValidation() {
        const newPasswordInput = document.getElementById('newPassword');
        const profilePasswordCriteria = document.getElementById('profilePasswordCriteria');
        
        if (newPasswordInput && profilePasswordCriteria) {
            newPasswordInput.addEventListener('input', (e) => {
                this.updateProfilePasswordCriteria(e.target.value);
            });
        }
    }

    updateProfilePasswordCriteria(password) {
        const criteria = {
            length: password.length >= 8,
            uppercase: /[A-Z]/.test(password),
            lowercase: /[a-z]/.test(password),
            special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)
        };

        Object.keys(criteria).forEach(criterion => {
            const element = document.querySelector(`#profilePasswordCriteria [data-criterion="${criterion}"]`);
            if (element) {
                const icon = element.querySelector('i');
                const isValid = criteria[criterion];
                
                element.classList.remove('valid', 'invalid');
                element.classList.add(isValid ? 'valid' : 'invalid');
                
                icon.classList.remove('fa-check', 'fa-times');
                icon.classList.add(isValid ? 'fa-check' : 'fa-times');
            }
        });
    }

    setupProfilePasswordToggles() {
        const passwordToggles = [
            { toggleId: 'currentPasswordToggle', inputId: 'currentPassword' },
            { toggleId: 'newPasswordToggle', inputId: 'newPassword' },
            { toggleId: 'confirmNewPasswordToggle', inputId: 'confirmNewPassword' }
        ];
        
        passwordToggles.forEach(({ toggleId, inputId }) => {
            const toggle = document.getElementById(toggleId);
            const input = document.getElementById(inputId);
            
            if (toggle && input) {
                toggle.addEventListener('click', () => {
                    const icon = toggle.querySelector('i');
                    if (input.type === 'password') {
                        input.type = 'text';
                        icon.classList.remove('fa-eye');
                        icon.classList.add('fa-eye-slash');
                    } else {
                        input.type = 'password';
                        icon.classList.remove('fa-eye-slash');
                        icon.classList.add('fa-eye');
                    }
                });
            }
        });
    }

    handleProfileSave() {
        const username = document.getElementById('profileUsername').value;
        const email = document.getElementById('profileEmail').value;
        const currentPassword = document.getElementById('currentPassword').value;
        const newPassword = document.getElementById('newPassword').value;
        const confirmNewPassword = document.getElementById('confirmNewPassword').value;
        
        // Validate required fields
        if (!username || !email) {
            this.showPasswordMismatchPopup('Please fill in username and email');
            return;
        }
        
        // Validate password change if provided
        if (newPassword || confirmNewPassword) {
            if (!currentPassword) {
                this.showPasswordMismatchPopup('Current password is required to change password');
                return;
            }
            
            if (newPassword !== confirmNewPassword) {
                // Add shake animation to profile password boxes and clear confirm password
                this.shakeProfilePasswordBoxes();
                return;
            }
            
            // Validate new password strength
            const passwordValidation = this.validatePassword(newPassword);
            if (!passwordValidation.isValid) {
                this.showPasswordMismatchPopup(`New password must contain:\n• ${passwordValidation.errors.join('\n• ')}`);
                return;
            }
        }
        
        // Save profile data
        localStorage.setItem('userName', username);
        localStorage.setItem('userEmail', email);
        localStorage.setItem('userIdentifier', email);
        
        // Save profile picture if changed
        if (this.selectedProfilePic) {
            localStorage.setItem('userProfilePic', this.selectedProfilePic);
            this.updateNavbarProfile();
        }
        
        // Show success message and redirect
        this.showPasswordMismatchPopup('Profile updated successfully!');
        setTimeout(() => {
            this.showDashboard();
        }, 2000);
    }

    shakeProfilePasswordBoxes() {
        const newPasswordContainer = document.getElementById('newPassword').closest('.password-input-container');
        const confirmNewPasswordContainer = document.getElementById('confirmNewPassword').closest('.password-input-container');
        const confirmNewPasswordInput = document.getElementById('confirmNewPassword');
        
        // Clear the confirm new password field
        if (confirmNewPasswordInput) {
            confirmNewPasswordInput.value = '';
        }
        
        // Show popup message
        this.showPasswordMismatchPopup('New passwords do not match');
        
        // Add shake animation
        if (newPasswordContainer) {
            newPasswordContainer.classList.add('shake');
        }
        if (confirmNewPasswordContainer) {
            confirmNewPasswordContainer.classList.add('shake');
        }
        
        // Remove shake animation after it completes
        setTimeout(() => {
            if (newPasswordContainer) {
                newPasswordContainer.classList.remove('shake');
            }
            if (confirmNewPasswordContainer) {
                confirmNewPasswordContainer.classList.remove('shake');
            }
        }, 600); // Duration matches the CSS animation
    }

    handleLogout() {
        // Clear stored data
        localStorage.removeItem('authToken');
        localStorage.removeItem('userIdentifier');
        this.isLoggedIn = false;
        this.selectedProfilePic = null;
        
        // Reset profile picture
        const navProfilePic = document.getElementById('navProfilePic');
        const navProfileIcon = document.getElementById('navProfileIcon');
        
        if (navProfilePic && navProfileIcon) {
            navProfilePic.style.display = 'none';
            navProfileIcon.style.display = 'block';
        }
        
        // Show login page
        this.showLogin();
    }

    showLoginForm() {
        const loginForm = document.getElementById('loginForm');
        const signupForm = document.getElementById('signupForm');
        const subtitle = document.getElementById('auth-subtitle');
        
        if (loginForm && signupForm && subtitle) {
            loginForm.style.display = 'block';
            signupForm.style.display = 'none';
            subtitle.textContent = 'Sign in to your account';
        }
    }

    showSignupForm() {
        console.log('showSignupForm called');
        const loginForm = document.getElementById('loginForm');
        const signupForm = document.getElementById('signupForm');
        const subtitle = document.getElementById('auth-subtitle');
        
        console.log('Form elements:', {
            loginForm: !!loginForm,
            signupForm: !!signupForm,
            subtitle: !!subtitle
        });
        
        if (loginForm && signupForm && subtitle) {
            console.log('Switching to signup form');
            loginForm.style.display = 'none';
            signupForm.style.display = 'block';
            subtitle.textContent = 'Create your account';
        } else {
            console.error('Could not find form elements');
        }
    }

    handleLogin() {
        const identifier = document.getElementById('loginIdentifier').value;
        const password = document.getElementById('loginPassword').value;
        
        // Simple validation for demo purposes
        if (identifier && password) {
            // Simulate successful login
            this.isLoggedIn = true;
            localStorage.setItem('authToken', 'demo-token');
            localStorage.setItem('userIdentifier', identifier);
            
            // Load profile picture if exists
            this.loadUserProfile();
            
            this.showDashboard();
        } else {
            alert('Please enter both identifier and password');
        }
    }

    loadUserProfile() {
        const savedProfilePic = localStorage.getItem('userProfilePic');
        if (savedProfilePic) {
            this.selectedProfilePic = savedProfilePic;
            this.updateNavbarProfile();
        }
    }

    // Password validation function
    validatePassword(password) {
        const minLength = 8;
        const hasUppercase = /[A-Z]/.test(password);
        const hasLowercase = /[a-z]/.test(password);
        const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
        
        const errors = [];
        
        if (password.length < minLength) {
            errors.push(`minimum ${minLength} characters`);
        }
        if (!hasUppercase) {
            errors.push('at least one uppercase letter');
        }
        if (!hasLowercase) {
            errors.push('at least one lowercase letter');
        }
        if (!hasSpecialChar) {
            errors.push('at least one special symbol');
        }
        
        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }

    handleSignup() {
        const username = document.getElementById('signupUsername').value;
        const email = document.getElementById('signupEmail').value;
        const password = document.getElementById('signupPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        
        // Validation
        if (!username || !email || !password || !confirmPassword) {
            alert('Please fill in all fields');
            return;
        }
        
        if (password !== confirmPassword) {
            // Add shake animation to password boxes instead of alert
            this.shakePasswordBoxes();
            return;
        }
        
        // Enhanced password validation
        const passwordValidation = this.validatePassword(password);
        if (!passwordValidation.isValid) {
            alert(`Password must contain:\n• ${passwordValidation.errors.join('\n• ')}`);
            return;
        }
        
        // Save profile picture if uploaded
        if (this.selectedProfilePic) {
            localStorage.setItem('userProfilePic', this.selectedProfilePic);
        }
        
        // Save user data
        localStorage.setItem('userName', username);
        localStorage.setItem('userEmail', email);
        
        // Simulate successful signup
        alert('Account created successfully! Please sign in.');
        this.showLoginForm();
        
        // Pre-fill login form
        document.getElementById('loginIdentifier').value = email;
    }

    shakePasswordBoxes() {
        const signupPasswordContainer = document.getElementById('signupPassword').closest('.password-input-container');
        const confirmPasswordContainer = document.getElementById('confirmPassword').closest('.password-input-container');
        const confirmPasswordInput = document.getElementById('confirmPassword');
        
        // Clear the confirm password field
        if (confirmPasswordInput) {
            confirmPasswordInput.value = '';
        }
        
        // Show popup message
        this.showPasswordMismatchPopup();
        
        // Add shake animation
        if (signupPasswordContainer) {
            signupPasswordContainer.classList.add('shake');
        }
        if (confirmPasswordContainer) {
            confirmPasswordContainer.classList.add('shake');
        }
        
        // Remove shake animation after it completes
        setTimeout(() => {
            if (signupPasswordContainer) {
                signupPasswordContainer.classList.remove('shake');
            }
            if (confirmPasswordContainer) {
                confirmPasswordContainer.classList.remove('shake');
            }
        }, 600); // Duration matches the CSS animation
    }

    showPasswordMismatchPopup(message = 'Passwords do not match') {
        const popup = document.getElementById('passwordMismatchPopup');
        const messageSpan = popup?.querySelector('span');
        
        if (popup && messageSpan) {
            // Update message
            messageSpan.textContent = message;
            
            // Show the popup
            popup.classList.add('show');
            
            // Hide the popup after 3 seconds
            setTimeout(() => {
                popup.classList.remove('show');
            }, 3000);
        }
    }

    showLogin() {
        document.body.className = 'login-page';
        this.showSection('login');
    }

    showDashboard() {
        document.body.className = '';
        this.showSection('dashboard');
        this.loadDashboard();
    }

    setupNavigation() {
        const navLinks = document.querySelectorAll('.nav-link');
        const sections = document.querySelectorAll('.section');

        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const targetSection = link.getAttribute('href').substring(1);
                
                // Handle logout
                if (targetSection === 'logout') {
                    this.handleLogout();
                    return;
                }
                
                this.showSection(targetSection);
                
                // Update active nav link
                navLinks.forEach(l => l.classList.remove('active'));
                link.classList.add('active');
            });
        });
    }

    handleLogout() {
        this.isLoggedIn = false;
        localStorage.removeItem('authToken');
        localStorage.removeItem('userIdentifier');
        
        // Clear login forms
        const loginForm = document.getElementById('loginForm');
        const signupForm = document.getElementById('signupForm');
        if (loginForm) loginForm.reset();
        if (signupForm) signupForm.reset();
        
        this.showLogin();
    }

    showSection(sectionId) {
        const sections = document.querySelectorAll('.section');
        sections.forEach(section => {
            section.classList.remove('active');
        });

        const targetSection = document.getElementById(sectionId);
        if (targetSection) {
            targetSection.classList.add('active');
            this.currentSection = sectionId;

            // Load section-specific data
            this.loadSectionData(sectionId);
        }
    }

    loadSectionData(sectionId) {
        switch (sectionId) {
            case 'dashboard':
                this.loadDashboard();
                break;
            case 'email-scanner':
                this.loadRecentEmailScans();
                break;
            case 'file-scanner':
                this.loadRecentFileScans();
                break;
            case 'threat-intel':
                this.loadThreatIntelligence();
                break;
        }
    }

    setupEventListeners() {
        // Loading overlay
        this.loadingOverlay = document.getElementById('loading-overlay');
        
        // Alert modal
        this.alertModal = document.getElementById('alert-modal');
        this.setupAlertModal();
        
        // Mobile navigation toggle
        this.setupMobileNavigation();
        
        // Theme toggle
        this.setupThemeToggle();
    }
    
    setupMobileNavigation() {
        const navToggle = document.querySelector('.nav-toggle');
        const navMenu = document.querySelector('.nav-menu');
        
        if (navToggle && navMenu) {
            navToggle.addEventListener('click', () => {
                navMenu.classList.toggle('mobile-active');
                navToggle.classList.toggle('active');
            });
            
            // Close mobile menu when clicking on a nav link
            const navLinks = document.querySelectorAll('.nav-link');
            navLinks.forEach(link => {
                link.addEventListener('click', () => {
                    navMenu.classList.remove('mobile-active');
                    navToggle.classList.remove('active');
                });
            });
            
            // Close mobile menu when clicking outside
            document.addEventListener('click', (e) => {
                if (!navToggle.contains(e.target) && !navMenu.contains(e.target)) {
                    navMenu.classList.remove('mobile-active');
                    navToggle.classList.remove('active');
                }
            });
        }
        
        // Touch-friendly interactions for mobile
        this.setupTouchInteractions();
    }
    
    setupTouchInteractions() {
        // Add touch feedback for buttons on mobile
        const buttons = document.querySelectorAll('.scan-btn, .btn');
        buttons.forEach(button => {
            button.addEventListener('touchstart', function() {
                this.style.transform = 'scale(0.98)';
            });
            
            button.addEventListener('touchend', function() {
                this.style.transform = 'scale(1)';
            });
        });
        
        // Prevent double-tap zoom on buttons
        buttons.forEach(button => {
            button.addEventListener('touchend', function(e) {
                e.preventDefault();
                this.click();
            });
        });
    }

    setupThemeToggle() {
        const themeToggle = document.getElementById('theme-toggle');
        
        // Load saved theme preference or default to light
        const savedTheme = localStorage.getItem('theme') || 'light';
        this.setTheme(savedTheme);
        
        if (themeToggle) {
            themeToggle.addEventListener('click', () => {
                this.toggleTheme();
            });
        }
    }
    
    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        this.setTheme(newTheme);
    }
    
    setTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
        
        // Update main theme toggle icon
        const themeIcon = document.querySelector('#theme-toggle i');
        if (themeIcon) {
            if (theme === 'dark') {
                themeIcon.className = 'fas fa-sun';
            } else {
                themeIcon.className = 'fas fa-moon';
            }
        }
        
        // Update login page theme toggle icon
        const loginThemeIcon = document.querySelector('#theme-toggle-login i');
        if (loginThemeIcon) {
            if (theme === 'dark') {
                loginThemeIcon.className = 'fas fa-sun';
            } else {
                loginThemeIcon.className = 'fas fa-moon';
            }
        }
    }

    setupAlertModal() {
        const modal = this.alertModal;
        const closeBtn = modal.querySelector('.close');
        const okBtn = modal.querySelector('#alert-ok');

        closeBtn.addEventListener('click', () => this.hideAlert());
        okBtn.addEventListener('click', () => this.hideAlert());

        // Close modal when clicking outside
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.hideAlert();
            }
        });
    }

    showLoading() {
        this.loadingOverlay.classList.add('active');
    }

    hideLoading() {
        this.loadingOverlay.classList.remove('active');
    }

    showAlert(title, message, type = 'info') {
        const modal = this.alertModal;
        const titleElement = modal.querySelector('#alert-title');
        const messageElement = modal.querySelector('#alert-message');

        titleElement.textContent = title;
        messageElement.textContent = message;

        modal.classList.add('active');
    }

    hideAlert() {
        this.alertModal.classList.remove('active');
    }

    async apiRequest(endpoint, options = {}) {
        try {
            const url = `${this.apiBase}${endpoint}`;
            console.log('🔍 API Request Debug:', {
                endpoint: endpoint,
                apiBase: this.apiBase,
                fullUrl: url,
                options: options
            });
            
            const response = await fetch(url, {
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                },
                ...options
            });

            console.log('📡 API Response:', {
                url: url,
                status: response.status,
                statusText: response.statusText,
                headers: Object.fromEntries(response.headers.entries())
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log('✅ API Success:', { url, data });
            return data;
        } catch (error) {
            console.error('❌ API request failed:', { url: `${this.apiBase}${endpoint}`, error });
            throw error;
        }
    }

    async loadDashboard() {
        try {
            // Load dashboard statistics
            const statsResponse = await this.apiRequest('/dashboard/stats');
            if (statsResponse.success) {
                this.updateDashboardStats(statsResponse.data);
            }

            // Load recent activity
            const activityResponse = await this.apiRequest('/dashboard/recent-activity?limit=10');
            if (activityResponse.success) {
                this.updateRecentActivity(activityResponse.data);
            }

            // Load threat trends
            const trendsResponse = await this.apiRequest('/dashboard/threat-trends?days=7');
            if (trendsResponse.success) {
                this.updateThreatChart(trendsResponse.data);
            }

        } catch (error) {
            console.error('Failed to load dashboard:', error);
            this.showAlert('Error', 'Failed to load dashboard data');
        }
    }

    updateDashboardStats(stats) {
        document.getElementById('total-email-scans').textContent = stats.total_email_scans || 0;
        document.getElementById('total-file-scans').textContent = stats.total_file_scans || 0;
        document.getElementById('phishing-detected').textContent = stats.phishing_detected || 0;
        document.getElementById('malware-detected').textContent = stats.malware_detected || 0;
    }

    updateRecentActivity(activities) {
        const container = document.getElementById('recent-activity');
        
        if (!activities || activities.length === 0) {
            container.innerHTML = '<p class="no-results">No recent activity</p>';
            return;
        }

        const activityHTML = activities.map(activity => {
            const threatClass = activity.threat_detected ? 'high' : 'low';
            const threatText = activity.threat_detected ? 'THREAT' : 'CLEAN';
            const timeAgo = this.timeAgo(new Date(activity.timestamp));

            return `
                <div class="activity-item">
                    <div class="activity-details">
                        <div class="activity-type">${activity.scan_type.toUpperCase()} Scan</div>
                        <div class="activity-description">${activity.details}</div>
                    </div>
                    <div class="activity-meta">
                        <div class="threat-badge ${threatClass}">${threatText}</div>
                        <div class="activity-time">${timeAgo}</div>
                    </div>
                </div>
            `;
        }).join('');

        container.innerHTML = activityHTML;
    }

    updateThreatChart(trends) {
        const ctx = document.getElementById('threatChart');
        if (!ctx) return;

        const chartCtx = ctx.getContext('2d');
        
        // Destroy existing chart if it exists
        if (this.threatChart) {
            this.threatChart.destroy();
        }

        const labels = trends.map(trend => {
            const date = new Date(trend.date);
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        });

        this.threatChart = new Chart(chartCtx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Email Scans',
                        data: trends.map(t => t.email_scans),
                        borderColor: '#2563eb',
                        backgroundColor: 'rgba(37, 99, 235, 0.1)',
                        tension: 0.4
                    },
                    {
                        label: 'File Scans',
                        data: trends.map(t => t.file_scans),
                        borderColor: '#10b981',
                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                        tension: 0.4
                    },
                    {
                        label: 'Threats Detected',
                        data: trends.map(t => t.phishing_detected + t.malware_detected),
                        borderColor: '#ef4444',
                        backgroundColor: 'rgba(239, 68, 68, 0.1)',
                        tension: 0.4
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }

    async loadRecentEmailScans() {
        try {
            const response = await this.apiRequest('/email/recent?limit=20');
            if (response.success) {
                this.updateEmailScansTable(response.data);
            }
        } catch (error) {
            console.error('Failed to load recent email scans:', error);
        }
    }

    updateEmailScansTable(scans) {
        const container = document.getElementById('recent-email-scans');
        
        if (!scans || scans.length === 0) {
            container.innerHTML = '<p class="no-results">No recent email scans</p>';
            return;
        }

        const tableHTML = `
            <table>
                <thead>
                    <tr>
                        <th>Sender</th>
                        <th>Subject</th>
                        <th>Confidence</th>
                        <th>Status</th>
                        <th>Time</th>
                    </tr>
                </thead>
                <tbody>
                    ${scans.map(scan => {
                        const statusClass = scan.is_phishing ? 'threat' : 'clean';
                        const statusText = scan.is_phishing ? 'PHISHING' : 'CLEAN';
                        const confidenceClass = this.getConfidenceClass(scan.confidence_score);
                        
                        return `
                            <tr>
                                <td>${this.truncateText(scan.sender_email, 30)}</td>
                                <td>${this.truncateText(scan.subject, 40)}</td>
                                <td><span class="confidence-score ${confidenceClass}">${scan.confidence_score}%</span></td>
                                <td><span class="threat-badge ${statusClass}">${statusText}</span></td>
                                <td>${this.timeAgo(new Date(scan.scan_timestamp))}</td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        `;

        container.innerHTML = tableHTML;
    }

    async loadRecentFileScans() {
        try {
            const response = await this.apiRequest('/file/recent?limit=20');
            if (response.success) {
                this.updateFileScansTable(response.data);
            }
        } catch (error) {
            console.error('Failed to load recent file scans:', error);
        }
    }

    updateFileScansTable(scans) {
        const container = document.getElementById('recent-file-scans');
        
        if (!scans || scans.length === 0) {
            container.innerHTML = '<p class="no-results">No recent file scans</p>';
            return;
        }

        const tableHTML = `
            <table>
                <thead>
                    <tr>
                        <th>Filename</th>
                        <th>Size</th>
                        <th>Confidence</th>
                        <th>Status</th>
                        <th>Time</th>
                    </tr>
                </thead>
                <tbody>
                    ${scans.map(scan => {
                        const statusClass = scan.is_malware ? 'threat' : 'clean';
                        const statusText = scan.is_malware ? 'MALWARE' : 'CLEAN';
                        const confidenceClass = this.getConfidenceClass(scan.confidence_score);
                        
                        return `
                            <tr>
                                <td>${this.truncateText(scan.filename, 30)}</td>
                                <td>${this.formatFileSize(scan.file_size)}</td>
                                <td><span class="confidence-score ${confidenceClass}">${scan.confidence_score}%</span></td>
                                <td><span class="threat-badge ${statusClass}">${statusText}</span></td>
                                <td>${this.timeAgo(new Date(scan.scan_timestamp))}</td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        `;

        container.innerHTML = tableHTML;
    }

    async loadThreatIntelligence() {
        try {
            const response = await this.apiRequest('/dashboard/top-threats?limit=10');
            if (response.success) {
                this.updateTopThreats(response.data);
            }
        } catch (error) {
            console.error('Failed to load threat intelligence:', error);
        }
    }

    updateTopThreats(threats) {
        const container = document.getElementById('top-threats-list');
        
        if (!threats || threats.length === 0) {
            container.innerHTML = '<p class="no-results">No threat data available</p>';
            return;
        }

        const threatsHTML = threats.map(threat => `
            <div class="threat-item">
                <div class="threat-info">
                    <h4>${threat.description}</h4>
                    <p>Type: ${threat.type.toUpperCase()} | Severity: ${threat.severity.toUpperCase()}</p>
                </div>
                <div class="threat-count">${threat.count}</div>
            </div>
        `).join('');

        container.innerHTML = threatsHTML;
    }

    // Utility functions
    timeAgo(date) {
        // Always show "Just now" for all activities
        return 'Just now';
    }

    truncateText(text, maxLength) {
        if (!text) return '';
        return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    getConfidenceClass(score) {
        if (score >= 70) return 'high';
        if (score >= 40) return 'medium';
        return 'low';
    }

    getThreatLevelClass(level) {
        switch (level.toLowerCase()) {
            case 'critical': return 'high';
            case 'high': return 'high';
            case 'medium': return 'medium';
            case 'low': return 'low';
            default: return 'low';
        }
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.AXONApp = new AXONApp();
    
    // Additional event delegation for signup/login switches
    document.addEventListener('click', (e) => {
        if (e.target.id === 'showSignup') {
            console.log('Direct signup click detected');
            e.preventDefault();
            if (window.AXONApp) {
                window.AXONApp.showSignupForm();
            }
        }
        if (e.target.id === 'showLogin') {
            console.log('Direct login click detected');
            e.preventDefault();
            if (window.AXONApp) {
                window.AXONApp.showLoginForm();
            }
        }
    });
});
