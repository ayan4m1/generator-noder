import json from '@rollup/plugin-json';
import babel from '@rollup/plugin-babel';
import terser from '@rollup/plugin-terser';
import eslint from '@rollup/plugin-eslint';
import commonjs from '@rollup/plugin-commonjs';
import autoExternal from 'rollup-plugin-auto-external';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import multiInput from '@ayan4m1/rollup-plugin-multi-input';

export default {
  input: './src/**/*.js',
  output: {
    dir: './generators/',
    format: 'esm'
  },
  plugins: [
    eslint(),
    autoExternal(),
    multiInput(),
    commonjs(),
    nodeResolve(),
    babel({
      babelHelpers: 'bundled'
    }),
    json(),
    terser()
  ]
};
