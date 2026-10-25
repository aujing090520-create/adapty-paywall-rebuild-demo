import { mkdir, copyFile } from 'node:fs/promises';

export async function publishParameterReference(source, destination) {
  await mkdir(destination, {recursive:true});
  for (const extension of ['html','csv']) {
    const name = `component-parameters.${extension}`;
    await copyFile(new URL(name, source), new URL(name, destination));
  }
}
