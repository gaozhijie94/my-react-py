import { FileStats } from "./FileStats"

export interface Runner {
  init: (
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
    packages?: string[][]
  ) => Promise<void>
  interruptExecution: () => void
  readFile: (name: string) => string | ArrayBuffer
  writeFile: (name: string, data: string|ArrayBufferView) => void
  mkdir: (name: string) => void
  rmdir: (name: string) => void
  deleteFile: (path:string) => void
  readdir: (path:string) => string[]
  stat: (path:string) => FileStats
  isDirExists: (path:string) => boolean
}

export interface PythonRunner extends Runner {
  run: (code: string) => Promise<void>
  addPackages: (packages: string[]) => Promise<void>
  loadedPackages: () => {
    [key: string]: string
  }
  loadPackagesFromImports: (code: string) => Promise<void>
}

export interface PythonConsoleRunner extends Runner {
  run: (code: string) => Promise<{ state: string; error?: string }>
}
