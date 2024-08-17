const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require('passport');
const bodyParser = require('body-parser');
const path = require('path');

const PORT = process.env.PORT || 3000;

const app = express();

// Middleware setup
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
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.log(err));

// Route for the dashboard
app.get('/', (req, res) => {
    res.render('dashboard');
});

// **Route for creating a new issue**
app.get('/create', (req, res) => {
    res.render('create_issue');  // Renders the create_issue.ejs template
});

// Handle form submission for creating a new issue
app.post('/create-issue', (req, res) => {
    // Process form data here (e.g., save to the database)
    // Redirect or render a response after processing
    res.redirect('/');  // Redirect back to the dashboard (or wherever you'd like)
});

// Starting the server
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// http://localhost:3000

// http://localhost:3000
