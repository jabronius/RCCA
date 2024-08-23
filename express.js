const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require('passport');
const helmet = require('helmet');

const app = express();

// Middleware setup
app.use(express.urlencoded({ extended: true }));
app.use(express.json()); // Include JSON body parsing
app.use(express.static('public'));
app.set('view engine', 'ejs');
app.use(helmet()); // Add helmet for security

// Express session
app.use(session({
    secret: 'your_secret_key',
    resave: false,
    saveUninitialized: true,
    // store: new MongoStore({ mongooseConnection: mongoose.connection }) // Optional: persistent session store
}));

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// MongoDB connection
mongoose.connect('mongodb://localhost/rcca', { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.log(err));

// Routes setup
const issueRoutes = require('./routes/issues'); // Assuming you have a separate route file
app.use('/', issueRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

// Export the app instance
module.exports = app;
