'use strict';

/**
 * Test the basic work flow of a Rekit project. Also test Rekit plugins 'redux-saga' and 'selector'.
 * There should be 'rekit-core', 'rekit-portal' as sibling folders of 'rekit' to run the test script:
 * - workspace
 * |-- rekit
 * |-- rekit-core
 * |-- rekit-portal
 * |-- rekit-plugin-redux-saga
 * |-- rekit-plugin-selector
 *
 * It does below things:
 * 1. Install Rekit globally (first uninstall and unlink Rekit).
 * 2. Create an app using less
 * 3. Install dependencies of the app using yarn
 * 4. Runt 'npm test' and check success.
 * 5. Create a public plugin named 'rekit-plugin-public-test', generate a dummy js module
 * 6. Config the plugin in the app
 * 7. Run 'rekit add sanity-test home/pt1', check result.
 * 8. Run 'rekit mv public-test home/pt1 home/pt2', then check result.
 * 9. Run 'rekit rm public-test home/pt1 home/pt2', then check result.
 * 10. Create a local plugin named 'rekit-plugin-local-test', generate a dummy js module
 * 11. Run 'rekit add local-test home/lt1', check result.
 * 12. Run 'rekit mv local-test home/lt1 home/lt2', then check result.
 * 13. Run 'rekit rm local-test home/lt1 home/lt2', then check result.
 * 14. npm start
 * 15. Open browser for app and portal, manually test it.
**/

// Run this test before published to npm, it simulates a clean env for ensure rekit command could
// be installed globally and rekit-core, rekit-portal works as expected.


// 1. Uninstall rekit -g, npm unlink rekit from rekit folder.
// 2. Install rekit to global from local folder
// 3. run rekit create to create an app
// 4. install app (optional use local rekit-core and rekit-portal)
// 5. app test should pass
// 6. npm start for manually test

const path = require('path');
const shell = require('shelljs');
const expect = require('chai').expect;
const ArgumentParser = require('argparse').ArgumentParser;

const parser = new ArgumentParser({
  addHelp: true,
  description: 'Integration test.',
});

parser.addArgument(['--local-core'], {
  help: 'Whether to use local rekit-core. Otherwise install from npm repository.',
  action: 'storeTrue',
});

parser.addArgument(['--local-portal'], {
  help: 'Whether to use local rekit-portal. Otherwise install from npm repository.',
  action: 'storeTrue',
});

const args = parser.parseArgs();

function exec(cmd, opts) {
  expect(shell.exec(cmd, opts || {}).code).to.equal(0, 'Command failed, exit code should be 0');
}

const appName = 'a-rekit-npm-test-app';
const prjRoot = path.join(__dirname, '..');
const appRoot = path.join(prjRoot, '../', appName);
const appPkgJsonPath = path.join(appRoot, 'package.json');

// Remove app folder
shell.rm('-rf', appRoot);

// Uninstall Rekit globally and unlink it.
console.log('Uninstalling Rekit globally......');
exec('npm uninstall -g rekit');

console.log('Unlinking Rekit......');
exec('npm unlink', { cwd: prjRoot });

// Install Rekit globally from local folder
console.log('Install Rekit globally from local folder...');
exec(`npm install -g ${prjRoot}`);

// Create a Rekit app
console.log('Create a new Rekit app...');
exec(`rekit create ${appName}`, { cwd: path.join(prjRoot, '..') });

const pkg = require(appPkgJsonPath); // eslint-disable-line
if (args.local_core) {
  // Use local rekit-core
  console.log('Use local rekit core optionally');
  pkg.devDependencies['rekit-core'] = path.join(prjRoot, '../rekit-core');
  shell.ShellString(JSON.stringify(pkg)).to(appPkgJsonPath);
}

if (args.local_portal) {
  // Use local rekit-portal
  console.log('Use local rekit portal optionally');
  pkg.devDependencies['rekit-portal'] = path.join(prjRoot, '../rekit-portal');
  shell.ShellString(JSON.stringify(pkg)).to(appPkgJsonPath);
}

// Install deps
console.log('Install deps for the app...');
exec('yarn', { cwd: appRoot });

// Run tests
console.log('Run test for the app...');
// exec('npm test', { cwd: appRoot });

// Create a public plugin: rekit-plugin-public-test
console.log('Create a public plugin');
const publicPluginRoot = path.join(appRoot, '../rekit-plugin-public-test');
shell.rm('-rf', publicPluginRoot);
exec('rekit create-plugin public-test', { cwd: path.join(appRoot, '../') });
exec('npm link', { cwd: publicPluginRoot });
exec('npm link rekit-plugin-public-test', { cwd: appRoot });
pkg.rekit.plugins.push('public-test');
shell.ShellString(JSON.stringify(pkg)).to(appPkgJsonPath);
shell.cat(path.join(__dirname, 'sanity/pluginSample.js')).to(path.join(publicPluginRoot, 'publicTest.js'));
exec('rekit add public-test home/my-cls', { cwd: appRoot });
expect(shell.exists(path.join(appRoot, 'src/features/home/MyCls.js'))).to.be.true;
exec('rekit mv public-test home/my-cls home/my-cls-2', { cwd: appRoot });
expect(shell.exists(path.join(appRoot, 'src/features/home/MyCls.js'))).to.be.false;
expect(shell.exists(path.join(appRoot, 'src/features/home/MyCls2.js'))).to.be.true;
exec('rekit mv public-test home/my-cls-2 common/my-cls', { cwd: appRoot });
expect(shell.exists(path.join(appRoot, 'src/features/home/MyCls2.js'))).to.be.false;
expect(shell.exists(path.join(appRoot, 'src/features/common/MyCls.js'))).to.be.true;
exec('rekit rm public-test common/my-cls', { cwd: appRoot });
expect(shell.exists(path.join(appRoot, 'src/features/common/MyCls.js'))).to.be.false;

// Create a local plugin: rekit-plugin-local-test
console.log('Create a local plugin');
const localPluginRoot = path.join(appRoot, './tools/plugins/rekit-plugin-local-test');
exec('rekit create-plugin local-test', { cwd: appRoot });
shell.cat(path.join(__dirname, 'sanity/pluginSample.js')).to(path.join(localPluginRoot, 'localTest.js'));
exec('rekit add local-test home/my-cls', { cwd: appRoot });
expect(shell.exists(path.join(appRoot, 'src/features/home/MyCls.js'))).to.be.true;
exec('rekit mv local-test home/my-cls home/my-cls-2', { cwd: appRoot });
expect(shell.exists(path.join(appRoot, 'src/features/home/MyCls.js'))).to.be.false;
expect(shell.exists(path.join(appRoot, 'src/features/home/MyCls2.js'))).to.be.true;
exec('rekit mv local-test home/my-cls-2 common/my-cls', { cwd: appRoot });
expect(shell.exists(path.join(appRoot, 'src/features/home/MyCls2.js'))).to.be.false;
expect(shell.exists(path.join(appRoot, 'src/features/common/MyCls.js'))).to.be.true;
exec('rekit rm local-test common/my-cls', { cwd: appRoot });
expect(shell.exists(path.join(appRoot, 'src/features/common/MyCls.js'))).to.be.false;

// Start the server
console.log('Start the app...');
exec('npm start', { cwd: appRoot });
