document.addEventListener('DOMContentLoaded', function () {
  // Registration logic (already present)
  const registerForm = document.getElementById('register-form');
  if (registerForm) {
    registerForm.addEventListener('submit', async function (e) {
      e.preventDefault();
      const name = document.getElementById('name').value;
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;
      const role = document.getElementById('role').value;
      try {
        // Create user with email and password
        const userCredential = await firebase.auth().createUserWithEmailAndPassword(email, password);
        const user = userCredential.user;
        // Save additional user info in Firestore
        await firebase.firestore().collection('users').doc(user.uid).set({
          name: name,
          email: email,
          role: role,
          createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        if (window.showRegisterSuccess) {
          window.showRegisterSuccess('Registration successful! You can now log in.');
        }
        setTimeout(() => {
          window.location.href = 'login.html';
        }, 1500);
      } catch (error) {
        if (window.showRegisterError) {
          window.showRegisterError('Registration failed: ' + error.message);
        }
      }
    });
  }

  // Login logic
  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', async function (e) {
      e.preventDefault();
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;
      try {
        // Sign in with Firebase Auth
        const userCredential = await firebase.auth().signInWithEmailAndPassword(email, password);
        const user = userCredential.user;
        // Fetch user role from Firestore
        const userDoc = await firebase.firestore().collection('users').doc(user.uid).get();
        if (!userDoc.exists) {
          throw new Error('User profile not found.');
        }
        const userData = userDoc.data();
        const role = userData.role;
        if (window.showLoginSuccess) {
          window.showLoginSuccess('Login successful! Redirecting...');
        }
        // Redirect based on role
        setTimeout(() => {
          if (role === 'patient') {
            window.location.href = 'dashboard-patient.html';
          } else if (role === 'doctor') {
            window.location.href = 'dashboard-doctor.html';
          } else if (role === 'sales') {
            window.location.href = 'dashboard-sales.html';
          } else if (role === 'admin') {
            window.location.href = 'dashboard-admin.html';
          } else {
            window.location.href = 'dashboard.html';
          }
        }, 1200);
      } catch (error) {
        if (window.showLoginError) {
          window.showLoginError('Login failed: ' + error.message);
        }
      }
    });
  }
}); 