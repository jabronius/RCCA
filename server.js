const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require('passport');
const multer = require('multer');
const bodyParser = require('body-parser');
const path = require('path');
const Issue = require('./models/Issue'); // Assuming Issue model is defined
const fs = require('fs');

const PORT = process.env.PORT || 3000;

const app = express();

// Middleware to handle JSON data
app.use(bodyParser.json());

// Middleware to handle URL-encoded data
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

// Configure Multer for file uploads
const upload = multer({ dest: 'uploads/' }); // Store files in 'uploads' directory

app.post('/delete/:id', async (req, res) => {
    try {
        await Issue.findByIdAndDelete(req.params.id);
        res.redirect('/'); // Redirect back to the AMPboard/dashboard page
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
        res.render('dashboard', { openCars }); // Passing openCars to the view
    } catch (err) {
        console.error(err);
        res.status(500).send("Error retrieving CARs from the database.");
    }
});

// D2 submission route
app.post('/submit-d2/:id', async (req, res) => {
    try {
        console.log("POST request received for /submit-d2/:id");
        console.log(req.body);

        const car = await Issue.findById(req.params.id);

        if (!car) {
            return res.status(404).send('CAR not found');
        }

        if (!req.body.d2) {
            console.log("No data found in req.body.d2");
            return res.status(400).send('No data provided for D2.');
        }

        car.d2 = {
            vehicle_model: req.body.d2.vehicle_model,
            issue_title: req.body.d2.issue_title,
            kpi: req.body.d2.kpi,
            function_group: req.body.d2.function_group,
            part_name: req.body.d2.part_name,
            part_number: req.body.d2.part_number,
            defect: req.body.d2.defect,
            green_y: req.body.d2.green_y,
            problem_seen_date: req.body.d2.problem_seen_date,
            in_vehicle: req.body.d2.in_vehicle,
            side_of_vehicle: req.body.d2.side_of_vehicle,
            additional_where: req.body.d2.additional_where,
        };

        await car.save();
        res.redirect(`/create/${car._id}`);
    } catch (err) {
        console.error('Error saving D2 data:', err);
        res.status(500).send('An error occurred while saving the D2 data.');
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
app.post('/save-section/:id/:section', upload.any(), async (req, res) => {
    try {
        const car = await Issue.findById(req.params.id);
        if (!car) return res.status(404).send('CAR not found');

        const section = req.params.section;
        car[section] = req.body[section];

        // Handle uploaded files for the section
        if (req.files && req.files.length > 0) {
            car[section].files = req.files.map(file => ({
                filename: file.filename,
                originalname: file.originalname
            }));
        }

        await car.save();

        if (req.body.action === 'submit') {
            const nextSection = getNextSection(section);
            if (nextSection) {
                res.redirect(`/create/${car._id}/${nextSection}`);
            } else {
                res.redirect(`/create/${car._id}`);
            }
        } else {
            res.redirect(`/create/${car._id}/${section}`);
        }
    } catch (err) {
        console.error('Error saving section data:', err);
        res.status(500).send('An error occurred while saving the data.');
    }
});

function getNextSection(currentSection) {
    const sections = ['d1', 'd2', 'd3', 'd4', 'd5', 'd6', 'd7', 'd8'];
    const currentIndex = sections.indexOf(currentSection);
    return currentIndex >= 0 && currentIndex < sections.length - 1 ? sections[currentIndex + 1] : null;
}

// Starting the server
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// http://localhost:3000
