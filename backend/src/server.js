const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const rateLimit = require('express-rate-limit');

dotenv.config();

const categoriesRoutes = require('./routes/categories');
const materialsRoutes = require('./routes/materials');
const statsRoutes = require('./routes/stats');
const adminRoutes = require('./routes/admin');
const reportsRoutes = require('./routes/reports');
const authRoutes = require('./routes/auth');

const app = express();
const PORT = process.env.PORT || 5000;

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // Limit each IP to 300 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests from this IP, please try again later.' }
});

// Middlewares
app.use(limiter);
app.use(cors({
  origin: '*', // Allow all origins for dev
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'College Study Material Platform API is running.',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/materials', materialsRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/reports', reportsRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error'
  });
});

// 404 Route Catch-all
app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.originalUrl} not found` });
});

// Start Server
app.listen(PORT, () => {
  console.log(`✓ Backend Server is running on http://localhost:${PORT}`);
  console.log(`✓ Connected to Supabase at ${process.env.SUPABASE_URL || 'configured URL'}`);
});
