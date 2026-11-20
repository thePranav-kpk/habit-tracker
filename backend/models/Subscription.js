const mongoose = require('mongoose');

const SubscriptionSchema = new mongoose.Schema(
  {
    endpoint: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    keys: {
      p256dh: {
        type: String,
        required: true
      },
      auth: {
        type: String,
        required: true
      }
    },
    deviceName: {
      type: String,
      default: 'Mobile Device'
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Subscription', SubscriptionSchema);
