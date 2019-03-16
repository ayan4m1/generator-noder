import cosmiconfig from 'cosmiconfig';

const configSearch = cosmiconfig('<%= package.configName %>').searchSync();

if (configSearch === null) {
  throw new Error(
    'Did not find a config file for module name "<%= package.configName %>" - see https://github.com/davidtheclark/cosmiconfig#explorersearch'
  );
}

export default configSearch.config;
