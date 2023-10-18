const { exec, execSync } = require('child_process');
const path = require('path');
 
// ENV Constants
const {
  RELEASE_NAME = 'node8.stable.tar.gz',
  CDN_PATH = 'ubuntu@cdn.vpc.hackerrank.com:/mnt/www/cdn/fcore',
  HACKERRANK_CDN = 'ubuntu@cdn.vpc.hackerrank.com:/mnt/www/cdn/hackerrank',
  DESTINATION = 'private',
  LOG_FILE = '/tmp/node8.log',
  BACKEND_ENDPOINT = 'https://www.hackerrank.com/',
  APP_NAME = 'frontend-core',
  NODE_NAME = 'master',
  SERVER = 'ubuntu@10.10.2.239',
  REVERT_MANIFEST = 'false',
} = process.env;
 
const STAGING_SOURCEMAP_PATH = 'ubuntu@staging.hackerrank.net:/mnt/www/fcore-sourcemaps';
 
const S3_BUCKET_MAPPING = {
  private: {
    'frontend-core': 'prodpush/fcore/private',
  },
  production: {
    'frontend-core': 'prodpush/fcore/production',
  },
};
 
const CURRENT_EPOCH = Math.floor(Date.now() / 1000);
 
const spawnedChilds = [];
 
const isPrivateBuild = DESTINATION === 'private';
const isProductionBuild = DESTINATION === 'production';
 
function cleanup() {
  spawnedChilds.forEach(
    proc => proc && typeof proc.kill === 'function' && proc.kill()
  );
}
 
function registerChildProcess(proc) {
  spawnedChilds.push(proc);
}
 
/**
 * Always exit the process with error code 2 from here. This will help us identify
 * if the exit was through the .catch or from these generic handlers.
 */
process.on('unhandledRejection', (reason) => {
  cleanup();
  // eslint-disable-next-line no-console
  console.log(reason);
  process.exit(2);
});
 
process.on('uncaughtException', (...args) => {
  cleanup();
  // eslint-disable-next-line no-console
  console.log(JSON.stringify(args, null, 4));
  process.exit(2);
});
 
function interruptExit() {
  cleanup();
  // On external interrupts, exit the application with exit code as 3.
  process.exit(3);
}
 
process.on('SIGINT', interruptExit);
process.on('SIGTERM', interruptExit);
 
 
/**
 * Resolves a file from the root of the project.
 */
function resolveFromRoot(...dir) {
  return path.join(__dirname, '../../', ...dir);
}
 
function getYarnInstallDir() {
  return path.join('/tmp/tmp_yarn_installs', NODE_NAME);
}
 
/**
 * Helper function which executes a bash command on invoking a new shell
 * and writes to the file using unix pipes. This function can be awaited.
 */
function runBash(cmd, opts = {}) {
  const {
    captureStdout = true,
    captureStderr = true,
  } = opts;
 
  const stdoutDestination = captureStdout ? LOG_FILE : '/dev/null';
  const stderrDestination = captureStderr ? LOG_FILE : '/dev/null';
 
  cmd += ` > ${stdoutDestination} 2> ${stderrDestination}`;
 
  return new Promise((resolve, reject) => {
    const childProcess = exec(cmd);
    registerChildProcess(childProcess);
 
    const callback = (statusCode) => {
      if (statusCode === 0) {
        resolve();
        return;
      }
      reject();
    };
 
    childProcess.on('close', callback);
    childProcess.on('exit', callback);
  });
}
 
function getS3RealPath(releaseName = RELEASE_NAME) {
  const bucketName = S3_BUCKET_MAPPING[DESTINATION][APP_NAME];
  return `s3://${bucketName}/${releaseName}`;
}
 
// Deployment methods
async function yarnInstall() {
  // eslint-disable-next-line no-console
  console.log('Running yarn build concurrently with --production flag');
 
  const dir = getYarnInstallDir();
 
  return runBash(`
    mkdir -p ${dir} && \
    cp package.json ${dir} && \
    cp .npmrc ${dir} && \
    cd ${dir} && \
    yarn install --production && \
  `);
}
 
async function createTarball() {
  // eslint-disable-next-line no-console
  console.log('Creating a tarball...');
  const globs = [
    'dist',
    'public',
    'config',
    'app.js',
    'cluster.js',
    'master-config.json',
    'newrelic.js',
    'package.json',
    '.npmrc',
  ].join(' ');
 
  const outputPath = path.join(resolveFromRoot('./releases'), RELEASE_NAME);
  const dir = getYarnInstallDir();
 
  const excludeSrcMap = isProductionBuild ? "--exclude='public/assets/sourcemaps'" : '';
  const cmd = `mkdir -p releases && tar ${excludeSrcMap} -zcf ${outputPath} ${globs} -C ${dir} node_modules`;
 
  return runBash(cmd);
}
 
async function build() {
  // eslint-disable-next-line no-console
  console.log('Running webpack build...');
 
  await runBash('yarn install');
 
  const nodeEnv = isPrivateBuild ? `DEPLOYMENT_NODE=${NODE_NAME} CDN=/react-assets` : '';
 
  return runBash(`${nodeEnv} yarn build`);
}
 
function revert_release_manifest() {
  const release_type = (DESTINATION === 'production') ? 'stable' : 'latest';
  const manifestPath = 's3://prodpush/manifests/fcore';
 
  return runBash(`aws s3 cp ${manifestPath}/${release_type}.previous.txt ${manifestPath}/${release_type}.txt`);
}
 
async function copyToS3() {
  // eslint-disable-next-line no-console
  console.log('Starting copying to S3...');
 
  const releasePath = path.join(resolveFromRoot('./releases'), RELEASE_NAME);
 
  if (isProductionBuild) {
    const s3Path = getS3RealPath(`${CURRENT_EPOCH}/node8.tar.gz`);
 
    const checksum = execSync(`sha1sum ${releasePath} --text | awk '{print $1}'`).toString().trim();
    const relativePath = s3Path.split('prodpush')[1].slice(1);
 
    const manifestPath = 's3://prodpush/manifests/fcore';
    const latestPath = getS3RealPath('latest.tar.gz');
 
    // Write a temp file to releases folder to sync with s3
    execSync(`echo '${checksum}|${relativePath}|${CURRENT_EPOCH}' >  /mnt/node/tmp/fcore.latest.txt`);
 
    execSync(`aws s3 cp ${manifestPath}/latest.txt ${manifestPath}/latest.previous.txt`);
 
    return Promise.all([
      runBash(`aws s3 cp ${releasePath} ${s3Path}`),
      runBash(`aws s3 cp ${releasePath} ${latestPath}`),
      runBash(`aws s3 cp /mnt/node/tmp/fcore.latest.txt ${manifestPath}/latest.txt`),
    ]);
  }
 
  const s3Path = getS3RealPath();
 
  return runBash(`aws s3 cp ${releasePath} ${s3Path}`);
}
 
async function rsyncWithCdn() {
  if (isPrivateBuild) return;
 
  // eslint-disable-next-line no-console
  console.log('Rsyncing to CDN...');
 
  const publicAssets = path.join(resolveFromRoot('./public/assets'));
 
  const rsyncCmd = 'rsync --archive --checksum --compress --quiet --exclude=sourcemaps';
 
  return Promise.all([runBash(`${rsyncCmd} ${publicAssets} ${CDN_PATH}`), runBash(`${rsyncCmd} ${publicAssets} ${HACKERRANK_CDN}`)]);
}
 
async function restartPrivateServer() {
  // eslint-disable-next-line no-console
  console.log('Restarting server...');
 
  const dir = `/mnt/node/${APP_NAME}/${NODE_NAME}`;
  const s3Path = getS3RealPath();
 
  const cmd = `ssh ${SERVER} 'NODE_PATH=${dir} NODE_NAME=${NODE_NAME} BACKEND_ENDPOINT=${BACKEND_ENDPOINT} RELEASE_PATH=${s3Path} RELEASE_NAME=${RELEASE_NAME} /home/ubuntu/frontend_deploy.sh'`;
 
  return runBash(cmd);
}
 
async function copyTarToArchives() {
  if (isPrivateBuild) return;
 
  const tarPath = path.join(resolveFromRoot('./releases'), RELEASE_NAME);
  const archivePath = path.join('/mnt/archives/fcore/production', CURRENT_EPOCH.toString());
 
  const cmd = `mkdir -p ${archivePath} && cp ${tarPath} ${archivePath}`;
 
  return runBash(cmd);
}
 
function testPerformance() {
  return runBash(`RELEASE_VERSION=${CURRENT_EPOCH} NODE_ENV=production yarn hr perf/test-perf`);
}
 
function pushSourceMapToSentry() {
  ['hrc', 'hrw'].forEach((project) => {
    runBash(`sentry-cli releases -p ${project} files ${CURRENT_EPOCH} upload-sourcemaps --url-prefix https://staging.hackerrank.net/react-assets/sourcemaps public/assets/sourcemaps`);
  });
}
 
async function pushSourceMapToServer() {
  const sourcemaps = path.join(resolveFromRoot('./public/assets/sourcemaps'));
 
  return runBash(`rsync --archive --checksum --compress --quiet ${sourcemaps} ${STAGING_SOURCEMAP_PATH}`);
}
 
async function main() {
  if (REVERT_MANIFEST === 'true') {
    revert_release_manifest();
    return;
  }
 
  //use node 8 latest version
  await runBash('sudo n 8.16.2');
 
  await yarnInstall();
 
  await build();
 
  await createTarball();
 
  await Promise.all([copyToS3(), rsyncWithCdn(), copyTarToArchives()]);
 
  if (isPrivateBuild) {
    await restartPrivateServer();
  }
 
  // if (isProductionBuild) {
  //   //test performance
  //   testPerformance();
 
  //   //push source maps to sentry
  //   pushSourceMapToSentry();
 
  //   //push source maps to staging server
  //   pushSourceMapToServer();
  // }
}
 
main()
  .catch((reason) => {
    // eslint-disable-next-line no-console
    console.log('****** Encountered an error while deploying ******');
    if (reason) {
      // eslint-disable-next-line no-console
      console.log(reason);
    }
    // This will let hackzoid know that prod push failed.
    process.exit(1);
  });
