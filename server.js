const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require('passport');
const bodyParser = require('body-parser');
const path = require('path');
const multer = require('multer');
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

// Route to submit D1 section and generate CAR#
app.post('/submit-d1', async (req, res) => {
    try {
        const lastIssue = await Issue.findOne().sort({ createdAt: -1 });
        let carNumber = '000001';
        if (lastIssue && lastIssue.carNumber) {
            carNumber = (parseInt(lastIssue.carNumber, 10) + 1).toString().padStart(6, '0');
        }

        const newCar = new Issue({
            carNumber: carNumber,
            d1: {
                root_cause_champion: req.body.team_members.root_cause_champion,
                hod_responsible: req.body.team_members.hod_responsible,
                support_role: req.body.team_members.support_role,
                issue_creator: req.body.team_members.issue_creator,
                car_system_tracker: req.body.team_members.car_system_tracker,
            },
            status: 'Open',
        });

        await newCar.save();
        res.redirect(`/create/${newCar._id}`); // Redirect to the CAR issue page for further editing
    } catch (err) {
        console.error('Error saving D1 data:', err);
        res.status(500).send("An error occurred while saving the D1 data.");
    }
});

// Route to submit D2 section
app.post('/submit-d2/:id', async (req, res) => {
    try {
        console.log("Received data:", req.body); // Log the received data to check what's coming in
        if (!req.body.d2) {
            console.error('req.body.d2 is undefined');
            return res.status(400).send("Error: No data received for D2 section.");
        }

        // Find the CAR by ID
        const car = await Issue.findById(req.params.id);
        if (!car) {
            return res.status(404).send('CAR not found');
        }

        // Update the D2 section with received data
        car.d2 = {
            vehicle_model: req.body.d2.vehicle_model,
            process: req.body.d2.process,
            function_group: req.body.d2.function_group,
            part_name: req.body.d2.part_name,
            part_number: req.body.d2.part_number,
            defect: req.body.d2.defect,
            green_y: req.body.d2.green_y,
            problem_seen_date: req.body.d2.problem_seen_date,
            product_life_cycle: req.body.d2.product_life_cycle,
            in_vehicle: req.body.d2.in_vehicle,
            side_of_vehicle: req.body.d2.side_of_vehicle,
            additional_where: req.body.d2.additional_where,
        };

        // Save the updated CAR document
        await car.save();
        res.redirect(`/create/${car._id}`); // Redirect to the CAR issue page for further editing
    } catch (err) {
        console.error('Error saving D2 data:', err);
        res.status(500).send("An error occurred while saving the D2 data.");
    }
});


// D3 submission route with file upload handling
app.post('/submit-d3/:id', upload.array('sort_docs', 10), async (req, res) => {
    try {
        const car = await Issue.findById(req.params.id);
        car.d3 = req.body.d3;

        // Handle uploaded files
        if (req.files && req.files.length > 0) {
            car.d3.sort_yard_sweep_files = req.files.map(file => ({
                filename: file.filename,
                originalname: file.originalname
            })); // Save the filenames and original names in the database
        }

        await car.save();
        res.redirect(`/create/${car._id}`);
    } catch (err) {
        console.error('Error saving D3 data:', err);
        res.status(500).send('Error saving D3 data.');
    }
});

// D4 submission route
app.post('/submit-d4/:id', async (req, res) => {
    try {
        const car = await Issue.findById(req.params.id);
        car.d4 = req.body.d4;
        await car.save();
        res.redirect(`/create/${car._id}`);
    } catch (err) {
        console.error('Error saving D4 data:', err);
        res.status(500).send('Error saving D4 data.');
    }
});

// D5 submission route
app.post('/submit-d5/:id', upload.fields([
    { name: 'd5_capability_study_upload' },
    { name: 'd5_control_chart_upload' },
    { name: 'd5_gage_rr_upload' },
    { name: 'd5_risk_assessment_upload' }
]), async (req, res) => {
    try {
        const car = await Issue.findById(req.params.id);
        car.d5 = req.body.d5;

        // Handle uploaded files
        car.d5.files = {};
        if (req.files['d5_capability_study_upload']) {
            car.d5.files.capability_study = req.files['d5_capability_study_upload'].map(file => ({
                filename: file.filename,
                originalname: file.originalname
            }));
        }
        if (req.files['d5_control_chart_upload']) {
            car.d5.files.control_chart = req.files['d5_control_chart_upload'].map(file => ({
                filename: file.filename,
                originalname: file.originalname
            }));
        }
        if (req.files['d5_gage_rr_upload']) {
            car.d5.files.gage_rr = req.files['d5_gage_rr_upload'].map(file => ({
                filename: file.filename,
                originalname: file.originalname
            }));
        }
        if (req.files['d5_risk_assessment_upload']) {
            car.d5.files.risk_assessment = req.files['d5_risk_assessment_upload'].map(file => ({
                filename: file.filename,
                originalname: file.originalname
            }));
        }

        await car.save();
        res.redirect(`/create/${car._id}`);
    } catch (err) {
        console.error('Error saving D5 data:', err);
        res.status(500).send('Error saving D5 data.');
    }
});

// D6 submission route
app.post('/submit-d6/:id', upload.fields([
    { name: 'd6_control_plans_upload' },
    { name: 'd6_fmeas_upload' }
]), async (req, res) => {
    try {
        const car = await Issue.findById(req.params.id);
        car.d6 = req.body.d6;

        // Handle uploaded files
        car.d6.files = {};
        if (req.files['d6_control_plans_upload']) {
            car.d6.files.control_plans = req.files['d6_control_plans_upload'].map(file => ({
                filename: file.filename,
                originalname: file.originalname
            }));
        }
        if (req.files['d6_fmeas_upload']) {
            car.d6.files.fmeas = req.files['d6_fmeas_upload'].map(file => ({
                filename: file.filename,
                originalname: file.originalname
            }));
        }

        await car.save();
        res.redirect(`/create/${car._id}`);
    } catch (err) {
        console.error('Error saving D6 data:', err);
        res.status(500).send('Error saving D6 data.');
    }
});

// D7 submission route
app.post('/submit-d7/:id', upload.fields([
    { name: 'dfmea_upload' },
    { name: 'pfmea_upload' },
    { name: 'swis_upload' }
]), async (req, res) => {
    try {
        const car = await Issue.findById(req.params.id);
        car.d7 = req.body.d7;

        // Handle uploaded files
        car.d7.files = {};
        if (req.files['dfmea_upload']) {
            car.d7.files.dfmea = req.files['dfmea_upload'].map(file => ({
                filename: file.filename,
                originalname: file.originalname
            }));
        }
        if (req.files['pfmea_upload']) {
            car.d7.files.pfmea = req.files['pfmea_upload'].map(file => ({
                filename: file.filename,
                originalname: file.originalname
            }));
        }
        if (req.files['swis_upload']) {
            car.d7.files.swis = req.files['swis_upload'].map(file => ({
                filename: file.filename,
                originalname: file.originalname
            }));
        }

        await car.save();
        res.redirect(`/create/${car._id}`);
    } catch (err) {
        console.error('Error saving D7 data:', err);
        res.status(500).send('Error saving D7 data.');
    }
});

// D8 submission route
app.post('/submit-d8/:id', async (req, res) => {
    try {
        const car = await Issue.findById(req.params.id);
        car.d8 = req.body.d8;
        car.status = 'Closed'; // Mark the CAR as complete
        await car.save();
        res.redirect('/');
    } catch (err) {
        console.error('Error saving D8 data:', err);
        res.status(500).send('Error saving D8 data.');
    }
});

// Starting the server
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// http://localhost:3000
