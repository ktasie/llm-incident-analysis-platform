import mongoose from 'mongoose';

const logSchema = new mongoose.Schema(
  {
    timestamp: { type: Date, default: () => new Date() },
    service: { type: String, required: true },
    severity: {
      type: String,
      required: true,
      enum: ['INFO', 'WARN', 'ERROR'],
      default: 'INFO',
    },
    event: { type: String, default: null },
    correlationId: { type: String, default: null },
    message: { type: String, required: true },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: false },
);

logSchema.index({ timestamp: -1 });
logSchema.index({ correlationId: 1 });

const Log = mongoose.model('Log', logSchema);
export default Log;
