import { got } from 'got';
import gulpIf from 'gulp-if';
import jsonfile from 'jsonfile';
import { format } from 'date-fns';
import { fileURLToPath } from 'url';
import prettier from 'gulp-prettier';
import { dirname, join } from 'path';
import { wrapFs } from '../util/fs.js';
import Generator from 'yeoman-generator';
import inquirerPrompt from 'inquirer-autocomplete-prompt';
import spdxIdentifiers from 'spdx-license-ids' assert { type: 'json' };

spdxIdentifiers.push('SEE LICENSE IN LICENSE');
spdxIdentifiers.sort();

const __dirname = dirname(fileURLToPath(import.meta.url));

// jsonfile is still using CJS
const { readFileSync } = jsonfile;

const src = (...paths) => join('src', ...paths);

const getPrettierConfig = () =>
  readFileSync(join(__dirname, '..', '..', '.prettierrc'));

const packages = {
  lintHooks: ['husky', 'lint-staged'],
  esdoc: [
    'esdoc',
    'esdoc-ecmascript-proposal-plugin',
    'esdoc-standard-plugin',
    'opener'
  ],
  jest: ['@babel/core', 'babel-jest', 'eslint-plugin-jest', 'jest', 'opener'],
  dev: [
    '@babel/eslint-parser',
    'eslint-config-prettier',
    'eslint-import-resolver-node',
    'eslint-plugin-import',
    'eslint-plugin-prettier',
    'eslint',
    'prettier'
  ],
  config: ['dotenv'],
  logging: ['winston']
};
const files = {
  core: [
    '.gitignore',
    '.prettierrc',
    '.editorconfig',
    'jsconfig.json',
    src('index.js')
  ],
  templated: ['.eslintrc.js', src('modules', 'config.js'), 'package.json'],
  esdoc: ['.esdoc.json'],
  jest: ['jest.config.cjs'],
  winston: [src('modules', 'logging.js')],
  dotenv: ['.env.default'],
  lintHooks: ['.lintstagedrc']
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
      inquirerPrompt
    );
    this.sourceRoot(join(__dirname, '..', '..', 'templates', 'app'));

    this.answers = {};
    this.fileSystem = wrapFs(this);
    this.registerTransformStream(
      gulpIf(/\.js$/, prettier(getPrettierConfig()))
    );
  }

  async prompting() {
    const { name, email } = this.user.git;

    this.answers = await this.prompt([
      {
        type: 'input',
        name: 'package.name',
        message: 'Package name',
        default: this.appname.replace(/\s+/g, '-')
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

          return Promise.resolve(
            spdxIdentifiers.filter((identifier) => pattern.test(identifier))
          );
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
        name: 'flags.addLintHooks',
        message: 'Run linter before committing?',
        default: true
      },
      {
        type: 'confirm',
        name: 'flags.addWinston',
        message: 'Add Winston?',
        default: true
      },
      {
        type: 'confirm',
        name: 'flags.addDotenv',
        message: 'Add dotenv?',
        default: true
      },
      {
        type: 'input',
        name: 'package.configPrefix',
        message: 'Prefix for environment variables (e.g. "APP" -> "APP_XXX")',
        default: this.appname.substr(0, 3).toUpperCase(),
        validate: (input) => /^[A-Z0-9-_.]+$/.test(input),
        when: (answers) => answers.flags.addDotenv === true
      },
      {
        type: 'confirm',
        name: 'flags.addJest',
        message: 'Add Jest?',
        default: true
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
      const { body: rawLicense } = await got(
        `https://raw.githubusercontent.com/spdx/license-list-data/master/text/${license}.txt`
      );

      licenseText = rawLicense
        .replace('<year>', format(new Date(), 'yyyy'))
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

    if (flags.addLintHooks) {
      files.lintHooks.forEach(this.fileSystem.copy);
    }

    if (flags.addDotenv) {
      this.fs.append(this.destinationPath('.gitignore'), '.env');
      files.dotenv.forEach(this.fileSystem.copyTemplate);
    }

    if (flags.addWinston) {
      files.winston.forEach(this.fileSystem.copy);
    }
  }

  install() {
    const main = [];
    const dev = [];
    const { flags } = this.answers;

    this.log('Building a list of packages to install');

    dev.push.apply(dev, packages.dev);

    if (flags.addLintHooks) {
      dev.push.apply(dev, packages.lintHooks);
    }

    if (flags.addJest) {
      dev.push.apply(dev, packages.jest);
    }

    if (flags.addDotenv) {
      main.push.apply(main, packages.config);
    }

    if (flags.addWinston) {
      main.push.apply(main, packages.logging);
    }

    if (flags.addESDoc) {
      main.push.apply(main, packages.esdoc);
    }

    this.log(
      `Getting ready to install ${main.length} dependencies and ${dev.length} dev dependencies.`
    );
    this.npmInstall(main, { save: true });
    this.npmInstall(dev, { 'save-dev': true });

    if (flags.addLintHooks) {
      this.spawnCommandSync('git', ['init']);
      this.spawnCommandSync('npx', ['husky', 'install']);
      this.spawnCommandSync('npx', [
        'husky',
        'add',
        '.husky/pre-commit',
        'npx lint-staged'
      ]);
    }
  }
}
