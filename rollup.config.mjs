import json from '@rollup/plugin-json';
import babel from '@rollup/plugin-babel';
import terser from '@rollup/plugin-terser';
import eslint from '@rollup/plugin-eslint';
import commonjs from '@rollup/plugin-commonjs';
import multiInput from 'rollup-plugin-multi-input';
import autoExternal from 'rollup-plugin-auto-external';
import { nodeResolve } from '@rollup/plugin-node-resolve';

export default {
  input: './src/**/*.js',
  output: {
    dir: './generators/',
    format: 'esm'
  },
  plugins: [
    eslint(),
    autoExternal(),
    multiInput.default(),
    commonjs(),
    nodeResolve(),
    babel({
      babelHelpers: 'bundled'
    }),
    json(),
    terser()
  ]
};
