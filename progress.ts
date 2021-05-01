import { MultiBar, Presets, SingleBar } from 'cli-progress'
import { cyan } from 'colors'

const multibar = new MultiBar(
  {
    clearOnComplete: false,
    hideCursor: true,
    format:
      `{name} |` +
      cyan('{bar}') +
      `| {percentage}% || {value}/{total} Chunks || Source: {source} || Start: {start}`
  },
  Presets.shades_grey
)

class Progress {
  public phase = 'Computing table 0'
  public id = ''
  public tmpPath = ''
  private bar = new SingleBar({})
  private start = new Date().toLocaleString()

  public create(name: string, total = 128) {
    const sourcePathRoute = this.tmpPath.split('/')
    this.bar = multibar.create(total, 0, {
      name,
      source: sourcePathRoute[sourcePathRoute.length - 1],
      start: this.start
    })
  }

  public refresh() {
    this.bar.render()
  }

  public update(num: number) {
    this.bar.update(num)
  }

  public increment() {
    this.bar.increment()
  }

  public stop() {
    this.bar.stop()
    multibar.remove(this.bar)
  }
}

export { Progress }
