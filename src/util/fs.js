import mkdirp from 'mkdirp';

export default gen => ({
  copy: file => {
    gen.fs.copy(gen.templatePath(file), gen.destinationPath(file));
  },
  copyDirectory: async dir => {
    gen.fs.copyTpl(
      gen.templatePath(`${dir}/**/*`),
      gen.destinationPath(dir),
      gen.answers
    );
  },
  copyTemplate: file => {
    gen.fs.copyTpl(
      gen.templatePath(file),
      gen.destinationPath(file),
      gen.answers
    );
  },
  createFile: (file, contents) => {
    gen.fs.write(gen.destinationPath(file), contents);
  },
  makeDirectory: mkdirp
});
