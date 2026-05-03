
import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import Milk from '../models/milk.model';
import Cattle from '../models/cattle.model';
import connectDB from '../config/database';

dotenv.config();

const importMilkData = async () => {
    try {
        console.log('Connecting to database...');
        await connectDB();
        console.log('Connected to database.');

        const csvPath = path.join(__dirname, 'milk_data.csv');
        console.log(`Reading CSV file from: ${csvPath}`);
        
        if (!fs.existsSync(csvPath)) {
            throw new Error(`File not found: ${csvPath}`);
        }

        const fileContent = fs.readFileSync(csvPath, 'utf-8');
        // Handle potentially different newline characters
        const lines = fileContent.split(/\r?\n/).map(line => line.trim()).filter(line => line);

        if (lines.length < 3) {
            console.log("File too short");
            process.exit(0);
        }

        // Parse Header for IDs (Line 1, index 0)
        // Expecting format: Date \t ID1 \t \t \t ID2 ...
        const headerLine = lines[0];
        const headerParts = headerLine.split('\t'); // Don't trim parts yet, we need accurate usage of tabs
        
        const columnToCattleId: { [key: number]: string } = {};
        
        // IDs seem to be at 1, 4, 7 based on observation: ID, empty, empty, ID, empty, empty...
        // But we can just search for valid object IDs
        for (let i = 1; i < headerParts.length; i++) {
            const part = headerParts[i].trim();
            if (part && /^[0-9a-fA-F]{24}$/.test(part)) {
                columnToCattleId[i] = part;
            }
        }
        
        console.log(`Found ${Object.keys(columnToCattleId).length} cattle IDs:`, columnToCattleId);

        if (Object.keys(columnToCattleId).length === 0) {
            console.error("No valid cattle IDs found in the header row.");
            process.exit(1);
        }

        // Fetch Cattle to get organisation_id
        const uniqueIds = Array.from(new Set(Object.values(columnToCattleId)));
        const cattleDocs = await Cattle.find({ _id: { $in: uniqueIds } });
        const cattleMap = new Map(cattleDocs.map(c => [c._id.toString(), c]));

        console.log(`Found ${cattleDocs.length} cattle documents in DB.`);

        let recordsCreated = 0;
        let recordsSkipped = 0;

        // Data starts from index 2 (Line 3)
        // Line indices: 0 (IDs), 1 (Headers: Morning/Evening...), 2 (Data: 10/30/2025...)
        for (let i = 2; i < lines.length; i++) {
            const line = lines[i];
            const parts = line.split('\t');
            
            // Date is at index 0
            const dateStr = parts[0]?.trim();
            if (!dateStr) continue;

            const date = new Date(dateStr);
            if (isNaN(date.getTime())) {
                console.warn(`Skipping invalid date at line ${i + 1}: ${dateStr}`);
                continue;
            }

            for (const [colIndexStr, cattleId] of Object.entries(columnToCattleId)) {
                const colIndex = parseInt(colIndexStr, 10);
                // Morning at colIndex, Evening at colIndex + 1
                // Ensure we handle index out of bounds if line is short
                const morningVal = parts[colIndex]?.trim();
                const eveningVal = parts[colIndex + 1]?.trim();

                const cattle = cattleMap.get(cattleId);
                if (!cattle) {
                   // console.warn(`Cattle not found in DB for ID: ${cattleId}, skipping entry.`);
                   continue;
                }

                // Function to process a single session
                const processEntry = async (session: 'morning' | 'evening', value: string | undefined) => {
                    if (!value || value === '-' || value === '') return;
                    
                    const quantity = parseFloat(value);
                    if (isNaN(quantity)) return;

                    // Check if record already exists
                    const existing = await Milk.findOne({
                        cattleId: cattleId,
                        date: date,
                        session: session
                    });

                    if (existing) {
                        recordsSkipped++;
                        return;
                    }

                    await Milk.create({
                        cattleId: cattleId,
                        session: session,
                        date: date,
                        quantity: quantity,
                        organisation_id: cattle.organisation_id || 'org_default_001',
                        fat: 0 // Default 0 as CSV doesn't have fat
                    });
                    recordsCreated++;
                };

                await processEntry('morning', morningVal);
                await processEntry('evening', eveningVal);
            }
        }

        console.log(`Import finished. Created: ${recordsCreated}, Skipped (already exists): ${recordsSkipped}`);
        process.exit(0);

    } catch (error) {
        console.error("Error in import script:", error);
        process.exit(1);
    }
};

importMilkData();
