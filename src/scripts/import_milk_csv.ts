import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import Milk from '../models/milk.model';
import Cattle from '../models/cattle.model';

dotenv.config();

const CSV_FILE = path.join(__dirname, 'milk_data.csv');

const connectDB = async () => {
    try {
        const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/cattle_directory';
        await mongoose.connect(mongoURI);
        console.log(`Connected to MongoDB: ${mongoURI}`);
    } catch (err) {
        console.error('MongoDB connection error:', err);
        process.exit(1);
    }
};

const importCsv = async () => {
    await connectDB();

    try {
        if (!fs.existsSync(CSV_FILE)) {
            console.error(`CSV file not found at ${CSV_FILE}`);
            process.exit(1);
        }

        const fileContent = fs.readFileSync(CSV_FILE, 'utf-8');
        const lines = fileContent.split('\n').filter(line => line.trim() !== '');
        
        // Remove header
        const header = lines.shift()?.split(',');
        if (!header) {
            console.error('CSV file is empty');
            return;
        }

        console.log(`Processing ${lines.length} rows from CSV...`);

        const cattleCache = new Map<string, any>();

        let insertedCount = 0;

        for (const line of lines) {
            const cols = line.split(',').map(c => c.trim());
            if (cols.length < 4) continue;

            const [dateStr, cattleName, morningStr, eveningStr, remarks] = cols;

            // Resolve Cattle
            let cattle = cattleCache.get(cattleName.toLowerCase());
            if (!cattle) {
                cattle = await Cattle.findOne({ name: { $regex: new RegExp(`^${cattleName}$`, 'i') } });
                if (cattle) {
                    cattleCache.set(cattleName.toLowerCase(), cattle);
                } else {
                    console.warn(`⚠️  Cattle not found: ${cattleName}. Skipping row.`);
                    continue;
                }
            }

            const date = new Date(dateStr);
            if (isNaN(date.getTime())) {
                console.error(`Invalid date: ${dateStr}`);
                continue;
            }

            const baseRecord = {
                cattleId: cattle._id,
                date: date,
                organisation_id: cattle.organisation_id,
            };

            // Helper to parse quantity
            const parseQty = (str: string) => {
                if (!str || str === '-' || str === '') return 0;
                return parseFloat(str);
            };

            const morningQty = parseQty(morningStr);
            const eveningQty = parseQty(eveningStr);

            // Morning
            if (morningQty > 0) {
                await Milk.findOneAndUpdate(
                    { ...baseRecord, session: 'morning' },
                    { 
                        $set: {
                            quantity: morningQty,
                            fat: 0,
                            organisation_id: baseRecord.organisation_id
                        }
                    },
                    { upsert: true, new: true }
                );
                insertedCount++;
            }

            // Evening
            if (eveningQty > 0) {
                await Milk.findOneAndUpdate(
                    { ...baseRecord, session: 'evening' },
                    { 
                        $set: {
                            quantity: eveningQty,
                            fat: 0,
                            organisation_id: baseRecord.organisation_id
                        }
                    },
                    { upsert: true, new: true }
                );
                insertedCount++;
            }

            if (remarks) {
                console.log(`ℹ️ [${dateStr}] ${cattleName}: ${remarks}`);
            }
        }

        console.log(`✅ CSV Import Complete. Processed ${lines.length} lines. Upserted/Updated ${insertedCount} records.`);

    } catch (err) {
        console.error('Error importing CSV:', err);
    } finally {
        await mongoose.disconnect();
    }
};

importCsv();
