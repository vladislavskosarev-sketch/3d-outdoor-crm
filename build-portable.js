const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const projectDir = 'F:\\Fold\\CRM';
const releaseDir = path.join(projectDir, 'release-portable');
const appDir = path.join(releaseDir, '3D-Outdoor-CRM-win32-x64');
const cacheZip = 'C:\\Users\\Skosar\\AppData\\Local\\electron\\Cache\\electron-v31.7.7-win32-x64.zip';
const sevenZip = path.join(projectDir, 'node_modules\\7zip-bin\\win\\x64\\7za.exe');

try {
  console.log('1. Cleaning up previous release folder...');
  if (fs.existsSync(releaseDir)) {
    fs.rmSync(releaseDir, { recursive: true, force: true });
  }
  fs.mkdirSync(appDir, { recursive: true });

  console.log('2. Extracting Electron template...');
  const extractCmd = `"${sevenZip}" x "${cacheZip}" -o"${appDir}" -y`;
  execSync(extractCmd);
  console.log('Electron template extracted successfully.');

  console.log('3. Creating resources/app structure...');
  const resourcesAppDir = path.join(appDir, 'resources', 'app');
  fs.mkdirSync(resourcesAppDir, { recursive: true });

  // Copy dist folder recursively
  console.log('4. Copying dist (frontend build)...');
  copyFolderRecursiveSync(path.join(projectDir, 'dist'), resourcesAppDir);

  // Copy electron folder recursively
  console.log('5. Copying electron (main process)...');
  copyFolderRecursiveSync(path.join(projectDir, 'electron'), resourcesAppDir);

  // Write minimal package.json
  console.log('6. Writing app package.json...');
  const appPackageJson = {
    name: 'crm-3d-outdoor',
    version: '1.0.0',
    main: 'electron/main.js'
  };
  fs.writeFileSync(
    path.join(resourcesAppDir, 'package.json'),
    JSON.stringify(appPackageJson, null, 2)
  );

  console.log('7. Renaming executable...');
  const srcExe = path.join(appDir, 'electron.exe');
  const destExe = path.join(appDir, '3D-Outdoor-CRM.exe');
  let renamed = false;
  
  for (let i = 0; i < 10; i++) {
    try {
      if (fs.existsSync(srcExe)) {
        fs.renameSync(srcExe, destExe);
        renamed = true;
        break;
      }
    } catch (e) {
      console.log(`Rename attempt ${i+1} failed (file locked by OS/Antivirus, retrying in 500ms)...`);
      // Simple synchronous sleep using busy wait or spawn sleep
      try {
        execSync('powershell -Command "Start-Sleep -Milliseconds 500"');
      } catch (err) {}
    }
  }
  
  if (!renamed && !fs.existsSync(destExe)) {
    throw new Error('Could not rename electron.exe to 3D-Outdoor-CRM.exe (file locked by OS/Antivirus)');
  }

  console.log('\n========================================');
  console.log('Success! Portable application built in:');
  console.log(appDir);
  console.log('========================================');

} catch (err) {
  console.error('Build failed:', err);
}

function copyFolderRecursiveSync(source, target) {
  let files = [];

  const targetFolder = path.join(target, path.basename(source));
  if (!fs.existsSync(targetFolder)) {
    fs.mkdirSync(targetFolder, { recursive: true });
  }

  if (fs.lstatSync(source).isDirectory()) {
    files = fs.readdirSync(source);
    files.forEach(function (file) {
      var curSource = path.join(source, file);
      if (fs.lstatSync(curSource).isDirectory()) {
        copyFolderRecursiveSync(curSource, targetFolder);
      } else {
        fs.copyFileSync(curSource, path.join(targetFolder, file));
      }
    });
  }
}
