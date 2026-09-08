import log from 'electron-log/main'
import path from 'node:path'
import { app } from 'electron'

log.initialize()
log.transports.file.level = 'info'
log.transports.file.resolvePathFn = () =>
  path.join(app.getPath('userData'), 'logs', 'main.log')

export const logger = log
