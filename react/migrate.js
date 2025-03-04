const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Project root directory
const ROOT_DIR = __dirname;
const FRONTEND_DIR = path.join(ROOT_DIR, 'frontend');
const BACKEND_DIR = path.join(ROOT_DIR, 'backend');
const SHARED_DIR = path.join(ROOT_DIR, 'shared');

// Create base directories if they don't exist
[FRONTEND_DIR, BACKEND_DIR, SHARED_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) {
    console.log(`Creating directory: ${dir}`);
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Create subdirectories
const frontendDirs = [
  'public',
  'src',
  'src/assets',
  'src/components',
  'src/contexts',
  'src/hooks',
  'src/pages',
  'src/services',
  'src/styles',
  'src/utils',
];

const backendDirs = [
  'config',
  'controllers',
  'middleware',
  'models',
  'routes',
  'services',
  'python',
  'websocket',
  'utils',
];

const sharedDirs = [
  'uploads',
  'public',
  'public/audio',
  'profiles',
  'temp',
];

// Create frontend directories
frontendDirs.forEach(dir => {
  const fullPath = path.join(FRONTEND_DIR, dir);
  if (!fs.existsSync(fullPath)) {
    console.log(`Creating directory: ${fullPath}`);
    fs.mkdirSync(fullPath, { recursive: true });
  }
});

// Create backend directories
backendDirs.forEach(dir => {
  const fullPath = path.join(BACKEND_DIR, dir);
  if (!fs.existsSync(fullPath)) {
    console.log(`Creating directory: ${fullPath}`);
    fs.mkdirSync(fullPath, { recursive: true });
  }
});

// Create shared directories
sharedDirs.forEach(dir => {
  const fullPath = path.join(SHARED_DIR, dir);
  if (!fs.existsSync(fullPath)) {
    console.log(`Creating directory: ${fullPath}`);
    fs.mkdirSync(fullPath, { recursive: true });
  }
});

// Move files from src to frontend/src
try {
  if (fs.existsSync(path.join(ROOT_DIR, 'src'))) {
    console.log('Moving files from src to frontend/src...');
    
    // Copy directories recursively
    const srcPath = path.join(ROOT_DIR, 'src');
    const destPath = path.join(FRONTEND_DIR, 'src');
    
    // Use different commands based on OS
    if (process.platform === 'win32') {
      // Windows
      execSync(`xcopy "${srcPath}" "${destPath}" /E /I /Y`);
    } else {
      // Linux/Mac
      execSync(`cp -R "${srcPath}/." "${destPath}/"`);
    }
    
    console.log('Files moved successfully!');
  } else {
    console.log('src directory does not exist, skipping move operation.');
  }
} catch (error) {
  console.error(`Error moving files: ${error.message}`);
}

// Create package.json files if they don't exist
const createPackageJson = (dir, content) => {
  const packagePath = path.join(dir, 'package.json');
  if (!fs.existsSync(packagePath)) {
    console.log(`Creating package.json in ${dir}`);
    fs.writeFileSync(packagePath, JSON.stringify(content, null, 2));
  }
};

// Root package.json
const rootPackageJson = {
  "name": "avaass",
  "version": "1.0.0",
  "description": "Advanced Voice and Audio Assistance for Stammering Support",
  "scripts": {
    "start": "concurrently \"npm run server\" \"npm run client\"",
    "client": "npm start --prefix frontend",
    "server": "npm run dev --prefix backend",
    "install-all": "npm install && npm install --prefix frontend && npm install --prefix backend",
    "build": "npm run build --prefix frontend",
    "dev": "concurrently \"npm run server\" \"npm run client\"",
    "migrate": "node migrate.js"
  },
  "keywords": ["speech", "accessibility", "stutter", "text-to-speech"],
  "author": "AVAASS Team",
  "license": "ISC",
  "devDependencies": {
    "concurrently": "^7.6.0"
  }
};

// Frontend package.json
const frontendPackageJson = {
  "name": "avaass-frontend",
  "version": "0.1.0",
  "private": true,
  "dependencies": {
    "@testing-library/jest-dom": "^5.16.5",
    "@testing-library/react": "^13.4.0",
    "@testing-library/user-event": "^13.5.0",
    "axios": "^1.4.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-icons": "^4.10.1",
    "react-router-dom": "^6.14.2",
    "react-scripts": "5.0.1",
    "three": "^0.154.0",
    "web-vitals": "^2.1.4"
  },
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build",
    "test": "react-scripts test",
    "eject": "react-scripts eject"
  },
  "proxy": "http://localhost:5001",
  "eslintConfig": {
    "extends": [
      "react-app",
      "react-app/jest"
    ]
  },
  "browserslist": {
    "production": [
      ">0.2%",
      "not dead",
      "not op_mini all"
    ],
    "development": [
      "last 1 chrome version",
      "last 1 firefox version",
      "last 1 safari version"
    ]
  }
};

// Backend package.json
const backendPackageJson = {
  "name": "avaass-backend",
  "version": "1.0.0",
  "description": "Backend server for AVAASS",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js",
    "test": "echo \"Error: no test specified\" && exit 1"
  },
  "dependencies": {
    "bcryptjs": "^2.4.3",
    "cookie-parser": "^1.4.6",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1",
    "express": "^4.18.2",
    "jsonwebtoken": "^9.0.1",
    "mongoose": "^7.4.0",
    "morgan": "^1.10.0",
    "multer": "^1.4.5-lts.1",
    "nodemailer": "^6.9.4",
    "uuid": "^9.0.0",
    "ws": "^8.13.0"
  },
  "devDependencies": {
    "nodemon": "^3.0.1"
  }
};

createPackageJson(ROOT_DIR, rootPackageJson);
createPackageJson(FRONTEND_DIR, frontendPackageJson);
createPackageJson(BACKEND_DIR, backendPackageJson);

console.log('Migration script completed successfully!');
