#!/usr/bin/env node
import type { RGBTuple } from 'pixelmatch'
import type { CaptureOptions } from './capture'
import type { CompareOptions, CompareResult } from './compare'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import chalk from 'chalk'
import { program } from 'commander'
import { captureScreenshot } from './capture'
import { compareScreenshots } from './compare'

// 获取当前文件的目录路径
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Ensure output directory exists
const outputDir = path.join(process.cwd(), 'output')
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true })
}

/**
 * Main function: Compare screenshots of two URLs
 */
async function compareUrls(
  url1: string,
  url2: string,
  options: {
    threshold?: number
    outputPrefix?: string
    viewportWidth?: number
    viewportHeight?: number
    waitAfterLoad?: number
    fullPage?: boolean
    timeout?: number
    includeAA?: boolean
    diffColor?: RGBTuple
  },
) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const outputPrefix = options.outputPrefix || timestamp

  const img1Path = path.join(outputDir, `${outputPrefix}-site1.png`)
  const img2Path = path.join(outputDir, `${outputPrefix}-site2.png`)
  const diffPath = path.join(outputDir, `${outputPrefix}-diff.png`)

  // 提取截图选项
  const captureOptions: CaptureOptions = {
    viewportWidth: options.viewportWidth,
    viewportHeight: options.viewportHeight,
    waitAfterLoad: options.waitAfterLoad,
    fullPage: options.fullPage,
    timeout: options.timeout,
  }

  // 提取比较选项
  const compareOptions: CompareOptions = {
    threshold: options.threshold,
    includeAA: options.includeAA,
    diffColor: options.diffColor,
  }

  try {
    // Capture screenshots of both websites
    console.log(chalk.blue(`Capturing first website: ${url1}`))
    await captureScreenshot(url1, img1Path, captureOptions)

    console.log(chalk.blue(`Capturing second website: ${url2}`))
    await captureScreenshot(url2, img2Path, captureOptions)

    // Compare screenshots
    console.log(chalk.blue('Comparing screenshots...'))
    const result = await compareScreenshots(img1Path, img2Path, diffPath, compareOptions)

    // Output comparison results
    console.log(chalk.cyan('\nComparison results:'))
    console.log(chalk.white(`Total pixels: ${result.totalPixels}`))
    console.log(chalk.white(`Different pixels: ${result.diffPixels}`))
    console.log(chalk.white(`Difference percentage: ${result.diffPercentage}%`))
    console.log(chalk.white(`Diff image saved to: ${diffPath}`))

    // Determine test result based on threshold
    const threshold = options.threshold || 0.1 // Default threshold is 0.1%
    const thresholdPercentage = threshold * 100

    if (result.passed) {
      console.log(chalk.green(`\n✅ Test passed! Difference percentage ${result.diffPercentage}% is below threshold ${thresholdPercentage}%`))
      return true
    }
    else {
      console.log(chalk.red(`\n❌ Test failed! Difference percentage ${result.diffPercentage}% exceeds threshold ${thresholdPercentage}%`))
      return false
    }
  }
  catch (error) {
    console.error(chalk.red('Error during comparison:'), error)
    throw error
  }
}

/**
 * 导出API函数，用于程序化调用
 */
export interface ScreenshotCompareOptions {
  /** 基准图片路径 */
  baseline?: string
  /** 当前图片路径 */
  current?: string
  /** 差异图输出路径 */
  output?: string
  /** 第一个URL */
  url1?: string
  /** 第二个URL */
  url2?: string
  /** 差异阈值 (0-1之间) */
  threshold?: number
  /** 视口宽度 */
  viewportWidth?: number
  /** 视口高度 */
  viewportHeight?: number
  /** 页面加载后额外等待时间(毫秒) */
  waitAfterLoad?: number
  /** 是否截取全页面 */
  fullPage?: boolean
  /** 页面加载超时时间(毫秒) */
  timeout?: number
  /** 是否包含抗锯齿像素 */
  includeAA?: boolean
  /** 差异颜色的RGBA值 */
  diffColor?: RGBTuple
}

export async function screenshotCompare(options: ScreenshotCompareOptions): Promise<CompareResult> {
  // 如果提供了URL，则先截图再比较
  if (options.url1 && options.url2) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const img1Path = options.baseline || path.join(process.cwd(), `output/${timestamp}-site1.png`)
    const img2Path = options.current || path.join(process.cwd(), `output/${timestamp}-site2.png`)
    const diffPath = options.output || path.join(process.cwd(), `output/${timestamp}-diff.png`)

    // 确保输出目录存在
    const outputDir = path.dirname(img1Path)
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true })
    }

    // 截图选项
    const captureOptions: CaptureOptions = {
      viewportWidth: options.viewportWidth,
      viewportHeight: options.viewportHeight,
      waitAfterLoad: options.waitAfterLoad,
      fullPage: options.fullPage,
      timeout: options.timeout,
    }

    // 截取两个网站的截图
    await captureScreenshot(options.url1, img1Path, captureOptions)
    await captureScreenshot(options.url2, img2Path, captureOptions)

    // 比较截图
    return compareScreenshots(img1Path, img2Path, diffPath, {
      threshold: options.threshold,
      includeAA: options.includeAA,
      diffColor: options.diffColor,
    })
  }

  // 如果只提供了图片路径，则直接比较
  if (options.baseline && options.current) {
    return compareScreenshots(
      options.baseline,
      options.current,
      options.output,
      {
        threshold: options.threshold,
        includeAA: options.includeAA,
        diffColor: options.diffColor,
      },
    )
  }

  throw new Error('必须提供两个URL或两个图片路径进行比较')
}

export { captureScreenshot, compareScreenshots }

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
      const result = await compareUrls(url1, url2, options)
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
      console.log(chalk.green(`Screenshot saved to: ${output}`))
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
