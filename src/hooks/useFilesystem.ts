import { useState } from 'react'

import { Remote } from 'comlink'
import { Runner } from '../types/Runner'

interface UseFilesystemProps {
  runner: Remote<Runner> | undefined
}

export default function useFilesystem(props: UseFilesystemProps) {
  const { runner } = props

  const [watchedModules, setWatchedModules] = useState<Set<string>>(new Set())

  const readFile = (name: string) => {
    return runner?.readFile(name)
  }

  const writeFile = (name: string, data: string | ArrayBufferView) => {
    return runner?.writeFile(name, data)
  }

  const mkdir = (name: string) => {
    return runner?.mkdir(name)
  }

  const rmdir = (name: string) => {
    return runner?.rmdir(name)
  }

  const deleteFile = (path : string) => {
    return runner?.deleteFile(path)
  }

  const readdir = (path: string) => {
    return runner?.readdir(path)
  }

  const stat = (path: string) => {
    return runner?.stat(path)

  }

  const isDirExists = (path: string) => {
    return runner?.isDirExists(path)
  }

  const watchModules = (moduleNames: string[]) => {
    setWatchedModules((prev) => new Set([...prev, ...moduleNames]))
  }

  const unwatchModules = (moduleNames: string[]) => {
    setWatchedModules(
      (prev) => new Set([...prev].filter((e) => !moduleNames.includes(e)))
    )
  }

  return {
    readFile,
    writeFile,
    mkdir,
    rmdir,
    deleteFile,
    readdir,
    stat,
    isDirExists,
    watchModules,
    unwatchModules,
    watchedModules
  }
}
