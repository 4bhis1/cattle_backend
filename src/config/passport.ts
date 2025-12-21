import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as GitHubStrategy } from 'passport-github2';
import features from './features';
import logger from './logger';
// Import User model and controller methods as needed
// For now, we will keep the callbacks simple or import from existing controller if possible

// TODO: Import specific User find/create logic
// import { User } from '../models/user.model'; 

export const setupPassport = () => {
    if (!features.auth.enabled) return;

    passport.serializeUser((user: any, done) => done(null, user));
    passport.deserializeUser((user: any, done) => done(null, user));

    if (features.auth.google) {
        passport.use(new GoogleStrategy({
            clientID: process.env.GOOGLE_CLIENT_ID || 'mock_id',
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'mock_secret',
            callbackURL: '/auth/google/callback'
        }, (accessToken, refreshToken, profile, done) => {
            // Logic to find or create user
            logger.info(`Google Auth Success: ${profile.id}`);
            done(null, profile);
        }));
    }

    if (features.auth.github) {
        passport.use(new GitHubStrategy({
            clientID: process.env.GITHUB_CLIENT_ID || '',
            clientSecret: process.env.GITHUB_CLIENT_SECRET || '',
            callbackURL: process.env.GITHUB_CALLBACK_URL || "http://localhost:3000/auth/github/callback" // Updated default
        },
            // We reuse or adapt the existing callback logic
            (accessToken: string, refreshToken: string, profile: any, done: any) => {
                logger.info(`GitHub Auth Success: ${profile.id}`);
                // Adapt existing create/find logic here
                return done(null, { ...profile, accessToken });
            }));
    }
};
