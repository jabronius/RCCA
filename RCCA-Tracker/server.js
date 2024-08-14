// server.js

const Issue = require('../models/Issue');

// Route to render the 'Create New Issue' page
app.get('/create', (req, res) => {
    res.render('create_issue');
});

// Route to handle form submission from the 'Create New Issue' page
app.post('/create-issue', (req, res) => {
    // Extract data from the request body
    const { title, description, area, severity } = req.body;

    // Create a new issue based on the submitted data
    const newIssue = new Issue({
        title,
        description,
        area,
        severity,
        status: 'Open', // Default status when a new issue is created
        createdAt: new Date(),
    });

    // Save the new issue to the database
    newIssue.save()
        .then(() => {
            res.redirect('/'); // Redirect to the dashboard after successful submission
        })
        .catch(err => {
            console.error(err);
            res.redirect('/create'); // Redirect back to the form on error
        });
});
