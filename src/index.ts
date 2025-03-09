import type { RGBTuple } from 'pixelmatch'
import type { CaptureOptions } from './capture'
import type { CompareResult } from './compare'
import fs from 'node:fs'
import path from 'node:path'
import { captureScreenshot } from './capture'
import { compareScreenshots } from './compare'

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
    const timestamp = new Date().toISOString().split('T')[0]
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
      diffColor: options.diffColor || [255, 0, 0],
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
        diffColor: options.diffColor || [255, 0, 0],
      },
    )
  }

  throw new Error('Should provide either URLs or image paths')
}

export { captureScreenshot, compareScreenshots }
