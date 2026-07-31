export const existsSync = () => false;
export const mkdirSync = () => {};
export const mkdir = async () => {};
export const rmSync = () => {};
export const rm = async () => {};
export const createWriteStream = () => ({ on: () => {}, write: () => {}, end: () => {} });
export const createReadStream = () => ({ on: () => {}, pipe: () => {} });
export const readdirSync = () => [];
export const readdir = async () => [];
export const unlinkSync = () => {};
export const unlink = async () => {};
export const readFile = async () => '';
export const writeFile = async () => {};
export const readFileSync = () => '';
export const writeFileSync = () => {};
export const statSync = () => ({ isDirectory: () => false, isFile: () => true, size: 0 });
export const stat = async () => ({ isDirectory: () => false, isFile: () => true, size: 0 });
export const lstatSync = () => ({ isDirectory: () => false, isFile: () => true, size: 0 });
export const lstat = async () => ({ isDirectory: () => false, isFile: () => true, size: 0 });
export const join = (...args: string[]) => args.filter(Boolean).join('/');
export const resolve = (...args: string[]) => args.filter(Boolean).join('/');
export const dirname = (p: string) => p;
export const basename = (p: string) => p;
export const extname = (p: string) => '';

export const promises = {
  readFile,
  writeFile,
  mkdir,
  rm,
  unlink,
  stat,
  lstat,
  readdir,
};

const emptyExport = {
  existsSync,
  mkdirSync,
  mkdir,
  rmSync,
  rm,
  createWriteStream,
  createReadStream,
  readdirSync,
  readdir,
  unlinkSync,
  unlink,
  readFile,
  writeFile,
  readFileSync,
  writeFileSync,
  statSync,
  stat,
  lstatSync,
  lstat,
  join,
  resolve,
  dirname,
  basename,
  extname,
  promises,
};

export default emptyExport;
