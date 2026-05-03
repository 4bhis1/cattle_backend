import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Cattle from '../models/cattle.model';

dotenv.config();

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/cattle_directory');
    const cattles = await Cattle.find({}, 'name _id');
    console.log('--- ALL CATTLE ---');
    cattles.forEach(c => console.log(`"${c.name}" (ID: ${c._id})`));
    console.log('------------------');
  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
  }
};

run();
