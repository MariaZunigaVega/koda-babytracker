//updates made to support childId and loggedBy references instead of childName
const mongoose = require('mongoose');

const FeedingSchema = new mongoose.Schema({
    childId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Child', 
        required: true 
    },
    loggedBy: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    type: { 
        type: String, 
        enum: ['Breast', 'Bottle', 'Solids'], 
        required: true 
    },
    amount: { type: Number },
    side: { 
        type: String, 
        enum: ['Left', 'Right', 'N/A'] 
    },
    timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Feeding', FeedingSchema);
