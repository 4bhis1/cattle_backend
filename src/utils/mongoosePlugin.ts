import mongoose from 'mongoose';
import { getContextValue } from './context';

export const globalContextPlugin = (schema: mongoose.Schema) => {
    schema.pre('save', function (next) {
        const user: any = getContextValue('user');
        
        if (user) {
             // Auto-inject organisation_id if it exists in schema and not set in document
             if (schema.path('organisation_id') && !this.get('organisation_id') && user.organisation_id) {
                 this.set('organisation_id', user.organisation_id);
             }

             // Auto-inject user_id / createdBy if needed (Example usage)
             // if (schema.path('user_id') && !this.get('user_id')) {
             //    this.set('user_id', user._id);
             // }
        }
        
        next();
    });
};
