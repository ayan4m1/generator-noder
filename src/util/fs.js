import { existsSync } from 'fs';
import { mkdirp } from 'mkdirp';

export const wrapFs = (gen) => ({
  copy: (file) => {
    gen.fs.copy(gen.templatePath(file), gen.destinationPath(file));
  },
  copyTo: (source, destination) => {
    gen.fs.copy(gen.templatePath(source), gen.destinationPath(destination));
  },
  copyDirectory: async (dir) => {
    gen.fs.copyTpl(
      gen.templatePath(`${dir}/**/*`),
      gen.destinationPath(dir),
      gen.answers
    );
  },
  copyTemplate: (file) => {
    gen.fs.copyTpl(
      gen.templatePath(existsSync(`${file}.tpl`) ? `${file}.tpl` : file),
      gen.destinationPath(file),
      gen.answers
    );
  },
  createFile: (file, contents) => {
    gen.fs.write(gen.destinationPath(file), contents);
  },
  makeDirectory: mkdirp
});
