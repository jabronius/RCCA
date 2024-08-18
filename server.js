const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require('passport');
const bodyParser = require('body-parser');
const path = require('path');
const multer = require('multer');
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
    try {
        const openCars = await Issue.find().sort({ createdAt: 1 });
        res.render('dashboard', { openCars }); // Passing openCars to the view
    } catch (err) {
        console.error(err);
        res.status(500).send("Error retrieving CARs from the database.");
    }
});

// Route to render the 'Create New Quality Issue' page
app.get('/create/:id', async (req, res) => {
    try {
        const car = await Issue.findById(req.params.id);
        res.render('create_issue', { car, carNumber: car.carNumber, issueCreatorName: car.d1.issue_creator });
    } catch (err) {
        console.error("Error fetching CAR:", err);
        res.status(500).send("Error retrieving CAR data.");
    }
});

// Route to submit D1 section
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
        res.redirect(`/submit-d2/${newCar._id}`);
    } catch (err) {
        console.error('Error saving D1 data:', err);
        res.status(500).send("An error occurred while saving the D1 data.");
    }
});

// Route to submit D2 section
app.post('/submit-d2/:id', async (req, res) => {
    try {
        const car = await Issue.findById(req.params.id);
        car.d2 = {
            vehicle_model: req.body.vehicle_model,
            process: req.body.process,
            function_group: req.body.function_group,
            part_name: req.body.part_name,
            part_number: req.body.part_number,
            defect: req.body.defect,
            green_y: req.body.green_y,
            problem_seen_date: req.body.problem_seen_date,
            product_life_cycle: req.body.product_life_cycle,
            in_vehicle: req.body.in_vehicle,
            side_of_vehicle: req.body.side_of_vehicle,
            additional_where: req.body.additional_where,
        };
        await car.save();
        res.redirect(`/submit-d3/${car._id}`);
    } catch (err) {
        console.error('Error saving D2 data:', err);
        res.status(500).send("An error occurred while saving the D2 data.");
    }
});

// Configure Multer for file uploads
const upload = multer({ dest: 'uploads/' }); // This will store uploaded files in the 'uploads' directory

// D3 submission route with file upload handling
app.post('/submit-d3/:id', upload.array('sort_yard_sweep_files', 10), async (req, res) => {
    try {
        const car = await Issue.findById(req.params.id);
        car.d3 = req.body.containment;

        // Handle uploaded files
        if (req.files && req.files.length > 0) {
            car.d3.sort_yard_sweep_files = req.files.map(file => file.filename); // Save the filenames in the database
        }

        await car.save();
        res.redirect(`/submit-d4/${car._id}`);
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
        res.redirect(`/submit-d5/${car._id}`);
    } catch (err) {
        console.error('Error saving D4 data:', err);
        res.status(500).send('Error saving D4 data.');
    }
});

// D5 submission route
app.post('/submit-d5/:id', async (req, res) => {
    try {
        const car = await Issue.findById(req.params.id);
        car.d5 = req.body.d5;
        await car.save();
        res.redirect(`/submit-d6/${car._id}`);
    } catch (err) {
        console.error('Error saving D5 data:', err);
        res.status(500).send('Error saving D5 data.');
    }
});

// D6 submission route
app.post('/submit-d6/:id', async (req, res) => {
    try {
        const car = await Issue.findById(req.params.id);
        car.d6 = req.body.d6;
        await car.save();
        res.redirect(`/submit-d7/${car._id}`);
    } catch (err) {
        console.error('Error saving D6 data:', err);
        res.status(500).send('Error saving D6 data.');
    }
});

// D7 submission route
app.post('/submit-d7/:id', async (req, res) => {
    try {
        const car = await Issue.findById(req.params.id);
        car.d7 = req.body.d7;
        await car.save();
        res.redirect(`/submit-d8/${car._id}`);
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
