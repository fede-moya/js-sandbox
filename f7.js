const { execSync } = require('child_process');
const glob = require('glob');
const fs = require('fs');
 
/**
 *  Make sure stable directory is present and rsync the latest build
 *  to it.
 */
 
// eslint-disable-next-line no-console
console.log('Rsyncing frontend to stable directory');
execSync("mkdir -p /mnt/node/frontend-core_production/stable && rsync --archive --quiet --delete-after --exclude='.*/' /mnt/node/frontend-core_production/latest/ /mnt/node/frontend-core_production/stable");
 
/**
 * Read the version of the latest release
 */
const file = '/mnt/node/tmp/fcore.latest.txt';
 
if (!fs.existsSync(file)) {
  // eslint-disable-next-line no-console
  console.error('Frontend version file not found.');
  process.exit(1);
}
 
// eslint-disable-next-line no-console
console.log('Reading the frontend version file');
const version = fs.readFileSync(file, 'utf-8').trim().split('|')[2];
 
/**
 * Use the version to create a release folder
 */
// eslint-disable-next-line no-console
console.log('Copying tarball to archives');
const releasePath = `/mnt/archives/fcore/production/${version}`;
execSync(`mkdir -p ${releasePath}`);
execSync(`if [ -f ${releasePath}/node8.tar.gz ]; then rm ${releasePath}/node8.tar.gz; fi`);
execSync(`cp /mnt/node/frontend-core_production/stable/releases/latest.tar.gz ${releasePath}/node8.tar.gz`);
 
/**
 * Change the s3 paths
    - stable.txt -> current production release
    - stable.previous.txt -> previous production release
    - latest.txt -> current staging release
    - latest.previous.txt -> previous staging release
 */
 
// eslint-disable-next-line no-console
console.log('Syncing manifest and renaming files on S3');
// Make the latest.tar.gz into stable.tar.gz
execSync('aws s3 cp s3://prodpush/fcore/production/latest.tar.gz s3://prodpush/fcore/production/stable.tar.gz');
 
// change stable to stable.previous
execSync('aws s3 cp s3://prodpush/manifests/fcore/stable.txt s3://prodpush/manifests/fcore/stable.previous.txt');
 
// change latest to stable
execSync('aws s3 cp s3://prodpush/manifests/fcore/latest.txt s3://prodpush/manifests/fcore/stable.txt');
 
// eslint-disable-next-line no-console
console.log('Persisting last commit hash to a file');
// Save the last revision where prod push happened
execSync('git rev-parse HEAD > /mnt/node/tmp/fcore.revision.txt');
