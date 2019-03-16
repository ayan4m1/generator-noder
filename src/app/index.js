import { join } from 'path';
import gulpIf from 'gulp-if';
import { format } from 'date-fns';
import fileSystem from '../util/fs';
import prettier from 'gulp-prettier';
import request from 'request-promise-native';
import spdxIdentifiers from 'spdx-license-ids';

spdxIdentifiers.push('SEE LICENSE IN LICENSE');
spdxIdentifiers.sort();

// we cannot use ES6 imports on this object, as it directly exports a class to
// module.exports - no default export nor a named export is present for us to use
const Generator = require('yeoman-generator');

const packages = {
  lintStaged: ['husky', 'lint-staged'],
  core: ['cosmiconfig', 'winston'],
  esdoc: ['esdoc', 'esdoc-ecmascript-proposal-plugin', 'esdoc-standard-plugin'],
  jest: ['babel-jest', 'eslint-plugin-jest', 'jest', 'react-test-renderer'],
  dev: [
    '@babel/core',
    '@babel/plugin-proposal-object-rest-spread',
    '@babel/preset-env',
    '@babel/register',
    'babel-eslint',
    'eslint',
    'eslint-config-prettier',
    'eslint-import-resolver-webpack',
    'eslint-loader',
    'eslint-plugin-import',
    'eslint-plugin-prettier',
    'opener',
    'prettier',
    'prettier-eslint'
  ]
};
const files = {
  core: ['.babelrc', '.gitignore', '.prettierrc', '.editorconfig'],
  templated: ['.eslintrc.js', 'package.json'],
  esdoc: ['.esdoc.json'],
  jest: ['jest.config.js'],
  lintStaged: ['.huskyrc', '.lintstagedrc']
};
const scripts = {
  esdoc: {
    'build:documentation': 'esdoc',
    'view:documentation': 'opener ./docs/index.html'
  },
  jest: {
    test: 'jest',
    'view:coverage': 'opener ./coverage/index.html'
  }
};

export default class extends Generator {
  constructor(...args) {
    super(...args);

    this.env.adapter.promptModule.registerPrompt(
      'autocomplete',
      require('inquirer-autocomplete-prompt')
    );
    this.sourceRoot(join(__dirname, '..', '..', 'templates', 'app'));

    this.answers = {};
    this.fileSystem = fileSystem(this);
    this.registerTransformStream(gulpIf(/\.js$/, prettier()));
  }

  async prompting() {
    const { name, email } = this.user.git;

    this.answers = await this.prompt([
      {
        type: 'input',
        name: 'package.name',
        message: 'Package name',
        default: this.appname
      },
      {
        type: 'input',
        name: 'package.version',
        message: 'Package version',
        default: '0.1.0'
      },
      {
        type: 'autocomplete',
        name: 'package.license',
        message: 'Package license',
        source: (_, input) => {
          const pattern = new RegExp(`.*${input}.*`, 'i');

          return new Promise(resolve => {
            resolve(
              spdxIdentifiers.filter(identifier => pattern.test(identifier))
            );
          });
        }
      },
      {
        type: 'input',
        name: 'package.description',
        message: 'Package description'
      },
      {
        type: 'input',
        name: 'author.name',
        message: 'Author name',
        default: name()
      },
      {
        type: 'input',
        name: 'author.email',
        message: 'Author email address',
        default: email()
      },
      {
        type: 'confirm',
        name: 'flags.addLintStaged',
        message: 'Force linting before commits?',
        default: true
      },
      {
        type: 'confirm',
        name: 'flags.addFontAwesome',
        message: 'Add Font Awesome?',
        default: true
      },
      {
        type: 'confirm',
        name: 'flags.addRedux',
        message: 'Add Redux?',
        default: true
      },
      {
        type: 'confirm',
        name: 'flags.addJest',
        message: 'Add Jest?',
        default: true
      },
      {
        type: 'confirm',
        name: 'flags.addStorybook',
        message: 'Add Storybook?',
        default: false
      },
      {
        type: 'checkbox',
        name: 'flags.storybookAddons',
        message: 'Which Storybook addons would you like to use?',
        choices: [
          'actions',
          'links',
          'knobs',
          'notes',
          'info',
          'options',
          'console',
          'backgrounds',
          'a11y',
          'viewport',
          'storyshots',
          'storysource',
          'google-analytics'
        ],
        when: answers => answers.flags.addStorybook === true
      },
      {
        type: 'confirm',
        name: 'flags.addESDoc',
        message: 'Add ESDoc?',
        default: false
      }
    ]);
  }

  async writing() {
    const {
      flags,
      package: { license },
      author: { name, email }
    } = this.answers;

    let licenseText = 'Place your license here.\n';

    if (license !== 'SEE LICENSE IN LICENSE') {
      this.log(`Downloading ${license} license from spdx/license-list-data...`);
      const rawLicense = await request(
        `https://raw.githubusercontent.com/spdx/license-list-data/master/text/${license}.txt`
      );

      licenseText = rawLicense
        .replace('<year>', format(new Date(), 'YYYY'))
        .replace('<copyright holders>', `${name} <${email}>`);
    }
    this.fileSystem.createFile('LICENSE', licenseText);

    // copy files and directories
    files.core.forEach(this.fileSystem.copy);
    files.templated.forEach(this.fileSystem.copyTemplate);

    if (flags.addJest) {
      files.jest.forEach(this.fileSystem.copy);
      this.fs.append(this.destinationPath('.gitignore'), 'coverage/');
      this.fs.extendJSON(this.destinationPath('package.json'), {
        scripts: {
          ...scripts.jest
        }
      });
    }

    if (flags.addESDoc) {
      files.esdoc.forEach(this.fileSystem.copy);
      this.fs.append(this.destinationPath('.gitignore'), 'docs/');
      this.fs.extendJSON(this.destinationPath('package.json'), {
        scripts: {
          ...scripts.esdoc
        }
      });
    }

    if (flags.addLintStaged) {
      files.lintStaged.forEach(this.fileSystem.copy);
    }
  }

  install() {
    const main = [];
    const dev = [];
    const { flags } = this.answers;

    this.log('Building a list of packages to install');

    main.push.apply(main, packages.core);
    dev.push.apply(dev, packages.dev);

    if (flags.addLintStaged) {
      dev.push.apply(dev, packages.lintStaged);
    }

    if (flags.addJest) {
      dev.push.apply(dev, packages.jest);
    }

    if (flags.addESDoc) {
      main.push.apply(main, packages.esdoc);
    }

    this.log(
      `Getting ready to install ${main.length} dependencies and ${
        dev.length
      } dev dependencies.`
    );
    this.npmInstall(main, { save: true });
    this.npmInstall(dev, { 'save-dev': true });
  }
}
