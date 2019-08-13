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
      },
      {
        file: pkg.module,
        sourcemap: true,
        format: 'esm'
      }
    ],
    plugins: [
      babel({
        exclude: 'node_modules/**'
      }),
      terser()
    ]
  },
  {
    input: './index.js',
    output: {
      file: pkg.browser,
      format: 'umd',
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
