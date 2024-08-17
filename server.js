const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require('passport');
const bodyParser = require('body-parser');
const path = require('path');

constPORT = process.env.PORT || 3000;

const app = express(); // This line must be before any use of the `app` variable// Middleware setup
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));
app.set('view engine', 'ejs');

// Express session setup
app.use(session({
    secret: 'your_secret_key',
    resave: false,
    saveUninitialized: true,
}));

// Passport middleware setup
app.use(passport.initialize());
app.use(passport.session());

// MongoDB connection setup
mongoose.connect('mongodb://localhost:27017/rcca', { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() =>console.log('MongoDB connected'))
    .catch(err =>console.log(err));

// Basic route setup
app.get('/', (req, res) => {
    res.render('dashboard'); // Render the dashboard view (ensure you have a dashboard.ejs file)
});

// Starting the server
app.listen(PORT, () =>console.log(`Server running on port ${PORT}`));

// http://localhost:3000
