const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require('passport');
const multer = require('multer');
const bodyParser = require('body-parser');
const path = require('path');
const Issue = require('./models/Issue');
const fs = require('fs');
const helmet = require('helmet');

// Initialize Express app
const app = express();

// Use Helmet for security
app.use(helmet());

// Middleware to handle JSON data and URL-encoded data
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use(express.static('public'));
app.set('view engine', 'ejs');

// Session management
app.use(session({
    secret: process.env.SESSION_SECRET || 'your_secret_key',
    resave: false,
    saveUninitialized: true,
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect('mongodb://localhost:27017/rcca')
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// Configure Multer for file uploads
const upload = multer({ dest: 'uploads/' });

// Handle deletion of issues
app.post('/delete/:id', async (req, res) => {
    try {
        await Issue.findByIdAndDelete(req.params.id);
        res.redirect('/');
    } catch (err) {
        console.error('Error deleting AMP:', err);
        res.status(500).send('Error deleting AMP.');
    }
});

// Serve uploaded files
app.get('/uploads/:filename', (req, res) => {
    const filePath = path.join(__dirname, 'uploads', req.params.filename);
    res.download(filePath);
});

// Route to render the 'Create New Quality Issue' page (starting with D1)
app.get('/create', async (req, res) => {
    res.render('create_issue', { car: null, carNumber: null, issueCreatorName: null });
});

// Route for the dashboard
app.get('/', async (req, res) => {
    try {
        const openCars = await Issue.find({ carNumber: { $exists: true, $ne: null } }).sort({ createdAt: 1 });
        res.render('dashboard', { openCars });
    } catch (err) {
        console.error(err);
        res.status(500).send("Error retrieving CARs from the database.");
    }
});

// Route to create a new CAR entry and redirect to the form
app.get('/create', async (req, res) => {
    try {
        const lastIssue = await Issue.findOne().sort({ createdAt: -1 });
        let carNumber = '000001';
        if (lastIssue && lastIssue.carNumber) {
            carNumber = (parseInt(lastIssue.carNumber, 10) + 1).toString().padStart(6, '0');
        }

        const newCar = new Issue({
            carNumber: carNumber,
            status: 'Open',
            d1: {
                root_cause_champion: 'To Be Determined',
                hod_responsible: 'To Be Determined',
                support_role: 'To Be Determined',
                issue_creator: 'To Be Determined',
                car_system_tracker: 'To Be Determined',
            },
            d2: {},
            d3: {},
            d4: {},
            d5: {},
            d6: {},
            d7: {},
            d8: {}
        });

        const savedCar = await newCar.save();
        res.redirect(`/create/${savedCar._id}`);
    } catch (err) {
        console.error('Error creating new CAR:', err);
        res.status(500).send("An error occurred while creating a new CAR.");
    }
});

// Route to render an existing CAR issue based on its ID (for editing or viewing)
app.get('/create/:id', async (req, res) => {
    try {
        const car = await Issue.findById(req.params.id);
        if (!car) {
            return res.status(404).send('CAR not found');
        }
        res.render('create_issue', { car, carNumber: car.carNumber, issueCreatorName: car.d1.issue_creator });
    } catch (err) {
        console.error("Error fetching CAR:", err);
        res.status(500).send("Error retrieving CAR data.");
    }
});

// Universal route to save and submit any section
app.post('/save-section/:id/:section', async (req, res) => {
    try {
        console.log('Request Body:', req.body); // Check entire body content
        const section = req.params.section;
        const updateData = {};
        updateData[section] = req.body[section];

        console.log('Updating section:', section); 
        console.log('Update data:', updateData);

        await Issue.findByIdAndUpdate(req.params.id, { $set: updateData }, { runValidators: true, new: true });
        res.redirect(`/create/${req.params.id}`);
    } catch (err) {
        console.error('Error saving section:', err);
        res.status(500).send('Error saving data.');
    }
});



// Starting the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
