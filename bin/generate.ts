#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

const moduleName = process.argv[2];

if (!moduleName) {
    console.error('Please provide a module name. Usage: npm run generate <moduleName>');
    process.exit(1);
}

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const ModuleName = capitalize(moduleName);

const moduleDir = path.join(process.cwd(), 'src', 'modules', moduleName);

if (fs.existsSync(moduleDir)) {
    console.error(`Module ${moduleName} already exists.`);
    process.exit(1);
}

fs.mkdirSync(moduleDir, { recursive: true });

// 1. Controller
const controllerContent = `import { Request, Response, NextFunction } from 'express';
import { BaseController } from '../../controllers/BaseController';
import { ${ModuleName} } from './${moduleName}.model';
import { AppError } from '../../utils/AppError';

export class ${ModuleName}Controller extends BaseController {
  
  create = async (req: Request, res: Response, next: NextFunction) => {
    const doc = await ${ModuleName}.create(req.body);
    this.sendResponse(res, 201, '${ModuleName} created', doc);
  };

  getAll = async (req: Request, res: Response, next: NextFunction) => {
    const docs = await ${ModuleName}.find();
    this.sendResponse(res, 200, '${ModuleName}s fetched', docs);
  };

  getOne = async (req: Request, res: Response, next: NextFunction) => {
    const doc = await ${ModuleName}.findById(req.params.id);
    if (!doc) return next(new AppError('No document found', 404));
    this.sendResponse(res, 200, '${ModuleName} fetched', doc);
  };

  update = async (req: Request, res: Response, next: NextFunction) => {
    const doc = await ${ModuleName}.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!doc) return next(new AppError('No document found', 404));
    this.sendResponse(res, 200, '${ModuleName} updated', doc);
  };

  delete = async (req: Request, res: Response, next: NextFunction) => {
    const doc = await ${ModuleName}.findByIdAndDelete(req.params.id);
    if (!doc) return next(new AppError('No document found', 404));
    this.sendResponse(res, 204, '${ModuleName} deleted', null);
  };
}
`;
fs.writeFileSync(path.join(moduleDir, `${moduleName}.controller.ts`), controllerContent);

// 2. Model
const modelContent = `import mongoose, { Schema, Document } from 'mongoose';

export interface I${ModuleName} extends Document {
  name: string;
  // Add interface properties
}

const ${ModuleName}Schema: Schema = new Schema(
  {
    name: { type: String, required: true },
    // Add schema definition
  },
  { timestamps: true }
);

export const ${ModuleName} = mongoose.model<I${ModuleName}>('${ModuleName}', ${ModuleName}Schema);
`;
fs.writeFileSync(path.join(moduleDir, `${moduleName}.model.ts`), modelContent);

// 3. Routes
const routesContent = `import { Router } from 'express';
import { ${ModuleName}Controller } from './${moduleName}.controller';
import { protect } from '../../middleware/auth.middleware';
import { catchAsync } from '../../utils/catchAsync';

const router = Router();
const controller = new ${ModuleName}Controller();

// router.use(protect()); // Uncomment to protect all routes

router
  .route('/')
  .get(catchAsync(controller.getAll.bind(controller)))
  .post(catchAsync(controller.create.bind(controller)));

router
  .route('/:id')
  .get(catchAsync(controller.getOne.bind(controller)))
  .patch(catchAsync(controller.update.bind(controller)))
  .delete(catchAsync(controller.delete.bind(controller)));

export default router;
`;
fs.writeFileSync(path.join(moduleDir, `${moduleName}.routes.ts`), routesContent);

console.log(`✅ Module ${moduleName} created at src/modules/${moduleName}`);
console.log(`\n🔔 Don't forget to register the routes in src/routes/index.ts:`);
console.log(`import ${moduleName}Routes from '../modules/${moduleName}/${moduleName}.routes';`);
console.log(`router.use('/${moduleName}s', ${moduleName}Routes);`);
