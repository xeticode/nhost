import { spawnSync } from 'child_process'
import { existsSync, readdirSync } from 'fs'
import path from 'path'

import fs from 'fs-extra'

import workspaceDir from '@pnpm/find-workspace-dir'
import find from '@pnpm/find-workspace-packages'
import readProject from '@pnpm/read-project-manifest'
import { Dependencies, Project } from '@pnpm/types'

const EXAMPLE_SCOPE = '@nhost-examples'
const EXAMPLE_DESTINATION_RELATIVE_DIR = 'examples'
const INCLUDE = ['src', 'nhost', 'public', 'index.html']

const updateDependencies = (
  deps: Dependencies | undefined,
  workspacePackages: Project[]
): Dependencies =>
  Object.entries(deps || {}).reduce((acc, [name, version]) => {
    if (version.startsWith('workspace')) {
      const type = version.split(':')[1]
      const sourceVersion = workspacePackages.find((p) => p.manifest.name === name)?.manifest
        .version
      if (type === '^') {
        acc[name] = `^${sourceVersion}`
      } else if (type.startsWith('^')) {
        acc[name] = type
      } else {
        acc[name] = sourceVersion
      }
    } else {
      acc[name] = version
    }
    return acc
  }, {})

const main = async () => {
  const root = await workspaceDir(process.cwd())
  if (root) {
    const workspacePackages = await find(root)
    const sourcePackages = workspacePackages.filter((p) =>
      p.manifest.name?.startsWith(EXAMPLE_SCOPE)
    )

    const targetRootDir = path.join(root, EXAMPLE_DESTINATION_RELATIVE_DIR)

    const targetProjects = (
      await Promise.all(
        readdirSync(targetRootDir, {
          withFileTypes: true
        })
          .filter((file) => file.isDirectory())
          .map((file) => path.join(targetRootDir, file.name))
          .filter((dir) => existsSync(path.join(dir, 'package.json')))
          .map(async (dir) => {
            const target = await readProject(dir)
            const source = sourcePackages.find(
              (source) => source.manifest.name === target.manifest.name
            )
            return { source, target: { dir, ...target } }
          })
      )
    ).filter((target) => !!target.source) as Array<{
      source: Project
      target: Project
    }>

    for (const { source, target } of targetProjects) {
      console.log(`\nUpdating ${target.manifest.name} in ${target.dir}...`)
      // * Copy package.json version
      target.manifest.version = source.manifest.version

      // * Update dependencies and transform `workspace:` internal links
      target.manifest.dependencies = updateDependencies(
        source.manifest.dependencies,
        workspacePackages
      )
      target.manifest.devDependencies = updateDependencies(
        source.manifest.devDependencies,
        workspacePackages
      )

      // * Save package.json
      await target.writeProjectManifest(target.manifest)

      // * Update Yarn lockfile
      // ! Only works with yarn.
      // TODO In CI/CD, use yarn3 `yarn install --mode update-lockfile` so there is no need to install all packages
      // TODO See https://github.com/yarnpkg/yarn/issues/5738#issuecomment-905943984
      spawnSync('yarn', { cwd: target.dir, stdio: 'inherit' })
      for (const name of INCLUDE) {
        const sourcePath = path.join(source.dir, name)
        const targetPath = path.join(target.dir, name)
        if (existsSync(sourcePath)) {
          fs.removeSync(targetPath)
          fs.copySync(sourcePath, targetPath, { recursive: true })
        }
      }
    }
  }
}
main()
