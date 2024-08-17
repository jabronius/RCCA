// models/Issue.js

const mongoose = require('mongoose');

const issueSchema = new mongoose.Schema({
    carNumber: {
        type: String,
        unique: true
    },
    d1: {
        type: Object,
        required: true
    },
    d2: Object,
    d3: Object,
    d4: Object,
    d5: Object,
    d6: Object,
    d7: Object,
    d8: Object,
    status: {
        type: String,
        default: 'Open'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Issue', issueSchema);
