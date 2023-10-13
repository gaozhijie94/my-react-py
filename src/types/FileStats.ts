export interface FileStats {
    dev: number;
    ino: number;
    mode: number;
    nlink: number;
    uid: number;
    gid: number;
    rdev: number;
    size: number;
    atime: Date;
    mtime: Date;
    ctime: Date;
    blksize: number;
    blocks: number;
  }