interface H5PStandaloneOptions {
  h5pJsonPath: string;
  librariesPath: string;
  contentJsonPath: string;
  frameJs: string;
  frameCss: string;
  reportingIsEnabled: boolean;
  xAPIObjectIRI: string;
  frame: boolean;
  copyright: boolean;
  export: boolean;
  embed: boolean;
  fullScreen: boolean;
}

interface H5PStandaloneConstructor {
  new (element: HTMLElement, options: H5PStandaloneOptions): Promise<unknown>;
}

interface H5PExternalDispatcher {
  on(event: "xAPI", handler: (event: unknown) => void): void;
  off(event: "xAPI", handler: (event: unknown) => void): void;
}

interface H5PGlobal {
  externalDispatcher?: H5PExternalDispatcher;
}

declare global {
  interface Window {
    H5PStandalone?: { H5P: H5PStandaloneConstructor };
    H5P?: H5PGlobal;
  }
}

export {};
