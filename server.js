const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require('passport');
const bodyParser = require('body-parser');
const path = require('path');
const Issue = require('./models/Issue'); // Assuming Issue model is defined

const PORT = process.env.PORT || 3000;

const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));
app.set('view engine', 'ejs');

app.use(session({
    secret: 'your_secret_key',
    resave: false,
    saveUninitialized: true,
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect('mongodb://localhost:27017/rcca')
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// Route for the dashboard
app.get('/', async (req, res) => {
    const cars = await Issue.find().sort({ createdAt: 1 }); // Get all CARs in chronological order
    res.render('dashboard', { cars });
});

// Route to submit D1 section
app.post('/submit-d1', async (req, res) => {
    const newCar = new Issue({
        d1: req.body.d1,
        status: 'Open',
    });
    await newCar.save();
    res.redirect(`/submit-d2/${newCar._id}`);
});

// Route to submit D2 section
app.post('/submit-d2/:id', async (req, res) => {
    const car = await Issue.findById(req.params.id);
    if (!car.carNumber) {
        car.carNumber = String(car._id).slice(-6).padStart(6, '0'); // Generate a CAR# (e.g., 000001)
    }
    car.d2 = req.body.d2;
    await car.save();
    res.redirect(`/submit-d3/${car._id}`);
});

app.get('/', async (req, res) => {
    const openCars = await Issue.find({ status: 'Open' }).sort({ createdAt: 1 });
    res.render('dashboard', { openCars });
});

// Similar routes for D3 to D8 submission
app.post('/submit-d8/:id', async (req, res) => {
    const car = await Issue.findById(req.params.id);
    car.d8 = req.body.d8;
    car.status = 'Closed'; // Mark the CAR as complete
    await car.save();
    res.redirect('/');
});

// Starting the server
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// http://localhost:3000

// http://localhost:3000
