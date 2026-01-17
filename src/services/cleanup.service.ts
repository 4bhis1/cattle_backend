import fs from 'fs';
import path from 'path';
import File from '../models/file.model';
import logger from '../config/logger';

// Run cleanup every 1 hour
const CLEANUP_INTERVAL = 60 * 60 * 1000;
// Files older than 24 hours are considered orphaned if still 'temp'
const FILE_AGE_LIMIT = 24 * 60 * 60 * 1000;

export const startCleanupJob = () => {
    logger.info('Starting file cleanup service...');

    const runCleanup = async () => {
        try {
            const timeLimit = new Date(Date.now() - FILE_AGE_LIMIT);

            // Find temp files created before timeLimit
            const filesToDelete = await File.find({
                status: 'temp',
                createdAt: { $lt: timeLimit }
            });

            if (filesToDelete.length > 0) {
                logger.info(`Cleanup: Found ${filesToDelete.length} orphaned files.`);

                for (const file of filesToDelete) {
                    try {
                        // Resolve path - file.path is usually absolute due to multer config, but verify
                        // In upload.service.ts: path.join(process.cwd(), 'uploads')
                        const filePath = file.path;

                        if (fs.existsSync(filePath)) {
                            fs.unlinkSync(filePath);
                        }

                        await File.deleteOne({ _id: file._id });
                        logger.info(`Deleted orphaned file: ${file.filename}`);
                    } catch (err) {
                        logger.error(`Failed to delete file ${file._id}:`, err);
                    }
                }
            }
        } catch (err) {
            logger.error('Cleanup job error:', err);
        }
    };

    // Run initially after 1 minute
    setTimeout(runCleanup, 60000);

    // Schedule periodic run
    setInterval(runCleanup, CLEANUP_INTERVAL);
};
