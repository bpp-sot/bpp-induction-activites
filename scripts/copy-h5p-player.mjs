import { access, cp, mkdir, rm } from "node:fs/promises";
import { constants } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const source = resolve(root, "node_modules/h5p-standalone/dist");
const license = resolve(root, "node_modules/h5p-standalone/LICENSE");
const target = resolve(root, "public/h5p-player");
await access(source, constants.R_OK);
await rm(target, { recursive: true, force: true });
await mkdir(target, { recursive: true });
await cp(source, target, { recursive: true });
await cp(license, resolve(target, "LICENSE"));
