import { execSync } from 'node:child_process'
import { config } from 'dotenv'

config()

interface Process {
  pid: string
  tmpPath: string
  [key: string]: unknown
}

const getProcesses = (current = true) => {
  try {
    // USER         PID %CPU %MEM    VSZ   RSS TTY      STAT START   TIME COMMAND
    const processesDesc = execSync(`ps -aux | grep "[b]in/chia plots"`)
      .toString()
      .split('\n')
      .filter((item) =>
        current ? item.includes(process.env.OUTPUT_PATH!) : item.length > 0
      )

    const processes = processesDesc.map((desc) => {
      const params = desc.split(' ').filter((item) => item.length > 0)
      let kSize = '32'
      let tmpPath = ''
      let finalPath = ''
      let threadNum = ''
      params.forEach((param, idx) => {
        if (param === '-k') kSize = params[idx + 1]
        else if (param === '-t') tmpPath = params[idx + 1]
        else if (param === '-d') finalPath = params[idx + 1]
        else if (param === '-r') threadNum = params[idx + 1]
      })
      const process: Process = {
        pid: params[1],
        cpuUsage: params[2],
        memUsage: params[3],
        kSize,
        tmpPath,
        finalPath,
        threadNum
      }
      return process
    })
    return processes
  } catch (e) {
    return []
  }
}

export { getProcesses }
