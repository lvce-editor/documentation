import { spawn } from 'node:child_process'

export const run = (command: string, args: string[], cwd: string, env = process.env) =>
  new Promise<void>((done, reject) => {
    const child = spawn(command, args, { cwd, env, stdio: 'inherit', shell: process.platform === 'win32' })
    child.once('error', reject)
    child.once('exit', (code) => (code === 0 ? done() : reject(new Error(`${command} exited with code ${code}`))))
  })
