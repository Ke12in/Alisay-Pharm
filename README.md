# Alisay Medical Center Webapp

A professional, multi-role clinic management web application for Alisay Medical Center. Built with HTML, Bootstrap, JavaScript, and Firebase (Firestore/Auth). Supports Admin, Doctor, Patient, and Sales dashboards with role-based navigation, smart appointment system, and full-featured CRUD capabilities.

## Features
- **Multi-role Dashboards:** Separate interfaces for Admin, Doctor, Patient, and Sales/Cashier
- **Role-based Navigation:** Custom sidebar/topbar for each role
- **User Management:** Add, edit, and manage users (Admin)
- **Appointment System:** Book, approve, and manage appointments
- **Product & Inventory Management:** Add, edit, and track products and stock (Sales)
- **Sales & Transactions:** Process and record sales, manage customers
- **Reports & Analytics:** View sales trends, top products, and export reports
- **Profile Management:** Edit profile, change password, view audit log
- **Notifications:** Low stock, expiry, and important alerts
- **Responsive Design:** Mobile-friendly, modern UI with dark mode
- **Firebase Integration:** Real-time data with Firestore and secure Auth

## Screenshots
*(Add screenshots here if desired)*

## Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (for Firebase CLI, optional)
- [Firebase Project](https://firebase.google.com/)

### Setup
1. **Clone the repository:**
   ```bash
   git clone https://github.com/Ke12in/Alisay-medical-center.git
   cd Alisay-medical-center
   ```
2. **Set up Firebase:**
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Create a new project (or use an existing one)
   - In Project Settings > General, add a new web app and copy the Firebase config
   - In your project, add your Firebase config to the main HTML files before any Firebase JS code:
     ```js
     var firebaseConfig = {
       apiKey: "YOUR_API_KEY",
       authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
       projectId: "YOUR_PROJECT_ID",
       storageBucket: "YOUR_PROJECT_ID.appspot.com",
       messagingSenderId: "YOUR_SENDER_ID",
       appId: "YOUR_APP_ID"
     };
     firebase.initializeApp(firebaseConfig);
     ```
   - Enable **Firestore** and **Authentication** (Email/Password) in the Firebase Console
3. **Install Firebase CLI (optional, for deployment):**
   ```bash
   npm install -g firebase-tools
   ```

## Running Locally
- Open `public/index.html` or any dashboard HTML file in your browser
- Make sure your Firebase config is set up as above

## Deployment (Firebase Hosting)
1. **Login to Firebase:**
   ```bash
   firebase login
   ```
2. **Initialize Firebase Hosting:**
   ```bash
   firebase init hosting
   # Set 'public' as the public directory
   # Configure as a single-page app if needed (y/n)
   ```
3. **Deploy:**
   ```bash
   firebase deploy
   ```

## Contributing
Pull requests are welcome! For major changes, please open an issue first to discuss what you would like to change.

## License
[MIT](LICENSE) *(or specify your license here)*

## Author
- **Alisay Medical Center**
- Project by Ke12in and contributors
- Contact: [GitHub](https://github.com/Ke12in/Alisay-medical-center) #   A l i s a y - P h a r m  
 