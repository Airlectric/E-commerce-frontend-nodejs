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
const productRoutes = require('./routes/products/productRoutes');
const categoryRoutes = require('./routes/products/categoryRoutes');
const methodOverride = require('method-override');
axios.defaults.withCredentials = true;

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(methodOverride('_method'));


app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: {
      secure: false,  // Secure cookies in production
      httpOnly: true,
	  maxAge: 30 * 60 * 1000
    },
  })
);


app.use((req, res, next) => {
  res.locals.user = req.session.user || null; // Attach user to res.locals
  next();
});

app.locals.env = process.env;


app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/', indexRoutes);
app.use('/user', userRoutes);
app.use('/order', orderRoutes);
app.use('/categories', categoryRoutes);
app.use('/products', productRoutes);


// Set default app locals
app.locals.title = "E-Commerce";

// Start the server
const PORT = process.env.PORT || 4444;
app.listen(PORT, () => {
  console.log(`Frontend server is running on http://localhost:${PORT}`);
});
