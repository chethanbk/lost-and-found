const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true,
    enum: ['Electronics', 'Clothing', 'Jewelry', 'Books', 'Keys', 'Bags', 'Documents', 'Other']
  },
  status: {
    type: String,
    required: true,
    enum: ['lost', 'found'],
    default: 'lost'
  },
  location: {
    type: String,
    required: true
  },
  dateReported: {
    type: Date,
    default: Date.now
  },
  contactInfo: {
    name: String,
    email: String,
    phone: String
  },
  image: {
    type: String
  },
  resolved: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Item', itemSchema);
