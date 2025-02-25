importScripts('https://cdn.jsdelivr.net/pyodide/v0.23.4/full/pyodide.js')

interface Pyodide {
  loadPackage: (packages: string[]) => Promise<void>
  pyimport: (pkg: string) => micropip
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  runPythonAsync: (code: string, namespace?: any) => Promise<void>
  version: string
  FS: {
    readFile: (name: string) => string | ArrayBuffer
    writeFile: (name: string, data: string | ArrayBufferView) => void
    mkdir: (name: string) => void
    rmdir: (name: string) => void
    unlink: (path:string) => void
    readdir: (path: string) => string[]
    stat: (path: string) => FileStats
    open: (path: string, flags: string) => void
    close: (stream: any) => void
    write: (stream: any, buffer: ArrayBufferView) => void
    analyzePath: (path: string) => {
      exists: boolean,
    }
  }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    globals: any
    isPyProxy: (value: unknown) => boolean
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    registerJsModule: any
    loadedPackages: {
      [key: string]: string
    }
    loadPackagesFromImports: (code: string) => Promise<void>
  }

interface micropip {
  install: (packages: string[]) => Promise<void>
}

declare global {
  interface Window {
    loadPyodide: ({
      stdout
    }: {
      stdout?: (msg: string) => void
    }) => Promise<Pyodide>
    pyodide: Pyodide
  }
}

// Monkey patch console.log to prevent the script from outputting logs
if (self.location.hostname !== 'localhost') {
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  console.log = () => { }
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  console.error = () => { }
}

import { expose } from 'comlink'
import { FileStats } from '../types/FileStats'

const reactPyModule = {
  getInput: (id: string, prompt: string) => {
    const request = new XMLHttpRequest()
    // Synchronous request to be intercepted by service worker
    request.open('GET', `/react-py-get-input/?id=${id}&prompt=${prompt}`, false)
    request.send(null)
    return request.responseText
  }
}

const python = {
  async init(
    stdout: (msg: string) => void,
    onLoad: ({
      id,
      version,
      banner
    }: {
      id: string
      version: string
      banner?: string
    }) => void,
    packages: string[][]
  ) {
    self.pyodide = await self.loadPyodide({
      stdout
    })
    await self.pyodide.loadPackage(['pyodide-http'])
    if (packages[0].length > 0) {
      await self.pyodide.loadPackage(packages[0])
    }
    if (packages[1].length > 0) {
      await self.pyodide.loadPackage(['micropip'])
      const micropip = self.pyodide.pyimport('micropip')
      await micropip.install(packages[1])
    }

    const id = self.crypto.randomUUID()
    const version = self.pyodide.version

    self.pyodide.registerJsModule('react_py', reactPyModule)
    const initCode = `
import pyodide_http
pyodide_http.patch_all()
`
    await self.pyodide.runPythonAsync(initCode)
    const patchInputCode = `
import sys, builtins
import react_py
__prompt_str__ = ""
def get_input(prompt=""):
    global __prompt_str__
    __prompt_str__ = prompt
    print(prompt, end="")
    s = react_py.getInput("${id}", prompt)
    print(s)
    return s
builtins.input = get_input
sys.stdin.readline = lambda: react_py.getInput("${id}", __prompt_str__)
`
    await self.pyodide.runPythonAsync(patchInputCode)

    onLoad({ id, version })
  },
  async run(code: string) {
    await self.pyodide.runPythonAsync(code)
  },
  async addPackages(packages: string[]) {
    const micropip = self.pyodide.pyimport('micropip')
    await micropip.install(packages)
  },
  loadedPackages() {

    return self.pyodide.loadedPackages
  },
  async loadPackagesFromImports(code: string) {
    await self.pyodide.loadPackagesFromImports(code)

  },
  readFile(name: string) {
    return self.pyodide.FS.readFile(name)
  },
  writeFile(name: string, data: string | ArrayBufferView) {
    return self.pyodide.FS.writeFile(name, data)
  },
  mkdir(name: string) {
    self.pyodide.FS.mkdir(name)
  },
  isDirExists(path:string) {
    return self.pyodide.FS.analyzePath(path).exists;
  },
  rmdir(name: string) {
    self.pyodide.FS.rmdir(name)
  },
  deleteFile(path: string) {
    self.pyodide.FS.unlink(path)
  },
  readdir(path: string) {
    return self.pyodide.FS.readdir(path)
  },
  stat(path: string) {
    return self.pyodide.FS.stat(path)
  }
}

expose(python)
