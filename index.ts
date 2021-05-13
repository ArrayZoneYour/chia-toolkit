import { config } from 'dotenv'
import { spawn } from 'child_process'
import { Progress, pool } from './progress'

config()

const chiaPath = process.env.CHIA_PATH!

const getFinalPath = async () => {
  // const finalPath = "/run/user/1000/gvfs/"
  // const files = await readdir(finalPath)
  // return finalPath + files[0]
  return process.env.OUTPUT_PATH!
}

interface PlotConfig {
  tmpPath: string
  verbose: boolean
}

const createPlotProcess = async (config: PlotConfig, tasks: Progress[]) => {
  const progress = pool.acquire()
  if (!progress) return
  tasks.push(progress)
  const { verbose, tmpPath } = config
  progress.tmpPath = tmpPath
  const kSize = 32
  const queueSize = 1
  const threadNum = 6
  const finalPath = await getFinalPath()
  let command: string
  if (process.env.FARMER_EKY && process.env.POOL_KEY) {
    command = `cd ${chiaPath} && . ./activate && chia plots create -k ${kSize} -n ${queueSize} -f ${process.env.FARMER_EKY} -p ${process.env.POOL_KEY} -t ${tmpPath} -d ${finalPath} -r ${threadNum}`
  } else {
    command = `cd ${chiaPath} && . ./activate && chia plots create -k ${kSize} -n ${queueSize} -a ${process.env.FINGERPRINT} -t ${tmpPath} -d ${finalPath} -r ${threadNum}`
  }
  if (!command) {
    console.error(
      'Please setup FARMER_EKY + POOL_KEY / FINGERPRINT in .env file'
    )
    return
  }
  const p = spawn(command, { shell: true })
  p.stdout?.on('data', (data: Buffer) => {
    const info = data.toString()
    // Start up
    if (info.includes('Starting plotting progress')) {
      const result = info.match(/ID: ([a-z|0-9]+)/)
      if (result) {
        progress.id = result[1]
      }
      // phase 1
    } else if (info.includes('Computing table')) {
      const res = info.match(/Computing table (\d+)/)
      if (res) {
        progress.phase = res[0]
        if (+res[1] > 1) {
          progress.create(res[0])
        }
      }
    } else if (
      progress.phase.startsWith('Computing table') &&
      progress.phase != 'Computing table 1'
    ) {
      if (info.includes('Total matches')) {
        progress.stop()
        progress.phase = ''
      } else {
        const res = info.match(/Bucket (\d+)/)
        if (res) {
          const finshBucketNum = +res[1] + 1
          progress.update(finshBucketNum)
        }
      }
    } else if (info.includes('Backpropagation into tmp files')) {
      progress.phase = 'Backpropagation'
      progress.create('Backpropagation', 7)
    } else if (info.includes('scanned table')) {
      progress.increment()
    } else if (info.includes('Time for phase 2')) {
      progress.increment()
      progress.stop()
      progress.phase = ''
    } else if (info.includes('Compressing tables')) {
      const res = info.match(/Compressing tables (\d) and (\d)/)
      if (res) {
        progress.phase = res[0]
        progress.create(res[0], 256)
      }
    } else if (progress.phase.startsWith('Compressing tables')) {
      if (info.includes('First computation pass')) {
        progress.update(128)
        progress.stop()
        progress.phase = ''
      } else if (info.includes('Second computation pass')) {
        progress.update(256)
        progress.stop()
        progress.phase = ''
      } else {
        const res = info.match(/Bucket (\d+)/)
        if (res) {
          progress.increment()
        }
      }
    } else if (info.includes('Total compress table time')) {
      progress.phase = 'Write Checkpoint tables'
      progress.create(progress.phase, 128)
    } else if (progress.phase === 'Write Checkpoint tables') {
      if (info.includes('Finished writing C1 and C3 tables')) {
        progress.stop()
        progress.phase = ''
      } else {
        const res = info.match(/Bucket (\d+)/)
        if (res) {
          progress.increment()
        }
      }
    } else {
      verbose && console.log(`${progress.id}: `, data.toString())
    }
  })

  p.on('close', (code) => {
    // console.log(`plot process close all stdio with code ${code}`)
    const idx = tasks.indexOf(progress)
    if (idx >= 0) {
      tasks.splice(idx, 1)
    }
    progress.release()
  })

  p.on('exit', (code) => {
    // console.log(`child process exited with code ${code}`)
  })

  p.on('error', (err) => {
    // console.log('error occur: ', err)
  })
}

export { createPlotProcess }
