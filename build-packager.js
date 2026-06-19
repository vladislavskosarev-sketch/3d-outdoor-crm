const packager = require('electron-packager');

async function bundle() {
  console.log('Starting packaging via electron-packager...');
  try {
    const appPaths = await packager({
      dir: '.',
      name: '3D-Outdoor-CRM',
      platform: 'win32',
      arch: 'x64',
      out: 'release-portable',
      overwrite: true,
      prune: true
    });
    console.log(`Successfully packaged app to: ${appPaths}`);
  } catch (err) {
    console.error('Packaging failed:');
    console.error(err);
  }
}

bundle();
