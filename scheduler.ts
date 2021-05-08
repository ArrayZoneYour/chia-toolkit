import { getActiveOutputSize, getActiveSSDs } from './disk'
import { getProcesses } from './process'
import { exit } from 'process'
import { Progress } from './progress'
import { createPlotProcess } from '.'

const getTaskQouta = () => {
  const diskSize = getActiveOutputSize()
  const processNum = getProcesses().length
  // TODO: Support k32+ block
  return Math.floor(diskSize / 109) - processNum
}

const startNextTaskOrWait = (tasks: Progress[]) => {
  const ssds = getActiveSSDs()
  // < 1 task/min
  Object.keys(ssds).some((path) => {
    const ssd = ssds[path]
    if (ssd.qouta > 0) {
      let enable = true
      let taskNum = 0
      tasks.forEach((task) => {
        if (task.tmpPath === path) {
          if (task.phase.startsWith('Computing table')) {
            taskNum += 1
          }
        }
      })
      if (taskNum >= Math.ceil(ssd.spareSize / 1024)) {
        enable = false
      }
      if (enable) {
        createPlotProcess({ verbose: false, tmpPath: path }, tasks)
        // console.log('Push new task to ' + path)
        return true
      }
    }
  })
}

const bootstrap = () => {
  const tasks: Progress[] = []

  const qouta = getTaskQouta()
  console.log('active qouta: ', qouta)
  if (qouta === 0) {
    exit()
  } else {
    startNextTaskOrWait(tasks)
  }

  setInterval(() => {
    const qouta = getTaskQouta()
    if (qouta === 0 && tasks.length === 0) {
      exit()
    } else if (qouta > 0) {
      startNextTaskOrWait(tasks)
    }
  }, 60000)
}

bootstrap()
