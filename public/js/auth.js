let currentUser = null;
let token = localStorage.getItem('token');

function showSection(sectionName) {
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });
    document.getElementById(sectionName).classList.add('active');
}

function showLoginSection() {
    showSection('loginSection');
    document.querySelector('.navbar').style.display = 'none';
}

function showAppSection() {
    document.querySelector('.navbar').style.display = 'flex';
    showSection('dashboard');
    loadDashboard();
}

function checkAuth() {
    if (token) {
        // Verify token is still valid
        fetch('/api/auth/profile', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })
        .then(response => {
            if (response.ok) {
                return response.json();
            }
            throw new Error('Not authenticated');
        })
        .then(data => {
            currentUser = data.user;
            showAppSection();
        })
        .catch(error => {
            localStorage.removeItem('token');
            token = null;
            showLoginSection();
        });
    } else {
        showLoginSection();
    }
}

document.getElementById('loginForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const messageDiv = document.getElementById('loginMessage');

    fetch('/api/auth/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
    })
    .then(response => response.json())
    .then(data => {
        if (data.token) {
            token = data.token;
            localStorage.setItem('token', token);
            currentUser = data.user;
            showAppSection();
        } else {
            messageDiv.textContent = data.error || 'Login failed';
            messageDiv.className = 'message error';
        }
    })
    .catch(error => {
        messageDiv.textContent = 'Login failed. Please try again.';
        messageDiv.className = 'message error';
    });
});

function logout() {
    localStorage.removeItem('token');
    token = null;
    currentUser = null;
    showLoginSection();
}

// Initialize app
checkAuth();