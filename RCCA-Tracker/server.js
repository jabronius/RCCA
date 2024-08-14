const app = require('./express');
const Issue = require('./models/Issue');

// Route to render the 'Create New Issue' page
app.get('/create', (req, res) => {
    res.render('create_issue');
});

// Route to handle form submission from the 'Create New Issue' page
app.post('/create-issue', (req, res) => {
    const { title, description, area, severity } = req.body;

    const newIssue = new Issue({
        title,
        description,
        area,
        severity,
        status: 'Open',
        createdAt: new Date(),
    });

    newIssue.save()
        .then(() => {
            res.redirect('/'); // Redirect to the dashboard after successful submission
        })
        .catch(err => {
            console.error(err);
            res.redirect('/create'); // Redirect back to the form on error
        });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
