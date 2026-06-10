require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/db');

// --- Route imports ---
const authRoutes = require('./routes/auth');
const goalRoutes = require('./routes/goals');
const budgetRoutes = require('./routes/budget');
const riskRoutes = require('./routes/risk');
const roiRoutes = require('./routes/roi');
const dashboardRoutes = require('./routes/dashboard');

const app = express();

// Connect to MongoDB. If connection fails, continue running the server in
// frontend-only mode so static pages can be served during local development.
let dbConnected = false;
(async () => { dbConnected = await connectDB(); })();

// --- Middleware ---
app.use(cors());            // allow the frontend to call this API
app.use(express.json());    // parse JSON request bodies

// --- API routes ---
app.use('/api/auth', authRoutes);
app.use('/api/goals', goalRoutes);
app.use('/api/budget', budgetRoutes);
app.use('/api/risk', riskRoutes);
app.use('/api/roi', roiRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Simple health-check endpoint.
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'FinGuru API is running' });
});

// --- Serve the frontend ---
// The whole frontend folder is served as static files, so the entire
// app runs from one server: http://localhost:5001
const publicPath = path.join(__dirname, '..');

app.use('/css', express.static(path.join(publicPath, 'css')));
app.use('/js', express.static(path.join(publicPath, 'js')));
app.use('/pages', express.static(path.join(publicPath, 'pages')));

// Root URL opens the welcome page.
app.get('/', (req, res) => {
  res.redirect('/pages/login.html');
});

// --- Start the server ---
// Force using port 5002 for local development to avoid PORT env collisions.
const PORT = 5002;
app.listen(PORT, () => {
  console.log(`FinGuru server running on http://localhost:${PORT}`);
  if (!dbConnected) console.warn('Warning: MongoDB not connected — API endpoints may be unavailable.');
});
