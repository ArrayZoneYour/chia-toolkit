import { config } from 'dotenv'
import { execSync } from 'node:child_process'
import { getProcesses } from './process'

config()

const getActiveOutputSize = (unit = 'GB') => {
  const dataRow = execSync(
    `df -h --block-size=${unit} | grep ${process.env.OUTPUT_PATH}`
  )
    .toString()
    .replace('\n', '')
    .split(' ')
    .filter((el) => el.length > 0)
  return +dataRow[3].replace(unit, '')
}

const getActiveSSDs = (unit = 'GB', devices = ['nvme']) => {
  const dataRow: string[] = []
  // add sata ssds
  if (process.env.SSD_ADDON_LIST) {
    const addonSSDs = process.env.SSD_ADDON_LIST.split(',')
    addonSSDs.forEach((name) => {
      devices.push(name.trim())
    })
  }
  devices.forEach((device) => {
    execSync(`df -h --block-size=${unit} | grep ${device} | grep media`)
      .toString()
      .split('\n')
      .filter((el) => el.length > 0)
      .forEach((el) => {
        if (
          process.env.SSD_IGNORE_LIST &&
          !el.includes(process.env.SSD_IGNORE_LIST)
        ) {
          dataRow.push(el)
        } else {
          dataRow.push(el)
        }
      })
  })
  const ssds: any = {}
  dataRow.forEach((data) => {
    const dataArr = data.split(' ').filter((el) => el.length > 0)
    const loc = dataArr[5]
    ssds[loc] = {}
    const currentSSD = ssds[loc]
    currentSSD.spareSize = +dataArr[1].replace(unit, '')
    currentSSD.qouta = Math.floor(currentSSD.spareSize / 256.6)
  })
  const processes = getProcesses(false)
  processes.forEach((item) => {
    if (ssds[item.tmpPath]) {
      ssds[item.tmpPath].qouta -= 1
    }
  })
  return ssds
}

export { getActiveOutputSize, getActiveSSDs }
