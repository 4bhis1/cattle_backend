import fs from 'fs';
import path from 'path';

interface FeaturesConfig {
    auth: {
        enabled: boolean;
        google: boolean;
        github: boolean;
        otp: boolean;
    };
    upload: {
        enabled: boolean;
        provider: 'local' | 's3' | 'mongo';
    };
    logging: {
        enabled: boolean;
        level: string;
    };
    email: {
        enabled: boolean;
        provider: string;
    };
}

const featuresPath = path.join(process.cwd(), 'features.json');

let features: FeaturesConfig;

try {
    const fileContent = fs.readFileSync(featuresPath, 'utf-8');
    features = JSON.parse(fileContent);
} catch (error) {
    console.warn('Could not load features.json, using defaults.');
    features = {
        auth: { enabled: true, google: false, github: false, otp: false },
        upload: { enabled: true, provider: 'local' },
        logging: { enabled: true, level: 'info' },
        email: { enabled: false, provider: 'nodemailer' }
    };
}

export default features;
