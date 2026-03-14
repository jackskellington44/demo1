// ============================================
// PFP CONFIGURATION
// ============================================

const PFP_LIST = [
    'pfp1.jpg', 'pfp2.jpg', 'pfp3.jpg', 'pfp4.jpg', 'pfp5.jpg',
    'pfp6.jpg', 'pfp7.jpg', 'pfp8.jpg', 'pfp9.jpg', 'pfp10.jpg',
    'pfp11.jpg', 'pfp12.jpg', 'pfp13.jpg', 'pfp14.jpg', 'pfp15.jpg',
    'pfp16.jpg', 'pfp17.jpg', 'pfp18.jpg', 'pfp19.jpg'
];

function loadPFPGrid() {
    const pfpGrid = document.getElementById('pfpGrid');
    
    // Load all PFP images
    PFP_LIST.forEach(pfp => {
        const container = document.createElement('div');
        container.className = 'pfp-container';
        container.dataset.pfp = pfp;
        
        const img = document.createElement('img');
        img.src = `./images/pfps/${pfp}`;
        img.alt = pfp;
        
        container.appendChild(img);
        pfpGrid.appendChild(container);
    });
    
    // Add upload button as 20th item
    const uploadContainer = document.createElement('div');
    uploadContainer.className = 'upload-pfp-container';
    uploadContainer.id = 'uploadPFPButton';
    uploadContainer.innerHTML = '<span>+</span>';
    
    pfpGrid.appendChild(uploadContainer);
    
    console.log(`✓ Loaded ${PFP_LIST.length} PFP options + upload button`);
}

// ============================================
// DOM ELEMENT REFERENCES
// ============================================

const mainContainer = document.getElementById('mainContainer');
const loginToggle = document.getElementById('loginToggle');
const signupToggle = document.getElementById('signupToggle');
const loginInputs = document.getElementById('loginInputs');
const signupInputs = document.getElementById('signupInputs');
const pfpSelection = document.getElementById('pfpSelection');
const pfpUpload = document.getElementById('pfpUpload');

const loginUsername = document.getElementById('loginUsername');
const loginPassword = document.getElementById('loginPassword');
const signupUsername = document.getElementById('signupUsername');
const signupPassword = document.getElementById('signupPassword');

let pfpContainers; // Will be set after PFPs load
let uploadPFPButton; // Will be set after PFPs load

// ============================================
// STATE VARIABLES
// ============================================

let selectedPFP = null;
let uploadedPFP = null;

// ============================================
// 1. VIEW MANAGEMENT
// ============================================

function setActiveView(view) {
    if (view === 'login') {
        loginToggle.classList.add('active');
        signupToggle.classList.remove('active');
        loginInputs.style.display = 'flex';
        signupInputs.style.display = 'none';
        pfpSelection.style.display = 'none';
    } else {
        signupToggle.classList.add('active');
        loginToggle.classList.remove('active');
        loginInputs.style.display = 'none';
        signupInputs.style.display = 'flex';
        pfpSelection.style.display = 'flex';
    }
}

function initializeViews() {
    loginToggle.addEventListener('click', () => setActiveView('login'));
    signupToggle.addEventListener('click', () => setActiveView('signup'));
    setActiveView('login');
}

// ============================================
// 2. PFP SELECTION
// ============================================

function initializePFPSelection() {
    pfpContainers = document.querySelectorAll('.pfp-container');
    uploadPFPButton = document.getElementById('uploadPFPButton');
    
    pfpContainers.forEach(container => {
        container.addEventListener('click', function() {
            // Deselect all
            pfpContainers.forEach(p => p.classList.remove('selected'));
            uploadPFPButton.classList.remove('selected');
            
            // Select clicked PFP
            this.classList.add('selected');
            selectedPFP = this.dataset.pfp;
            uploadedPFP = null;
            
            console.log('Selected PFP:', selectedPFP);
        });
    });
    
    console.log('✓ PFP selection initialized');
}

function initializePFPUpload() {
    uploadPFPButton = document.getElementById('uploadPFPButton');
    
    uploadPFPButton.addEventListener('click', () => {
        pfpUpload.click();
    });

    pfpUpload.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                // Deselect all PFPs
                pfpContainers.forEach(p => p.classList.remove('selected'));
                
                // Mark upload as selected
                uploadPFPButton.classList.add('selected');
                uploadPFPButton.innerHTML = '<span>✓</span>';
                
                selectedPFP = null;
                uploadedPFP = event.target.result;
                
                console.log('Uploaded PFP');
            };
            reader.readAsDataURL(file);
        }
    });
    
    console.log('✓ PFP upload initialized');
}

// ============================================
// 3. FORM VALIDATION
// ============================================

function validateLoginForm() {
    const username = loginUsername.value.trim();
    const password = loginPassword.value;

    if (!username) {
        alert('Please enter a username');
        return false;
    }
    if (!password) {
        alert('Please enter a password');
        return false;
    }
    return true;
}

function validateSignupForm() {
    const username = signupUsername.value.trim();
    const password = signupPassword.value;

    if (!username) {
        alert('Please enter a username');
        return false;
    }
    if (!password) {
        alert('Please enter a password');
        return false;
    }
    if (password.length < 6) {
        alert('Password must be at least 6 characters');
        return false;
    }
    if (!selectedPFP && !uploadedPFP) {
        alert('Please select or upload a profile picture');
        return false;
    }
    return true;
}

// ============================================
// 4. FORM SUBMISSION
// ============================================

function handleLogin() {
    if (!validateLoginForm()) return;

    const username = loginUsername.value.trim();
    const password = loginPassword.value;

    console.log('Login attempt:', { username, password });
    alert(`Login attempt for user: ${username}`);
    
    // TODO: Connect to Firebase Auth
}

function handleSignup() {
    if (!validateSignupForm()) return;

    const username = signupUsername.value.trim();
    const password = signupPassword.value;
    const pfp = selectedPFP || 'uploaded';

    console.log('Signup attempt:', { username, password, pfp });
    alert(`Signup successful for: ${username}! (demo mode)`);
    
    // TODO: Connect to Firebase Auth + Storage
}

function handleEnterKey(e) {
    if (e.key !== 'Enter') return;
    e.preventDefault();

    if (loginToggle.classList.contains('active')) {
        handleLogin();
    } else {
        handleSignup();
    }
}

function initializeFormSubmission() {
    document.querySelectorAll('input').forEach(input => {
        input.addEventListener('keypress', handleEnterKey);
    });
    
    console.log('✓ Form submission initialized');
}

// ============================================
// 5. INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    console.log('✓ DOM loaded');
    
    loadPFPGrid();
    initializeViews();
    initializePFPSelection();
    initializePFPUpload();
    initializeFormSubmission();
    
    console.log('✓ All systems initialized');
});