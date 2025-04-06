import type { RGBTuple } from 'pixelmatch'
import type { CaptureOptions } from './capture'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import pixelmatch from 'pixelmatch'
import { PNG } from 'pngjs'
import { captureScreenshot } from './capture'
import { printError, printInfo, printLog, printSuccess } from './print'

/**
 * Comparison options
 */
export interface CompareOptions {
  /** Difference threshold (0-1) */
  threshold?: number
  /** Whether to include anti-aliased pixels */
  includeAA?: boolean
  /** Difference color RGBA value */
  diffColor?: RGBTuple
  /** Alpha threshold */
  alpha?: number
  /** Anti-aliasing color threshold */
  aaColor?: RGBTuple
}

/**
 * Comparison results
 */
export interface CompareResult {
  /** Number of different pixels */
  diffPixels: number
  /** Difference percentage (string with 2 decimal places) */
  diffPercentage: string
  /** Total number of pixels */
  totalPixels: number
  /** Whether the test passed */
  passed: boolean
  /** Path to diff image */
  diffPath?: string
}

/**
 * Compare two screenshots
 * @param img1Path Path to first screenshot
 * @param img2Path Path to second screenshot
 * @param diffOutputPath Path to save diff image
 * @param options Comparison options
 * @returns Comparison results
 */
export async function compareScreenshots(
  img1Path: string,
  img2Path: string,
  diffOutputPath?: string,
  options: CompareOptions = {},
): Promise<CompareResult> {
  const {
    threshold = 0.1,
    includeAA = false,
    diffColor = [255, 0, 0],
    alpha = 0,
    aaColor = [255, 255, 255],
  } = options

  const img1 = PNG.sync.read(fs.readFileSync(img1Path))
  const img2 = PNG.sync.read(fs.readFileSync(img2Path))

  // 确保两张图片尺寸一致，取最大宽高
  const width = Math.max(img1.width, img2.width)
  const height = Math.max(img1.height, img2.height)

  // 创建新的图像缓冲区
  const img1Buffer = new PNG({ width, height })
  const img2Buffer = new PNG({ width, height })
  const diffBuffer = new PNG({ width, height })

  // 将原始图像复制到新缓冲区
  PNG.bitblt(img1, img1Buffer, 0, 0, img1.width, img1.height, 0, 0)
  PNG.bitblt(img2, img2Buffer, 0, 0, img2.width, img2.height, 0, 0)

  // 比较图像差异
  const diffPixels = pixelmatch(
    img1Buffer.data,
    img2Buffer.data,
    diffBuffer.data,
    width,
    height,
    {
      threshold,
      includeAA,
      diffColor,
      alpha,
      aaColor,
    },
  )

  // 计算差异百分比
  const totalPixels = width * height
  const diffPercentage = (diffPixels / totalPixels) * 100
  const diffPercentageStr = diffPercentage.toFixed(2)

  // 如果提供了输出路径，保存差异图
  if (diffOutputPath) {
    fs.writeFileSync(diffOutputPath, PNG.sync.write(diffBuffer))
  }

  return {
    diffPixels,
    diffPercentage: diffPercentageStr,
    totalPixels,
    passed: diffPercentage <= threshold * 100,
    diffPath: diffOutputPath,
  }
}

/**
 * Compare screenshots of two URLs
 */
export async function compareUrl(
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
    outputDir?: string
    cookie?: string
  },
) {
  const timestamp = new Date().getTime()
  const outputPrefix = options.outputPrefix || timestamp
  const outputDir = options.outputDir || path.join(os.tmpdir(), 'screenshot-compare')

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true })
  }

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
    cookieString: options.cookie,
  }

  // 提取比较选项
  const compareOptions: CompareOptions = {
    threshold: options.threshold,
    includeAA: options.includeAA,
    diffColor: options.diffColor || [255, 0, 0],
  }

  try {
    // Capture screenshots of both websites
    printInfo(`Capturing first website: ${url1}`)
    await captureScreenshot(url1, img1Path, captureOptions)

    printInfo(`Capturing second website: ${url2}`)
    await captureScreenshot(url2, img2Path, captureOptions)

    // Compare screenshots
    printInfo('Comparing screenshots...')
    const result = await compareScreenshots(img1Path, img2Path, diffPath, compareOptions)

    // Output comparison results
    printInfo('\nComparison results:')
    printLog(`Total pixels: ${result.totalPixels}`)
    printLog(`Different pixels: ${result.diffPixels}`)
    printLog(`Difference percentage: ${result.diffPercentage}%`)
    printLog(`Diff image saved to: ${diffPath}`)

    // Determine test result based on threshold
    const threshold = options.threshold || 0.1 // Default threshold is 0.1%
    const thresholdPercentage = threshold * 100

    if (result.passed) {
      printSuccess(`\n✅ Test passed! Difference percentage ${result.diffPercentage}% is below threshold ${thresholdPercentage}%`)
      return true
    }
    else {
      printError(`\n❌ Test failed! Difference percentage ${result.diffPercentage}% exceeds threshold ${thresholdPercentage}%`)
      return false
    }
  }
  catch (error) {
    if (error instanceof Error) {
      printError(`Error during comparison: ${error.message}`)
    }
    throw error
  }
}
