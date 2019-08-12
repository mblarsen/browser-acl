import pkg from './package.json'
import babel from 'rollup-plugin-babel'
import {terser} from 'rollup-plugin-terser'

export default [
  {
    input: './index.js',
    output: [
      {
        file: pkg.main,
        format: 'cjs',
        sourcemap: true,
        exports: 'named'
      }, {
        file: pkg.module,
        sourcemap: true,
        format: 'esm'
      }
    ],
    plugins: [terser()]
  },
  {
    input: './index.js',
    output: {
      file: pkg.browser,
      format: 'iife',
      sourcemap: true,
      name: 'BrowserAcl',
      exports: 'named'
    },
    plugins: [
      babel({
        exclude: 'node_modules/**'
      }),
      terser()
    ]
  }
];
