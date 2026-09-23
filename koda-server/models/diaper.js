const mongoose = require('mongoose');

const DiaperSchema = new mongoose.Schema({
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
        enum: ['Wet', 'Dirty', 'Mixed'], 
        required: true 
    },
    timestamp: { 
        type: Date, 
        default: Date.now 
    }
});

module.exports = mongoose.model('Diaper', DiaperSchema);