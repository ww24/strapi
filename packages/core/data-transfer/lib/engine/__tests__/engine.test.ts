import * as path from 'path';
import { cloneDeep } from 'lodash/fp';
import { Readable, Writable } from 'stream-chain';
import type { Schema } from '@strapi/strapi';
import { createTransferEngine, transferStages } from '..';
import type {
  IAsset,
  IDestinationProvider,
  IEntity,
  ILink,
  ISourceProvider,
  ITransferEngineOptions,
} from '../../../types';
import {
  extendExpectForDataTransferTests,
  providerStages,
  sourceStages,
} from '../../__tests__/test-utils';

const getMockSourceStream = (data: Iterable<unknown>) => Readable.from(data);

const getEntitiesMockSourceStream = (
  data: Iterable<IEntity> = [
    { id: 1, type: 'foo', data: { foo: 'bar' } },
    { id: 2, type: 'bar', data: { bar: 'foo' } },
  ]
) => getMockSourceStream(data);

const getLinksMockSourceStream = (
  data: Iterable<ILink> = [
    {
      kind: 'relation.basic',
      relation: 'oneToOne',
      left: { type: 'foo', ref: 1, field: 'foo' },
      right: { type: 'bar', ref: 2, field: 'bar' },
    },
    {
      kind: 'relation.basic',
      relation: 'oneToMany',
      left: { type: 'foo', ref: 1, field: 'foos' },
      right: { type: 'bar', ref: 2, field: 'bar' },
    },
  ]
) => getMockSourceStream(data);

const getAssetsMockSourceStream = (
  data: Iterable<IAsset> = [
    {
      filename: 'foo.jpg',
      filepath: path.join(__dirname, 'foo.jpg'),
      stats: { size: 24 },
      stream: Readable.from([1, 2, 3]),
    },
    {
      filename: 'bar.jpg',
      filepath: path.join(__dirname, 'bar.jpg'),
      stats: { size: 48 },
      stream: Readable.from([4, 5, 6, 7, 8, 9]),
    },
  ]
) => getMockSourceStream(data);

const getConfigurationMockSourceStream = (
  data: Iterable<unknown> = [
    { key: 'foo', value: 'alice' },
    { key: 'bar', value: 'bob' },
  ]
) => getMockSourceStream(data);

const getSchemasMockSourceStream = (
  data: Iterable<Schema> = [
    {
      info: { displayName: 'foo' },
      modelType: 'contentType',
      attributes: { foo: { type: 'string' } },
    },
    {
      info: { displayName: 'bar' },
      modelType: 'contentType',
      attributes: { bar: { type: 'integer' } },
    },
  ]
) => getMockSourceStream(data);

const getMockDestinationStream = () => {
  const stream = new Writable({
    objectMode: true,
    write(chunk, encoding, callback) {
      callback();
    },
  });
  return stream;
};

extendExpectForDataTransferTests();

const metadata = {
  createdAt: '2022-11-23T09:26:43.463Z',
  strapi: {
    version: '1.2.3',
    plugins: [
      {
        name: 'content-manager',
        version: '1.2.3',
      },
      {
        name: 'content-type-builder',
        version: '1.2.3',
      },
    ],
  },
};

const schemas = [
  {
    collectionName: 'admin_permissions',
    info: {
      name: 'Permission',
      description: '',
      singularName: 'permission',
      pluralName: 'permissions',
      displayName: 'Permission',
    },
    options: {},
    pluginOptions: {
      'content-manager': { visible: false },
      'content-type-builder': { visible: false },
    },
    attributes: {
      action: { type: 'string', minLength: 1, configurable: false, required: true },
      subject: { type: 'string', minLength: 1, configurable: false, required: false },
      properties: { type: 'json', configurable: false, required: false, default: {} },
      conditions: { type: 'json', configurable: false, required: false, default: [] },
      role: {
        configurable: false,
        type: 'relation',
        relation: 'manyToOne',
        inversedBy: 'permissions',
        target: 'admin::role',
      },
      createdAt: { type: 'datetime' },
      updatedAt: { type: 'datetime' },
      createdBy: {
        type: 'relation',
        relation: 'oneToOne',
        target: 'admin::user',
        configurable: false,
        writable: false,
        visible: false,
        useJoinTable: false,
        private: true,
      },
      updatedBy: {
        type: 'relation',
        relation: 'oneToOne',
        target: 'admin::user',
        configurable: false,
        writable: false,
        visible: false,
        useJoinTable: false,
        private: true,
      },
    },
    kind: 'collectionType',
    modelType: 'contentType',
    modelName: 'permission',
    uid: 'admin::permission',
    plugin: 'admin',
    globalId: 'AdminPermission',
  },
  {
    collectionName: 'homepages',
    info: { displayName: 'Homepage', singularName: 'homepage', pluralName: 'homepages' },
    options: { draftAndPublish: true },
    pluginOptions: { i18n: { localized: true } },
    attributes: {
      title: { type: 'string', required: true, pluginOptions: { i18n: { localized: true } } },
      slug: {
        type: 'uid',
        targetField: 'title',
        required: true,
        pluginOptions: { i18n: { localized: true } },
      },
      single: { type: 'media', allowedTypes: ['images', 'files', 'videos'], required: false },
      multiple: {
        type: 'media',
        multiple: true,
        allowedTypes: ['images', 'videos'],
        required: false,
      },
      createdAt: { type: 'datetime' },
      updatedAt: { type: 'datetime' },
      publishedAt: { type: 'datetime', configurable: false, writable: true, visible: false },
      createdBy: {
        type: 'relation',
        relation: 'oneToOne',
        target: 'admin::user',
        configurable: false,
        writable: false,
        visible: false,
        useJoinTable: false,
        private: true,
      },
      updatedBy: {
        type: 'relation',
        relation: 'oneToOne',
        target: 'admin::user',
        configurable: false,
        writable: false,
        visible: false,
        useJoinTable: false,
        private: true,
      },
      localizations: {
        writable: true,
        private: false,
        configurable: false,
        visible: false,
        type: 'relation',
        relation: 'oneToMany',
        target: 'api::homepage.homepage',
      },
      locale: {
        writable: true,
        private: false,
        configurable: false,
        visible: false,
        type: 'string',
      },
    },
    kind: 'singleType',
    modelType: 'contentType',
    modelName: 'homepage',
    uid: 'api::homepage.homepage',
    globalId: 'Homepage',
  },
];

const createSource = (streamData?: {
  assets?: IAsset[];
  entities?: IEntity[];
  links?: ILink[];
  configuration?: any[];
  schemas?: Schema[];
}): ISourceProvider => {
  return {
    type: 'source',
    name: 'completeSource',
    getMetadata: jest.fn().mockResolvedValue(metadata) as any,
    getSchemas: jest.fn().mockResolvedValue(schemas) as any,

    bootstrap: jest.fn() as any,
    close: jest.fn() as any,

    streamEntities: jest
      .fn()
      .mockResolvedValue(getEntitiesMockSourceStream(streamData?.entities)) as any,
    streamLinks: jest.fn().mockResolvedValue(getLinksMockSourceStream(streamData?.links)) as any,
    streamAssets: jest.fn().mockResolvedValue(getAssetsMockSourceStream(streamData?.assets)) as any,
    streamConfiguration: jest
      .fn()
      .mockResolvedValue(getConfigurationMockSourceStream(streamData?.configuration)) as any,
    streamSchemas: jest
      .fn()
      .mockReturnValue(getSchemasMockSourceStream(streamData?.schemas)) as any,
  };
};

const createDestination = () => {
  return {
    type: 'destination',
    name: 'completeDestination',
    getMetadata: jest.fn().mockResolvedValue(metadata) as any,
    getSchemas: jest.fn().mockResolvedValue(schemas) as any,

    bootstrap: jest.fn() as any,
    close: jest.fn() as any,

    getEntitiesStream: jest.fn().mockResolvedValue(getMockDestinationStream()) as any,
    getLinksStream: jest.fn().mockResolvedValue(getMockDestinationStream()) as any,
    getAssetsStream: jest.fn().mockResolvedValue(getMockDestinationStream()) as any,
    getConfigurationStream: jest.fn().mockResolvedValue(getMockDestinationStream()) as any,
    getSchemasStream: jest.fn().mockResolvedValue(getMockDestinationStream()) as any,
  } as IDestinationProvider;
};

describe('Transfer engine', () => {
  // TODO: if these are needed for any other tests, a factory should be added to test-utils

  const minimalSource = {
    type: 'source',
    name: 'minimalSource',
    getMetadata: jest.fn() as any,
    getSchemas: jest.fn() as any,
  } as ISourceProvider;

  const minimalDestination = {
    type: 'destination',
    name: 'minimalDestination',
    getMetadata: jest.fn() as any,
    getSchemas: jest.fn() as any,
  } as IDestinationProvider;

  const defaultOptions = {
    strategy: 'restore',
    versionMatching: 'exact',
    schemasMatching: 'exact',
    exclude: [],
  } as ITransferEngineOptions;

  let completeSource;
  let completeDestination;

  beforeEach(() => {
    jest.restoreAllMocks();
    completeSource = createSource();
    completeDestination = createDestination();
  });

  describe('createTransferEngine', () => {
    test('creates a valid transfer engine', () => {
      const engine = createTransferEngine(minimalSource, minimalDestination, defaultOptions);
      expect(engine).toBeValidTransferEngine();
    });

    test('throws when given invalid source provider', () => {
      expect(() => {
        createTransferEngine(completeDestination, minimalDestination, defaultOptions);
      }).toThrow();
    });

    test('throws when given invalid destination provider', () => {
      expect(() => {
        createTransferEngine(minimalSource, completeSource, defaultOptions);
      }).toThrow();
    });
  });

  describe('bootstrap', () => {
    test('works for providers without a bootstrap', async () => {
      const engine = createTransferEngine(minimalSource, minimalDestination, defaultOptions);
      expect(engine).toBeValidTransferEngine();
      await engine.transfer();
      expect(minimalSource).toHaveSourceStagesCalledTimes(1);
    });

    test('bootstraps all providers with a bootstrap', async () => {
      const source = {
        ...minimalSource,
        bootstrap: jest.fn().mockResolvedValue(true),
      };
      const destination = {
        ...minimalDestination,
        bootstrap: jest.fn().mockResolvedValue(true),
      };
      const engine = createTransferEngine(source, destination, defaultOptions);
      expect(engine).toBeValidTransferEngine();
      await engine.transfer();

      expect(minimalSource).toHaveSourceStagesCalledTimes(1);
    });
  });

  describe('transfer', () => {
    test('calls all provider stages', async () => {
      const engine = createTransferEngine(completeSource, completeDestination, defaultOptions);
      expect(completeSource).toHaveSourceStagesCalledTimes(0);
      expect(completeDestination).toHaveDestinationStagesCalledTimes(0);
      await engine.transfer();

      expect(completeSource).toHaveSourceStagesCalledTimes(1);
      expect(completeDestination).toHaveDestinationStagesCalledTimes(1);
    });

    test('returns provider results', async () => {
      const source = {
        ...minimalSource,
        results: { foo: 'bar' },
      };
      const destination = {
        ...minimalDestination,
        results: { foo: 'baz' },
      };

      const engine = createTransferEngine(source, destination, defaultOptions);
      const results = await engine.transfer();
      expect(results).toMatchObject({
        source: { foo: 'bar' },
        destination: { foo: 'baz' },
      });
    });
  });

  describe('progressStream', () => {
    test("emits 'transfer::start' and 'transfer::finish' events", async () => {
      const source = createSource();
      const engine = createTransferEngine(source, completeDestination, defaultOptions);

      let calledStart = 0;
      engine.progress.stream.on('transfer::start', (/* payload */) => {
        calledStart += 1;
      });

      let calledFinish = 0;
      engine.progress.stream.on('transfer::finish', (/* payload */) => {
        calledFinish += 1;
      });

      // first call
      await engine.transfer();
      expect(calledStart).toEqual(1);
      expect(calledFinish).toEqual(1);

      // second call -- currently not supported
      // await engine.transfer();
      // expect(calledStart).toEqual(2);
      // expect(calledFinish).toEqual(2);
    });

    test("emits 'stage::progress' events", async () => {
      const source = createSource();
      const engine = createTransferEngine(source, completeDestination, defaultOptions);

      let calls = 0;
      engine.progress.stream.on('stage::progress', ({ stage, data }) => {
        expect(transferStages.includes(stage)).toBe(true);
        expect(data).toMatchObject(engine.progress.data);
        calls += 1;
      });

      await engine.transfer();

      // Two values are emitted by default for each stage
      // TODO: this is no longer true, we should be checking the sum of the various mocked streams
      const itemPerStage = 2;

      expect(calls).toEqual((sourceStages.length - providerStages.length) * itemPerStage);
    });

    test("emits 'stage::start' events", async () => {
      const source = createSource();
      const engine = createTransferEngine(source, completeDestination, defaultOptions);

      let calls = 0;
      engine.progress.stream.on('stage::start', ({ stage, data }) => {
        expect(transferStages.includes(stage)).toBe(true);
        expect(data).toMatchObject(engine.progress.data);
        calls += 1;
      });

      await engine.transfer();

      expect(calls).toEqual(transferStages.length);
    });

    test("emits 'stage::finish' events", async () => {
      const source = createSource();
      const engine = createTransferEngine(source, completeDestination, defaultOptions);

      let calls = 0;
      engine.progress.stream.on('stage::finish', ({ stage, data }) => {
        expect(transferStages.includes(stage)).toBe(true);
        expect(data).toMatchObject(engine.progress.data);
        calls += 1;
      });

      await engine.transfer();

      expect(calls).toEqual(transferStages.length);
    });

    test("emits 'stage::skip' events", async () => {
      const source = createSource();
      const engine = createTransferEngine(source, completeDestination, defaultOptions);

      // delete 3 stages from source
      delete source.streamSchemas;
      delete source.streamLinks;
      delete source.streamEntities;

      let calls = 0;
      engine.progress.stream.on('stage::skip', ({ stage, data }) => {
        expect(transferStages.includes(stage)).toBe(true);
        expect(data).toMatchObject(engine.progress.data);
        calls += 1;
      });

      await engine.transfer();

      expect(calls).toEqual(3); // 3 deleted stages above
    });
  });

  describe('integrity checks', () => {
    describe('schema matching', () => {
      describe('exact', () => {
        const engineOptions = {
          strategy: 'restore',
          versionMatching: 'exact',
          schemasMatching: 'exact',
          exclude: [],
        } as ITransferEngineOptions;
        test('source with source schema missing in destination fails', async () => {
          const source = createSource();
          source.getSchemas = jest.fn().mockResolvedValue([...schemas, { foo: 'bar' }]);
          const engine = createTransferEngine(source, completeDestination, engineOptions);
          expect(
            (async () => {
              await engine.transfer();
            })()
          ).rejects.toThrow();
        });
        test('source with destination schema missing in source fails', async () => {
          const destination = createDestination();
          destination.getSchemas = jest.fn().mockResolvedValue([...schemas, { foo: 'bar' }]);
          const engine = createTransferEngine(completeSource, destination, engineOptions);
          expect(
            (async () => {
              await engine.transfer();
            })()
          ).rejects.toThrow();
        });
        test('differing nested field fails', async () => {
          const destination = createDestination();
          const fakeSchema = cloneDeep(schemas);
          fakeSchema[0].attributes.action!.minLength = 2;
          destination.getSchemas = jest.fn().mockResolvedValue(fakeSchema);
          const engine = createTransferEngine(completeSource, destination, engineOptions);
          expect(
            (async () => {
              await engine.transfer();
            })()
          ).rejects.toThrow();
        });
      });
    });

    describe('version matching', () => {
      test('works with invalid version string', async () => {
        const versionsThatFail = ['foo', 'z1.2.3', '1.2.3z'];
        const options: ITransferEngineOptions = {
          ...defaultOptions,
          versionMatching: 'exact',
        };

        versionsThatFail.forEach((version) => {
          const modifiedMetadata = cloneDeep(metadata);
          modifiedMetadata.strapi.version = version;
          const source = createSource();
          source.getMetadata = jest.fn().mockResolvedValue(modifiedMetadata);
          const engine = createTransferEngine(source, completeDestination, options);
          expect(
            (async () => {
              await engine.transfer();
            })()
          ).rejects.toThrow();
        });
      });

      test('exact works', async () => {
        const versionsThatFail = ['1.2.3-alpha', '1.2.4', '2.2.3'];
        const versionsThatSucceed = ['1.2.3'];
        const options: ITransferEngineOptions = {
          ...defaultOptions,
          versionMatching: 'exact',
        };

        versionsThatFail.forEach((version) => {
          const modifiedMetadata = cloneDeep(metadata);
          modifiedMetadata.strapi.version = version;
          const source = createSource();
          source.getMetadata = jest.fn().mockResolvedValue(modifiedMetadata);
          const engine = createTransferEngine(source, completeDestination, options);
          expect(
            (async () => {
              await engine.transfer();
            })()
          ).rejects.toThrow();
        });

        versionsThatSucceed.forEach((version) => {
          const modifiedMetadata = cloneDeep(metadata);
          modifiedMetadata.strapi.version = version;
          const source = createSource();
          source.getMetadata = jest.fn().mockResolvedValue(modifiedMetadata);
          const engine = createTransferEngine(source, completeDestination, options);
          expect(
            (async () => {
              await engine.transfer();
            })()
          ).resolves.toBe(undefined);
        });
      });

      test('major works', async () => {
        const versionsThatFail = ['2.2.3'];
        const versionsThatSucceed = ['1.2.3', '1.3.4', '1.4.4-alpha'];
        const options: ITransferEngineOptions = {
          ...defaultOptions,
          versionMatching: 'major',
        };

        await Promise.all(
          versionsThatFail.map(async (version) => {
            const modifiedMetadata = cloneDeep(metadata);
            modifiedMetadata.strapi.version = version;
            const source = createSource();
            source.getMetadata = jest.fn().mockResolvedValue(modifiedMetadata);
            const engine = createTransferEngine(source, completeDestination, options);
            await expect(
              (async () => {
                await engine.transfer();
              })()
            ).rejects.toThrow();
          })
        );

        await Promise.all(
          versionsThatSucceed.map(async (version) => {
            const modifiedMetadata = cloneDeep(metadata);
            modifiedMetadata.strapi.version = version;
            const source = createSource();
            source.getMetadata = jest.fn().mockResolvedValue(modifiedMetadata);
            const engine = createTransferEngine(source, completeDestination, options);
            await expect(
              (async () => {
                await engine.transfer();
              })()
            ).resolves.toBe(undefined);
          })
        );
      });

      test('minor works', async () => {
        const versionsThatFail = ['2.2.3', '1.4.3', '1.4.3-alpha'];
        const versionsThatSucceed = ['1.2.3', '1.2.40', '1.2.4-alpha'];
        const options: ITransferEngineOptions = {
          ...defaultOptions,
          versionMatching: 'minor',
        };

        await Promise.all(
          versionsThatFail.map(async (version) => {
            const modifiedMetadata = cloneDeep(metadata);
            modifiedMetadata.strapi.version = version;
            const source = createSource();
            source.getMetadata = jest.fn().mockResolvedValue(modifiedMetadata);
            const engine = createTransferEngine(source, completeDestination, options);
            await expect(
              (async () => {
                await engine.transfer();
              })()
            ).rejects.toThrow();
          })
        );

        await Promise.all(
          versionsThatSucceed.map(async (version) => {
            const modifiedMetadata = cloneDeep(metadata);
            modifiedMetadata.strapi.version = version;
            const source = createSource();
            source.getMetadata = jest.fn().mockResolvedValue(modifiedMetadata);
            const engine = createTransferEngine(source, completeDestination, options);
            await expect(
              (async () => {
                await engine.transfer();
              })()
            ).resolves.toBe(undefined);
          })
        );
      });

      test('patch works', async () => {
        const versionsThatFail = ['1.2.4', '1.2.4-alpha', '2.2.3'];
        const versionsThatSucceed = ['1.2.3'];
        const options: ITransferEngineOptions = {
          ...defaultOptions,
          versionMatching: 'patch',
        };

        await Promise.all(
          versionsThatFail.map(async (version) => {
            const modifiedMetadata = cloneDeep(metadata);
            modifiedMetadata.strapi.version = version;
            const source = createSource();
            source.getMetadata = jest.fn().mockResolvedValue(modifiedMetadata);
            const engine = createTransferEngine(source, completeDestination, options);
            await expect(
              (async () => {
                await engine.transfer();
              })()
            ).rejects.toThrow();
          })
        );

        await Promise.all(
          versionsThatSucceed.map(async (version) => {
            const modifiedMetadata = cloneDeep(metadata);
            modifiedMetadata.strapi.version = version;
            const source = createSource();
            source.getMetadata = jest.fn().mockResolvedValue(modifiedMetadata);
            const engine = createTransferEngine(source, completeDestination, options);
            await expect(
              (async () => {
                await engine.transfer();
              })()
            ).resolves.toBe(undefined);
          })
        );
      });

      test('ignore works', async () => {
        const versionsThatSucceed = ['1.2.3', '1.3.4', '5.24.44-alpha'];
        const options: ITransferEngineOptions = {
          ...defaultOptions,
          versionMatching: 'ignore',
        };

        await Promise.all(
          versionsThatSucceed.map(async (version) => {
            const modifiedMetadata = cloneDeep(metadata);
            modifiedMetadata.strapi.version = version;
            const source = createSource();
            source.getMetadata = jest.fn().mockResolvedValue(modifiedMetadata);
            const engine = createTransferEngine(source, completeDestination, options);
            await expect(
              (async () => {
                await engine.transfer();
              })()
            ).resolves.toBe(undefined);
          })
        );
      });
    });
  });
});
