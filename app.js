require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const path = require('path');
const cors = require('cors');
const axios = require('axios');

const indexRoutes = require('./routes/indexRoutes');
const userRoutes = require('./routes/userRoutes');
const orderRoutes = require('./routes/orders/orderRoutes');
axios.defaults.withCredentials = true;

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: {
      httpOnly: true,
      secure: false, // Set to true if using HTTPS
      sameSite: 'strict', // Adjust as necessary
    },
  })
);



app.use((req, res, next) => {
  res.locals.user = req.session.user || null; // Attach user to res.locals
  next();
});


app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.use('/', indexRoutes);
app.use('/user', userRoutes);
app.use('/order', orderRoutes);

// Set default app locals
app.locals.title = "E-Commerce";

// Start the server
const PORT = process.env.PORT || 4444;
app.listen(PORT, () => {
  console.log(`Frontend server is running on http://localhost:${PORT}`);
});
