const esbuild = require('esbuild');

esbuild.buildSync({
  entryPoints: ['src/widget.js'],
  bundle: true,
  minify: true,
  outfile: 'dist/widget.js',
  format: 'iife',
});

console.log('Widget built successfully');
