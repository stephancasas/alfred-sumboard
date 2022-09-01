#!/usr/bin/env osascript -l JavaScript

function run(argv) {
  const App = Application.currentApplication();
  App.includeStandardAdditions = true;

  const $path = (...segments) => segments.join('/').replace(/\s/g, '\\ ');

  const PWD = $path(
    App.systemAttribute('alfred_preferences'),
    'workflows',
    App.systemAttribute('alfred_workflow_uid'),
  );

  const QUERY = `SELECT JSON_OBJECT('item', item) \
      FROM clipboard \
      WHERE ROWID > ( \
          SELECT ROWID \
          FROM clipboard \
          WHERE ROUND(item) = 0 \
          ORDER BY ts DESC LIMIT 1 \
      );`;

  const CLIPBOARD_PATH = $path(
    '~/Library',
    'Application Support',
    'Alfred',
    'Databases',
    'clipboard.alfdb',
  );

  const SQLITE_COMMAND = `sqlite3 -newline "," ${CLIPBOARD_PATH} "${QUERY}"`;

  let results = App.doShellScript(SQLITE_COMMAND);

  results = JSON.parse(`[${results.replace(/,$/, '')}]`)
    .flatMap(({ item }) => item.split(/\s/g))
    .filter((item) => !item.match(/[^\d.]/g) || !item)
    .map((item) => parseFloat(item));

  const sum = results.reduce((acc, cur) => acc + cur, 0);

  return JSON.stringify({
    items: [
      {
        title: `${sum}`,
        subtitle: results.join(' + '),
        arg: '',
        icon: {
          path: $path(PWD, 'rectangle-history-circle-plus.png'),
        },
        valid: false,
        mods: {
          cmd: {
            valid: true,
            arg: sum,
            subtitle: 'Press enter to copy the result to the pasteboard.',
          },
        },
      },
    ],
  });
}
