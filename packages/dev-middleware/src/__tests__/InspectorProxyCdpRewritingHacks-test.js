/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 * @oncall react_native
 */

import {allowSelfSignedCertsInNodeFetch} from './FetchUtils';
import {
  createAndConnectTarget,
  parseJsonFromDataUri,
  sendFromDebuggerToTarget,
  sendFromTargetToDebugger,
} from './InspectorProtocolUtils';
import {withAbortSignalForEachTest} from './ResourceUtils';
import {serveStaticJson, withServerForEachTest} from './ServerUtils';

// WebSocket is unreliable when using fake timers.
jest.useRealTimers();

jest.setTimeout(10000);

beforeAll(() => {
  // inspector-proxy uses node-fetch for source map fetching.
  allowSelfSignedCertsInNodeFetch();

  jest.resetModules();
});

describe.each(['HTTP', 'HTTPS'])(
  'inspector proxy CDP rewriting hacks over %s',
  protocol => {
    const serverRef = withServerForEachTest({
      logger: undefined,
      projectRoot: '',
      secure: protocol === 'HTTPS',
    });
    const autoCleanup = withAbortSignalForEachTest();
    afterEach(() => {
      jest.clearAllMocks();
    });

    test('source map fetching in Debugger.scriptParsed', async () => {
      serverRef.app.use(
        '/source-map',
        serveStaticJson({
          version: 3,
          // Mojibake insurance.
          file: '\u2757.js',
        }),
      );
      const {device, debugger_} = await createAndConnectTarget(
        serverRef,
        autoCleanup.signal,
        {
          app: 'bar-app',
          id: 'page1',
          title: 'bar-title',
          vm: 'bar-vm',
        },
      );
      try {
        const scriptParsedMessage = await sendFromTargetToDebugger(
          device,
          debugger_,
          'page1',
          {
            method: 'Debugger.scriptParsed',
            params: {
              sourceMapURL: `${serverRef.serverBaseUrl}/source-map`,
            },
          },
        );
        expect(
          parseJsonFromDataUri(scriptParsedMessage.params.sourceMapURL),
        ).toEqual({version: 3, file: '\u2757.js'});
      } finally {
        device.close();
        debugger_.close();
      }
    });

    describe.each(['10.0.2.2', '10.0.3.2'])(
      '%s aliasing to and from localhost',
      sourceHost => {
        test('in source map fetching during Debugger.scriptParsed', async () => {
          serverRef.app.use('/source-map', serveStaticJson({version: 3}));
          const {device, debugger_} = await createAndConnectTarget(
            serverRef,
            autoCleanup.signal,
            {
              app: 'bar-app',
              id: 'page1',
              title: 'bar-title',
              vm: 'bar-vm',
            },
          );
          try {
            const scriptParsedMessage = await sendFromTargetToDebugger(
              device,
              debugger_,
              'page1',
              {
                method: 'Debugger.scriptParsed',
                params: {
                  sourceMapURL: `${protocol.toLowerCase()}://${sourceHost}:${
                    serverRef.port
                  }/source-map`,
                },
              },
            );
            expect(
              parseJsonFromDataUri(scriptParsedMessage.params.sourceMapURL),
            ).toEqual({version: 3});
          } finally {
            device.close();
            debugger_.close();
          }
        });

        test('in Debugger.setBreakpointByUrl', async () => {
          const {device, debugger_} = await createAndConnectTarget(
            serverRef,
            autoCleanup.signal,
            {
              app: 'bar-app',
              id: 'page1',
              title: 'bar-title',
              vm: 'bar-vm',
            },
          );
          try {
            const scriptParsedMessage = await sendFromTargetToDebugger(
              device,
              debugger_,
              'page1',
              {
                method: 'Debugger.scriptParsed',
                params: {
                  url: `${protocol.toLowerCase()}://${sourceHost}:${
                    serverRef.port
                  }/some/file.js`,
                },
              },
            );
            expect(scriptParsedMessage.params.url).toEqual(
              `${protocol.toLowerCase()}://localhost:${
                serverRef.port
              }/some/file.js`,
            );

            const setBreakpointByUrlMessage = await sendFromDebuggerToTarget(
              debugger_,
              device,
              'page1',
              {
                id: 100,
                method: 'Debugger.setBreakpointByUrl',
                params: {
                  lineNumber: 1,
                  url: `${protocol.toLowerCase()}://localhost:${
                    serverRef.port
                  }/some/file.js`,
                },
              },
            );
            expect(setBreakpointByUrlMessage.params.url).toEqual(
              `${protocol.toLowerCase()}://${sourceHost}:${
                serverRef.port
              }/some/file.js`,
            );

            const setBreakpointByUrlRegexMessage =
              await sendFromDebuggerToTarget(debugger_, device, 'page1', {
                id: 200,
                method: 'Debugger.setBreakpointByUrl',
                params: {
                  lineNumber: 1,
                  urlRegex: 'localhost:1000|localhost:2000',
                },
              });
            expect(setBreakpointByUrlRegexMessage.params.urlRegex).toEqual(
              `${sourceHost}:1000|${sourceHost}:2000`,
            );
          } finally {
            device.close();
            debugger_.close();
          }
        });
      },
    );

    test('rewrites alphanumeric script IDs to file:// URIs', async () => {
      const {device, debugger_} = await createAndConnectTarget(
        serverRef,
        autoCleanup.signal,
        {
          app: 'bar-app',
          id: 'page1',
          title: 'bar-title',
          vm: 'bar-vm',
        },
      );
      try {
        const scriptParsedMessage = await sendFromTargetToDebugger(
          device,
          debugger_,
          'page1',
          {
            method: 'Debugger.scriptParsed',
            params: {
              url: 'abcde12345',
            },
          },
        );
        expect(scriptParsedMessage.params.url).toBe('file://abcde12345');
      } finally {
        device.close();
        debugger_.close();
      }
    });
  },
);
