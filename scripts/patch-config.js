const fs = require('fs');
const path = require('path');

const dir = process.argv[2];

// package.json
const pkgPath = path.join(dir, 'package.json');
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
pkg.main = 'expo-router/entry';
pkg.scripts = { ...pkg.scripts, test: 'jest', typecheck: 'tsc --noEmit' };
pkg.jest = { preset: 'jest-expo', testMatch: ['<rootDir>/tests/**/*.test.ts'] };
fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));

// app.json
const appPath = path.join(dir, 'app.json');
const app = JSON.parse(fs.readFileSync(appPath, 'utf8'));
const expo = app.expo;
expo.name = 'DrinkFit';
expo.slug = 'drinkfit';
expo.scheme = 'drinkfit';
expo.orientation = 'portrait';
expo.userInterfaceStyle = 'dark';
expo.backgroundColor = '#121417';
expo.android = { ...(expo.android || {}), package: 'com.drinkfit.app' };
expo.plugins = expo.plugins || [];
for (const p of ['expo-router', 'expo-secure-store']) {
  const exists = expo.plugins.some((x) => x === p || (Array.isArray(x) && x[0] === p));
  if (!exists) expo.plugins.push(p);
}
fs.writeFileSync(appPath, JSON.stringify(app, null, 2));

console.log('DrinkFit config patched ✓');
