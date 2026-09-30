export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [2, 'always', ['feat', 'fix', 'chore', 'refactor', 'docs', 'test']],
    // Las reglas de mayúsculas de config-conventional están pensadas para inglés
    'subject-case': [0],
    'header-max-length': [2, 'always', 100],
  },
};
