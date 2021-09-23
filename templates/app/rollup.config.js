import { nodeResolve } from '@rollup/plugin-node-resolve';
import { terser } from 'rollup-plugin-terser';
import autoExternal from 'rollup-plugin-auto-external';
import babel from '@rollup/plugin-babel';
import multiInput from 'rollup-plugin-multi-input';

export default {
  input: './src/*.js',
  output: {
    dir: './lib/',
    format: 'cjs'
  },
  plugins: [
    autoExternal(),
    multiInput(),
    nodeResolve(),
    babel({
      babelHelpers: 'runtime'
    }),
    terser()
  ]
};
