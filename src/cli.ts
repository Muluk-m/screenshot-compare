#!/usr/bin/env node
import chalk from 'chalk'
import { program } from 'commander'
import { captureScreenshot } from './capture'
import { compareUrl } from './compare'
import { printSuccess } from './print'

program
  .name('screenshot-compare')
  .description('A CLI tool for comparing screenshots of web pages')
  .version('0.1.0')

program
  .command('compare')
  .description('Compare screenshots of two web pages')
  .argument('<url1>', 'First website URL')
  .argument('<url2>', 'Second website URL')
  .option('-t, --threshold <number>', 'Difference threshold (decimal between 0-1)', Number.parseFloat, 0.1)
  .option('-o, --output-prefix <string>', 'Output filename prefix')
  .option('-w, --viewport-width <number>', 'Viewport width', Number.parseInt, 1280)
  .option('-h, --viewport-height <number>', 'Viewport height', Number.parseInt, 800)
  .option('-f, --full-page <boolean>', 'Whether to capture full page', parseBool, true)
  .option('-w, --wait <number>', 'Additional wait time after page load (ms)', Number.parseInt, 2000)
  .option('--timeout <number>', 'Page load timeout (ms)', Number.parseInt, 60000)
  .option('--include-aa <boolean>', 'Whether to include anti-aliased pixels', parseBool, false)
  .action(async (url1, url2, options) => {
    try {
      const result = await compareUrl(url1, url2, options)
      process.exit(result ? 0 : 1)
    }
    catch (error) {
      console.error(chalk.red('Execution failed:'), error)
      process.exit(1)
    }
  })

program
  .command('capture')
  .description('Capture screenshot of a web page')
  .argument('<url>', 'Website URL')
  .argument('<output>', 'Output file path')
  .option('-w, --viewport-width <number>', 'Viewport width', Number.parseInt, 1280)
  .option('-h, --viewport-height <number>', 'Viewport height', Number.parseInt, 800)
  .option('-f, --full-page <boolean>', 'Whether to capture full page', parseBool, true)
  .option('-w, --wait <number>', 'Additional wait time after page load (ms)', Number.parseInt, 2000)
  .option('--timeout <number>', 'Page load timeout (ms)', Number.parseInt, 60000)
  .action(async (url, output, options) => {
    try {
      await captureScreenshot(url, output, {
        viewportWidth: options.viewportWidth,
        viewportHeight: options.viewportHeight,
        waitAfterLoad: options.wait,
        fullPage: options.fullPage,
        timeout: options.timeout,
      })
      printSuccess(`Screenshot saved to: ${output}`)
      process.exit(0)
    }
    catch (error) {
      console.error(chalk.red('Execution failed:'), error)
      process.exit(1)
    }
  })

function parseBool(value: string): boolean {
  return value.toLowerCase() === 'true'
}

program.parse()

if (!process.argv.slice(2).length) {
  program.outputHelp()
}
