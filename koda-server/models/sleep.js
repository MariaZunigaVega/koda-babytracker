const mongoose = require('mongoose');

const SleepSchema = new mongoose.Schema({
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
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    duration: { type: Number, required: true }, // duration in minutes or hours
    type: { type: String, enum: ['Nap', 'Night'] },  
    quality: { type: String, enum: ['Good', 'Fair', 'Poor'] },  
    timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Sleep', SleepSchema);