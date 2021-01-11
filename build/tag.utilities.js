const tag = process.env.TAG_NAME || '';

function isTagged() {
  return tag && tag !== '';
}

function isOfficialTag() {
  const officialForm = `^${semanticVersionForm()}$`;
  const officialRegex = new RegExp(officialForm);

  return officialRegex.test(tag);
}

function isBetaTag() {
  const betaForm = `^${semanticVersionForm()}-beta$`;
  const betaRegex = new RegExp(betaForm);

  return betaRegex.test(tag);
}

function semanticVersionForm() {
  const number = '[0-9]+';
  const dot = '[.]';
  return `${number}${dot}${number}${dot}${number}`;
}

function majorMinorForm() {
  const number = '[0-9]+';
  const dot = '[.]';
  return `${number}${dot}${number}`;
}

function smallLetters() {
  return '[a-z]+';
}

function tagHasAlphabeticSuffix() {
  const suffixForm = `^${semanticVersionForm()}-${smallLetters()}$`;
  const suffixRegex = new RegExp(suffixForm);

  return suffixRegex.test(tag);
}

function getAlphabeticSuffix() {
  if (!tagHasAlphabeticSuffix()) {
    return '';
  }

  const suffixRegex = new RegExp(`${smallLetters()}$`);
  return suffixRegex.exec(tag)[0];
}

function getVersion() {
  return require('../package.json').version;
}

function getMajorMinorVersion() {
  const version = getVersion();
  const form = `^${majorMinorForm()}`;
  const majorMinorRegex = new RegExp(form);

  return majorMinorRegex.exec(version)[0];
}

function getHerokuVersion() {
  const version = getVersion();
  return version ? version.replace(/\./g, '-') : 'unknown-version';
}

module.exports = {
  isTagged,
  isOfficialTag,
  isBetaTag,
  tagHasAlphabeticSuffix,
  getAlphabeticSuffix,
  getVersion,
  getHerokuVersion,
  getMajorMinorVersion
};