import mongoose, { Schema, model, models } from 'mongoose';

const CardSchema = new Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  type: { 
    type: String, 
    required: true, 
    enum: ["SURVIVAL", "DISASTER", "POWER", "ADAPT", "CHAOS", "ASCENDED", "TWIST", "CATACLYSM"] 
  },
  tier: { type: Number },
  description: { type: String },
  effect: { type: String },
  disasterKind: { type: String },
  blocksDisaster: { type: String },
  primitives: [Schema.Types.Mixed],
  discardCost: { type: Number },
}, { timestamps: true });

export default models['Card'] || model('Card', CardSchema);
