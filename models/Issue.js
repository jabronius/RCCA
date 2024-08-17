// models/Issue.js

const mongoose = require('mongoose');

const issueSchema = new mongoose.Schema({
    d1: {
        root_cause_champion: { type: String, required: true },
        hod_responsible: { type: String, required: true },
        support_role: { type: String, required: true },
        issue_creator: { type: String, required: true },
        car_system_tracker: { type: String, required: true },
    },
    // other fields...
    status: { type: String, default: 'Open' },
    carNumber: { type: String },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Issue', issueSchema);
