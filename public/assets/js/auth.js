document.addEventListener('DOMContentLoaded', function () {
  // Registration logic
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

// Admin dashboard: User Management
if (window.location.pathname.endsWith('dashboard-admin.html')) {
  document.addEventListener('DOMContentLoaded', function () {
    const usersTableBody = document.getElementById('users-table-body');
    const userSearch = document.getElementById('user-search');
    let allUsers = [];
    let currentEditUser = null;
    let currentDeleteUser = null;

    // Toast helpers
    function showToast(message, type = 'primary') {
      const toast = document.getElementById('admin-toast');
      const toastBody = document.getElementById('admin-toast-body');
      toast.className = `toast align-items-center text-bg-${type} border-0`;
      toastBody.textContent = message;
      const bsToast = new bootstrap.Toast(toast);
      bsToast.show();
    }

    // Fetch all users from Firestore
    function fetchUsers() {
      firebase.firestore().collection('users').get().then(snapshot => {
        allUsers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        renderUsers(allUsers);
      });
    }

    // Render users in the table
    function renderUsers(users) {
      usersTableBody.innerHTML = '';
      users.forEach(user => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${user.name || ''}</td>
          <td>${user.email || ''}</td>
          <td class="text-capitalize">${user.role || ''}</td>
          <td>
            <button class="btn btn-sm btn-outline-primary me-2 edit-user-btn" data-id="${user.id}" ${user.role === 'admin' ? 'disabled' : ''}>Edit</button>
            <button class="btn btn-sm btn-outline-danger delete-user-btn" data-id="${user.id}" ${user.role === 'admin' ? 'disabled' : ''}>Delete</button>
          </td>
        `;
        usersTableBody.appendChild(tr);
      });
      // Attach event listeners for edit/delete
      document.querySelectorAll('.edit-user-btn').forEach(btn => {
        btn.addEventListener('click', onEditUser);
      });
      document.querySelectorAll('.delete-user-btn').forEach(btn => {
        btn.addEventListener('click', onDeleteUser);
      });
    }

    // Search/filter users
    userSearch.addEventListener('input', function () {
      const q = userSearch.value.toLowerCase();
      const filtered = allUsers.filter(user =>
        (user.name && user.name.toLowerCase().includes(q)) ||
        (user.email && user.email.toLowerCase().includes(q)) ||
        (user.role && user.role.toLowerCase().includes(q))
      );
      renderUsers(filtered);
    });

    // Edit user logic
    function onEditUser(e) {
      const userId = e.target.getAttribute('data-id');
      const user = allUsers.find(u => u.id === userId);
      if (!user) return;
      currentEditUser = user;
      document.getElementById('edit-user-id').value = user.id;
      document.getElementById('edit-user-name').value = user.name || '';
      document.getElementById('edit-user-email').value = user.email || '';
      document.getElementById('edit-user-role').value = user.role || 'patient';
      const modal = new bootstrap.Modal(document.getElementById('editUserModal'));
      modal.show();
    }

    document.getElementById('edit-user-form').addEventListener('submit', async function (e) {
      e.preventDefault();
      const userId = document.getElementById('edit-user-id').value;
      const name = document.getElementById('edit-user-name').value;
      const role = document.getElementById('edit-user-role').value;
      try {
        await firebase.firestore().collection('users').doc(userId).update({ name, role });
        showToast('User updated successfully', 'success');
        fetchUsers();
        bootstrap.Modal.getInstance(document.getElementById('editUserModal')).hide();
      } catch (err) {
        showToast('Failed to update user', 'danger');
      }
    });

    // Delete user logic
    function onDeleteUser(e) {
      const userId = e.target.getAttribute('data-id');
      const user = allUsers.find(u => u.id === userId);
      if (!user) return;
      currentDeleteUser = user;
      document.getElementById('delete-user-info').textContent = `${user.name} (${user.email})`;
      const modal = new bootstrap.Modal(document.getElementById('deleteUserModal'));
      modal.show();
    }

    document.getElementById('confirm-delete-user').addEventListener('click', async function () {
      if (!currentDeleteUser) return;
      try {
        await firebase.firestore().collection('users').doc(currentDeleteUser.id).delete();
        showToast('User deleted successfully', 'success');
        fetchUsers();
        bootstrap.Modal.getInstance(document.getElementById('deleteUserModal')).hide();
      } catch (err) {
        showToast('Failed to delete user', 'danger');
      }
    });

    fetchUsers();
  });
}

// Admin dashboard: Services Management
if (window.location.pathname.endsWith('admin-services.html')) {
  document.addEventListener('DOMContentLoaded', function () {
    // Only run this code on the services page
    const addServiceBtn = document.getElementById('add-service-btn');
    if (addServiceBtn) {
      addServiceBtn.onclick = async function() {
        e.preventDefault();
        const name = document.getElementById('service-name').value.trim();
        const description = document.getElementById('service-description').value.trim();
        const price = parseFloat(document.getElementById('service-price').value);

        if (!name || !description || isNaN(price)) {
          alert('Please fill all fields correctly.');
          return;
        }

        console.log({ name, description, price }); // Debug

        try {
          await firebase.firestore().collection('services').add({
            name,
            description,
            price
          });
          showToast('Service added successfully', 'success');
          fetchServices();
          document.getElementById('add-service-form').reset();
          bootstrap.Modal.getInstance(document.getElementById('addServiceModal')).hide();
        } catch (error) {
          showToast('Failed to add service: ' + error.message, 'danger');
          console.error(error);
        }
      };
    }

    const servicesTableBody = document.getElementById('services-table-body');
    let allServices = [];
    let currentEditService = null;
    let currentDeleteService = null;

    // Toast helpers
    function showToast(message, type = 'primary') {
      const toast = document.getElementById('admin-toast');
      const toastBody = document.getElementById('admin-toast-body');
      toast.className = `toast align-items-center text-bg-${type} border-0`;
      toastBody.textContent = message;
      const bsToast = new bootstrap.Toast(toast);
      bsToast.show();
    }

    // Fetch all services from Firestore
    function fetchServices() {
      firebase.firestore().collection('services').get().then(snapshot => {
        allServices = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        renderServices(allServices);
      });
    }

    // Render services in the table
    function renderServices(services) {
      servicesTableBody.innerHTML = '';
      services.forEach(service => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${service.name || ''}</td>
          <td>${service.description || ''}</td>
          <td>${service.price !== undefined ? '₵' + Number(service.price).toFixed(2) : ''}</td>
          <td>
            <button class="btn btn-sm btn-outline-primary me-2 edit-service-btn" data-id="${service.id}">Edit</button>
            <button class="btn btn-sm btn-outline-danger delete-service-btn" data-id="${service.id}">Delete</button>
          </td>
        `;
        servicesTableBody.appendChild(tr);
      });
      // Attach event listeners for edit/delete
      document.querySelectorAll('.edit-service-btn').forEach(btn => {
        btn.addEventListener('click', onEditService);
      });
      document.querySelectorAll('.delete-service-btn').forEach(btn => {
        btn.addEventListener('click', onDeleteService);
      });
    }

    // Add service
    document.getElementById('add-service-form').addEventListener('submit', async function(e) {
      e.preventDefault();
      const name = document.getElementById('service-name').value.trim();
      const description = document.getElementById('service-description').value.trim();
      const price = parseFloat(document.getElementById('service-price').value);

      if (!name || !description || isNaN(price)) {
        alert('Please fill all fields correctly.');
        return;
      }

      console.log({ name, description, price }); // Debug

      try {
        await firebase.firestore().collection('services').add({
          name,
          description,
          price
        });
        showToast('Service added successfully', 'success');
        fetchServices();
        document.getElementById('add-service-form').reset();
        bootstrap.Modal.getInstance(document.getElementById('addServiceModal')).hide();
      } catch (error) {
        showToast('Failed to add service: ' + error.message, 'danger');
        console.error(error);
      }
    });

    // Edit service logic
    function onEditService(e) {
      const serviceId = e.target.getAttribute('data-id');
      const service = allServices.find(s => s.id === serviceId);
      if (!service) return;
      currentEditService = service;
      document.getElementById('edit-service-id').value = service.id;
      document.getElementById('edit-service-name').value = service.name || '';
      document.getElementById('edit-service-description').value = service.description || '';
      document.getElementById('edit-service-price').value = service.price !== undefined ? service.price : '';
      const modal = new bootstrap.Modal(document.getElementById('editServiceModal'));
      modal.show();
    }

    document.getElementById('edit-service-form').addEventListener('submit', async function (e) {
      e.preventDefault();
      const serviceId = document.getElementById('edit-service-id').value;
      const name = document.getElementById('edit-service-name').value;
      const description = document.getElementById('edit-service-description').value;
      const price = parseFloat(document.getElementById('edit-service-price').value);
      try {
        await firebase.firestore().collection('services').doc(serviceId).update({ name, description, price });
        showToast('Service updated successfully', 'success');
        fetchServices();
        bootstrap.Modal.getInstance(document.getElementById('editServiceModal')).hide();
      } catch (err) {
        showToast('Failed to update service', 'danger');
      }
    });

    // Delete service logic
    function onDeleteService(e) {
      const serviceId = e.target.getAttribute('data-id');
      const service = allServices.find(s => s.id === serviceId);
      if (!service) return;
      currentDeleteService = service;
      document.getElementById('delete-service-info').textContent = `${service.name}`;
      const modal = new bootstrap.Modal(document.getElementById('deleteServiceModal'));
      modal.show();
    }

    document.getElementById('confirm-delete-service').addEventListener('click', async function () {
      if (!currentDeleteService) return;
      try {
        await firebase.firestore().collection('services').doc(currentDeleteService.id).delete();
        showToast('Service deleted successfully', 'success');
        fetchServices();
        bootstrap.Modal.getInstance(document.getElementById('deleteServiceModal')).hide();
      } catch (err) {
        showToast('Failed to delete service', 'danger');
      }
    });

    fetchServices();
  });
}

// Admin dashboard: Products Management
if (window.location.pathname.endsWith('admin-products.html')) {
  document.addEventListener('DOMContentLoaded', function () {
    const productsTableBody = document.getElementById('products-table-body');
    let allProducts = [];
    let currentEditProduct = null;
    let currentDeleteProduct = null;

    // Toast helpers
    function showToast(message, type = 'primary') {
      const toast = document.getElementById('admin-toast');
      const toastBody = document.getElementById('admin-toast-body');
      toast.className = `toast align-items-center text-bg-${type} border-0`;
      toastBody.textContent = message;
      const bsToast = new bootstrap.Toast(toast);
      bsToast.show();
    }

    // Fetch all products from Firestore
    function fetchProducts() {
      firebase.firestore().collection('products').get().then(snapshot => {
        allProducts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        renderProducts(allProducts);
      });
    }

    // Render products in the table
    function renderProducts(products) {
      productsTableBody.innerHTML = '';
      products.forEach(product => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${product.name || ''}</td>
          <td>${product.category || ''}</td>
          <td>${product.price !== undefined ? '₦' + Number(product.price).toFixed(2) : ''}</td>
          <td>${product.stock !== undefined ? product.stock : ''}</td>
          <td>
            <button class="btn btn-sm btn-outline-primary me-2 edit-product-btn" data-id="${product.id}">Edit</button>
            <button class="btn btn-sm btn-outline-danger delete-product-btn" data-id="${product.id}">Delete</button>
          </td>
        `;
        productsTableBody.appendChild(tr);
      });
      // Attach event listeners for edit/delete
      document.querySelectorAll('.edit-product-btn').forEach(btn => {
        btn.addEventListener('click', onEditProduct);
      });
      document.querySelectorAll('.delete-product-btn').forEach(btn => {
        btn.addEventListener('click', onDeleteProduct);
      });
    }

    // Add product
    document.getElementById('add-product-form').addEventListener('submit', async function (e) {
      e.preventDefault();
      const name = document.getElementById('product-name').value;
      const category = document.getElementById('product-category').value;
      const price = parseFloat(document.getElementById('product-price').value);
      const stock = parseInt(document.getElementById('product-stock').value);
      try {
        await firebase.firestore().collection('products').add({ name, category, price, stock });
        showToast('Product added successfully', 'success');
        fetchProducts();
        document.getElementById('add-product-form').reset();
        bootstrap.Modal.getInstance(document.getElementById('addProductModal')).hide();
      } catch (err) {
        showToast('Failed to add product', 'danger');
      }
    });

    // Edit product logic
    function onEditProduct(e) {
      const productId = e.target.getAttribute('data-id');
      const product = allProducts.find(p => p.id === productId);
      if (!product) return;
      currentEditProduct = product;
      document.getElementById('edit-product-id').value = product.id;
      document.getElementById('edit-product-name').value = product.name || '';
      document.getElementById('edit-product-category').value = product.category || '';
      document.getElementById('edit-product-price').value = product.price !== undefined ? product.price : '';
      document.getElementById('edit-product-stock').value = product.stock !== undefined ? product.stock : '';
      const modal = new bootstrap.Modal(document.getElementById('editProductModal'));
      modal.show();
    }

    document.getElementById('edit-product-form').addEventListener('submit', async function (e) {
      e.preventDefault();
      const productId = document.getElementById('edit-product-id').value;
      const name = document.getElementById('edit-product-name').value;
      const category = document.getElementById('edit-product-category').value;
      const price = parseFloat(document.getElementById('edit-product-price').value);
      const stock = parseInt(document.getElementById('edit-product-stock').value);
      try {
        await firebase.firestore().collection('products').doc(productId).update({ name, category, price, stock });
        showToast('Product updated successfully', 'success');
        fetchProducts();
        bootstrap.Modal.getInstance(document.getElementById('editProductModal')).hide();
      } catch (err) {
        showToast('Failed to update product', 'danger');
      }
    });

    // Delete product logic
    function onDeleteProduct(e) {
      const productId = e.target.getAttribute('data-id');
      const product = allProducts.find(p => p.id === productId);
      if (!product) return;
      currentDeleteProduct = product;
      document.getElementById('delete-product-info').textContent = `${product.name}`;
      const modal = new bootstrap.Modal(document.getElementById('deleteProductModal'));
      modal.show();
    }

    document.getElementById('confirm-delete-product').addEventListener('click', async function () {
      if (!currentDeleteProduct) return;
      try {
        await firebase.firestore().collection('products').doc(currentDeleteProduct.id).delete();
        showToast('Product deleted successfully', 'success');
        fetchProducts();
        bootstrap.Modal.getInstance(document.getElementById('deleteProductModal')).hide();
      } catch (err) {
        showToast('Failed to delete product', 'danger');
      }
    });

    fetchProducts();
  });
}

// Admin dashboard: Appointments Management
if (window.location.pathname.endsWith('admin-appointments.html')) {
  document.addEventListener('DOMContentLoaded', function () {
    const appointmentsTableBody = document.getElementById('appointments-table-body');
    let allAppointments = [];
    let currentEditAppointment = null;
    let currentDeleteAppointment = null;

    // Toast helpers
    function showToast(message, type = 'primary') {
      const toast = document.getElementById('admin-toast');
      const toastBody = document.getElementById('admin-toast-body');
      toast.className = `toast align-items-center text-bg-${type} border-0`;
      toastBody.textContent = message;
      const bsToast = new bootstrap.Toast(toast);
      bsToast.show();
    }

    // Fetch all appointments from Firestore
    function fetchAppointments() {
      firebase.firestore().collection('appointments').get().then(snapshot => {
        allAppointments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        renderAppointments(allAppointments);
      });
    }

    // Render appointments in the table
    function renderAppointments(appointments) {
      appointmentsTableBody.innerHTML = '';
      appointments.forEach(appointment => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${appointment.patient || ''}</td>
          <td>${appointment.doctor || ''}</td>
          <td>${appointment.date ? new Date(appointment.date).toLocaleString() : ''}</td>
          <td class="text-capitalize">${appointment.status || ''}</td>
          <td>
            <button class="btn btn-sm btn-outline-primary me-2 edit-appointment-btn" data-id="${appointment.id}">Edit</button>
            <button class="btn btn-sm btn-outline-danger delete-appointment-btn" data-id="${appointment.id}">Delete</button>
          </td>
        `;
        appointmentsTableBody.appendChild(tr);
      });
      // Attach event listeners for edit/delete
      document.querySelectorAll('.edit-appointment-btn').forEach(btn => {
        btn.addEventListener('click', onEditAppointment);
      });
      document.querySelectorAll('.delete-appointment-btn').forEach(btn => {
        btn.addEventListener('click', onDeleteAppointment);
      });
    }

    // Add appointment
    document.getElementById('add-appointment-form').addEventListener('submit', async function (e) {
      e.preventDefault();
      const patient = document.getElementById('appointment-patient').value;
      const doctor = document.getElementById('appointment-doctor').value;
      const date = document.getElementById('appointment-date').value;
      const status = document.getElementById('appointment-status').value;
      try {
        await firebase.firestore().collection('appointments').add({ patient, doctor, date, status });
        showToast('Appointment added successfully', 'success');
        fetchAppointments();
        document.getElementById('add-appointment-form').reset();
        bootstrap.Modal.getInstance(document.getElementById('addAppointmentModal')).hide();
      } catch (err) {
        showToast('Failed to add appointment', 'danger');
      }
    });

    // Edit appointment logic
    function onEditAppointment(e) {
      const appointmentId = e.target.getAttribute('data-id');
      const appointment = allAppointments.find(a => a.id === appointmentId);
      if (!appointment) return;
      currentEditAppointment = appointment;
      document.getElementById('edit-appointment-id').value = appointment.id;
      document.getElementById('edit-appointment-patient').value = appointment.patient || '';
      document.getElementById('edit-appointment-doctor').value = appointment.doctor || '';
      document.getElementById('edit-appointment-date').value = appointment.date || '';
      document.getElementById('edit-appointment-status').value = appointment.status || 'scheduled';
      const modal = new bootstrap.Modal(document.getElementById('editAppointmentModal'));
      modal.show();
    }

    document.getElementById('edit-appointment-form').addEventListener('submit', async function (e) {
      e.preventDefault();
      const appointmentId = document.getElementById('edit-appointment-id').value;
      const patient = document.getElementById('edit-appointment-patient').value;
      const doctor = document.getElementById('edit-appointment-doctor').value;
      const date = document.getElementById('edit-appointment-date').value;
      const status = document.getElementById('edit-appointment-status').value;
      try {
        await firebase.firestore().collection('appointments').doc(appointmentId).update({ patient, doctor, date, status });
        showToast('Appointment updated successfully', 'success');
        fetchAppointments();
        bootstrap.Modal.getInstance(document.getElementById('editAppointmentModal')).hide();
      } catch (err) {
        showToast('Failed to update appointment', 'danger');
      }
    });

    // Delete appointment logic
    function onDeleteAppointment(e) {
      const appointmentId = e.target.getAttribute('data-id');
      const appointment = allAppointments.find(a => a.id === appointmentId);
      if (!appointment) return;
      currentDeleteAppointment = appointment;
      document.getElementById('delete-appointment-info').textContent = `${appointment.patient} with ${appointment.doctor}`;
      const modal = new bootstrap.Modal(document.getElementById('deleteAppointmentModal'));
      modal.show();
    }

    document.getElementById('confirm-delete-appointment').addEventListener('click', async function () {
      if (!currentDeleteAppointment) return;
      try {
        await firebase.firestore().collection('appointments').doc(currentDeleteAppointment.id).delete();
        showToast('Appointment deleted successfully', 'success');
        fetchAppointments();
        bootstrap.Modal.getInstance(document.getElementById('deleteAppointmentModal')).hide();
      } catch (err) {
        showToast('Failed to delete appointment', 'danger');
      }
    });

    fetchAppointments();
  });
}

// Admin dashboard: Prescriptions Management
if (window.location.pathname.endsWith('admin-prescriptions.html')) {
  document.addEventListener('DOMContentLoaded', function () {
    const prescriptionsTableBody = document.getElementById('prescriptions-table-body');
    let allPrescriptions = [];
    let currentViewPrescription = null;
    let currentDeletePrescription = null;

    // Toast helpers
    function showToast(message, type = 'primary') {
      const toast = document.getElementById('admin-toast');
      const toastBody = document.getElementById('admin-toast-body');
      toast.className = `toast align-items-center text-bg-${type} border-0`;
      toastBody.textContent = message;
      const bsToast = new bootstrap.Toast(toast);
      bsToast.show();
    }

    // Fetch all prescriptions from Firestore
    function fetchPrescriptions() {
      firebase.firestore().collection('prescriptions').get().then(snapshot => {
        allPrescriptions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        renderPrescriptions(allPrescriptions);
      });
    }

    // Render prescriptions in the table
    function renderPrescriptions(prescriptions) {
      prescriptionsTableBody.innerHTML = '';
      prescriptions.forEach(prescription => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${prescription.patient || ''}</td>
          <td>${prescription.doctor || ''}</td>
          <td>${prescription.date ? new Date(prescription.date).toLocaleString() : ''}</td>
          <td class="text-capitalize">${prescription.status || ''}</td>
          <td>
            <button class="btn btn-sm btn-outline-info me-2 view-prescription-btn" data-id="${prescription.id}">View</button>
            <button class="btn btn-sm btn-outline-danger delete-prescription-btn" data-id="${prescription.id}">Delete</button>
          </td>
        `;
        prescriptionsTableBody.appendChild(tr);
      });
      // Attach event listeners for view/delete
      document.querySelectorAll('.view-prescription-btn').forEach(btn => {
        btn.addEventListener('click', onViewPrescription);
      });
      document.querySelectorAll('.delete-prescription-btn').forEach(btn => {
        btn.addEventListener('click', onDeletePrescription);
      });
    }

    // Add prescription
    document.getElementById('add-prescription-form').addEventListener('submit', async function (e) {
      e.preventDefault();
      const patient = document.getElementById('prescription-patient').value;
      const doctor = document.getElementById('prescription-doctor').value;
      const date = document.getElementById('prescription-date').value;
      const status = document.getElementById('prescription-status').value;
      try {
        await firebase.firestore().collection('prescriptions').add({ patient, doctor, date, status });
        showToast('Prescription added successfully', 'success');
        fetchPrescriptions();
        document.getElementById('add-prescription-form').reset();
        bootstrap.Modal.getInstance(document.getElementById('addPrescriptionModal')).hide();
      } catch (err) {
        showToast('Failed to add prescription', 'danger');
      }
    });

    // View prescription logic
    function onViewPrescription(e) {
      const prescriptionId = e.target.getAttribute('data-id');
      const prescription = allPrescriptions.find(p => p.id === prescriptionId);
      if (!prescription) return;
      currentViewPrescription = prescription;
      document.getElementById('view-prescription-body').innerHTML = `
        <div><strong>Patient:</strong> ${prescription.patient || ''}</div>
        <div><strong>Doctor:</strong> ${prescription.doctor || ''}</div>
        <div><strong>Date:</strong> ${prescription.date ? new Date(prescription.date).toLocaleString() : ''}</div>
        <div><strong>Status:</strong> ${prescription.status || ''}</div>
      `;
      const modal = new bootstrap.Modal(document.getElementById('viewPrescriptionModal'));
      modal.show();
    }

    // Delete prescription logic
    function onDeletePrescription(e) {
      const prescriptionId = e.target.getAttribute('data-id');
      const prescription = allPrescriptions.find(p => p.id === prescriptionId);
      if (!prescription) return;
      currentDeletePrescription = prescription;
      document.getElementById('delete-prescription-info').textContent = `${prescription.patient} (${prescription.doctor})`;
      const modal = new bootstrap.Modal(document.getElementById('deletePrescriptionModal'));
      modal.show();
    }

    document.getElementById('confirm-delete-prescription').addEventListener('click', async function () {
      if (!currentDeletePrescription) return;
      try {
        await firebase.firestore().collection('prescriptions').doc(currentDeletePrescription.id).delete();
        showToast('Prescription deleted successfully', 'success');
        fetchPrescriptions();
        bootstrap.Modal.getInstance(document.getElementById('deletePrescriptionModal')).hide();
      } catch (err) {
        showToast('Failed to delete prescription', 'danger');
      }
    });

    fetchPrescriptions();
  });
}

// Admin dashboard: Reports/Analytics
if (window.location.pathname.endsWith('admin-reports.html')) {
  document.addEventListener('DOMContentLoaded', function () {
    // Fetch and display total users
    firebase.firestore().collection('users').get().then(snapshot => {
      document.getElementById('total-users').textContent = snapshot.size;
    });
    // Fetch and display total appointments
    firebase.firestore().collection('appointments').get().then(snapshot => {
      document.getElementById('total-appointments').textContent = snapshot.size;
    });
    // Fetch and display total products
    firebase.firestore().collection('products').get().then(snapshot => {
      document.getElementById('total-products').textContent = snapshot.size;
    });
    // Fetch and display total services
    firebase.firestore().collection('services').get().then(snapshot => {
      document.getElementById('total-services').textContent = snapshot.size;
    });
    // (Optional) Fetch and display recent activity, sales, etc.
  });
}

// Admin dashboard: Admin Profile
if (window.location.pathname.endsWith('admin-profile.html')) {
  document.addEventListener('DOMContentLoaded', function () {
    let currentUserId = null;
    let currentProfileData = {};
    let currentUserObj = null;
    // Helper: Toast
    function showProfileToast(message, type = 'primary') {
      const toast = document.getElementById('admin-toast');
      const toastBody = document.getElementById('admin-toast-body');
      toast.className = 'toast align-items-center text-bg-' + type + ' border-0';
      toastBody.textContent = message;
      const bsToast = new bootstrap.Toast(toast);
      bsToast.show();
    }
    // Helper: Audit log
    async function logAudit(action, field, oldValue, newValue) {
      if (!currentUserId) return;
      await firebase.firestore().collection('users').doc(currentUserId)
        .collection('auditLogs').add({
          action,
          field,
          oldValue,
          newValue,
          timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });
      fetchAuditLog();
    }
    // Fetch and render audit log
    async function fetchAuditLog() {
      if (!currentUserId) return;
      const tbody = document.getElementById('audit-log-table-body');
      tbody.innerHTML = '<tr><td colspan="5">Loading...</td></tr>';
      const snapshot = await firebase.firestore().collection('users').doc(currentUserId)
        .collection('auditLogs').orderBy('timestamp', 'desc').limit(20).get();
      tbody.innerHTML = '';
      snapshot.forEach(doc => {
        const log = doc.data();
        const date = log.timestamp && log.timestamp.toDate ? log.timestamp.toDate().toLocaleString() : '';
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>${date}</td><td>${log.action}</td><td>${log.field}</td><td>${log.oldValue}</td><td>${log.newValue}</td>`;
        tbody.appendChild(tr);
      });
      if (tbody.innerHTML === '') {
        tbody.innerHTML = '<tr><td colspan="5">No audit log entries.</td></tr>';
      }
    }
    // Helper: Set topbar profile image and name
    function setTopbarProfileImage(url, isDefault = false) {
      const img = document.getElementById('topbar-profile-img');
      const icon = document.getElementById('topbar-profile-icon');
      if (img && icon) {
        if (url && !isDefault) {
          img.src = url;
          img.style.display = 'inline-block';
          icon.style.display = 'none';
        } else {
          img.src = '';
          img.style.display = 'none';
          icon.style.display = 'inline-block';
        }
      }
    }
    // Helper: Set topbar name
    function setTopbarName(name) {
      const nameSpan = document.getElementById('admin-name');
      if (nameSpan) nameSpan.textContent = name || 'Admin';
    }
    // Update topbar on profile load
    function updateTopbarOnProfileLoad(data) {
      if (data.profilePictureUrl) {
        setTopbarProfileImage(data.profilePictureUrl, false);
      } else {
        setTopbarProfileImage('', true);
      }
      setTopbarName(data.name);
    }
    // Call updateTopbarOnProfileLoad after fetching profile
    firebase.auth().onAuthStateChanged(async function(user) {
      if (user) {
        currentUserId = user.uid;
        currentUserObj = user;
        document.getElementById('profile-last-login').value = user.metadata.lastSignInTime || '';
        const userDoc = await firebase.firestore().collection('users').doc(user.uid).get();
        if (userDoc.exists && userDoc.data().role === 'admin') {
          const data = userDoc.data();
          currentProfileData = data;
          document.getElementById('profile-name').value = data.name || 'Admin';
          document.getElementById('profile-email').value = data.email || user.email;
          if (data.profilePictureUrl) {
            document.getElementById('profile-picture-preview').src = data.profilePictureUrl;
          } else {
            const defaultAvatar = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(data.name || 'Admin');
            document.getElementById('profile-picture-preview').src = defaultAvatar;
          }
          updateTopbarOnProfileLoad(data);
        }
        fetchAuditLog();
      }
    });
    // Robust event listeners for buttons
    function attachProfileEventListeners() {
      // Save profile changes (name/email)
      const saveBtn = document.getElementById('save-profile-btn');
      if (saveBtn) {
        saveBtn.onclick = async function() {
          if (!currentUserId) return;
          const nameInput = document.getElementById('profile-name');
          const emailInput = document.getElementById('profile-email');
          const newName = nameInput.value.trim();
          const newEmail = emailInput.value.trim();
          let updates = {};
          let auditPromises = [];
          // Name change
          if (newName && newName !== currentProfileData.name) {
            updates.name = newName;
            auditPromises.push(logAudit('update', 'name', currentProfileData.name || '', newName));
          }
          // Email change
          if (newEmail && newEmail !== currentProfileData.email) {
            updates.email = newEmail;
            auditPromises.push(logAudit('update', 'email', currentProfileData.email || '', newEmail));
          }
          try {
            if (Object.keys(updates).length > 0) {
              await firebase.firestore().collection('users').doc(currentUserId).update(updates);
              // If email changed, update in Auth too
              if (updates.email && currentUserObj) {
                await currentUserObj.updateEmail(updates.email);
              }
              showProfileToast('Profile updated!', 'success');
              // Update currentProfileData
              currentProfileData = { ...currentProfileData, ...updates };
              // Update topbar name if changed
              if (updates.name) {
                document.getElementById('admin-name').textContent = updates.name;
              }
              await Promise.all(auditPromises);
            } else {
              showProfileToast('No changes to save.', 'info');
            }
          } catch (err) {
            showProfileToast('Failed to update profile: ' + err.message, 'danger');
          }
        };
      }
    }
    // Attach listeners on DOMContentLoaded and after any dynamic DOM update
    attachProfileEventListeners();
    // Change password
    document.getElementById('change-password-form').addEventListener('submit', async function (e) {
      e.preventDefault();
      const newPassword = document.getElementById('profile-password').value;
      const user = firebase.auth().currentUser;
      if (user) {
        try {
          await user.updatePassword(newPassword);
          document.getElementById('change-password-form').reset();
          showProfileToast('Password changed successfully!', 'success');
          // Audit log
          await logAudit('update', 'password', '', 'Changed');
        } catch (err) {
          showProfileToast('Failed to change password: ' + err.message, 'danger');
        }
      }
    });
  });
} 