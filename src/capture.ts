import type { BrowserContextOptions, LaunchOptions } from 'playwright'
import { chromium } from 'playwright'

/**
 * 截图配置选项
 */
export interface CaptureOptions {
  /** 视口宽度 */
  viewportWidth?: number
  /** 视口高度 */
  viewportHeight?: number
  /** 页面加载超时时间(毫秒) */
  timeout?: number
  /** 页面加载后额外等待时间(毫秒) */
  waitAfterLoad?: number
  /** 是否截取全页面 */
  fullPage?: boolean
  /** 浏览器启动选项 */
  browserOptions?: LaunchOptions
  /** 浏览器上下文选项 */
  contextOptions?: BrowserContextOptions
  /** cookie */
  cookieString?: string
}

/**
 * 截取网页截图
 * @param url 网页URL
 * @param outputPath 截图保存路径
 * @param options 截图配置选项
 */
export async function captureScreenshot(
  url: string,
  outputPath: string,
  options: CaptureOptions = {},
) {
  const {
    viewportWidth = 1280,
    viewportHeight = 800,
    timeout = 60000,
    waitAfterLoad = 2000,
    fullPage = true,
    browserOptions = {},
    contextOptions = {},
    cookieString,
  } = options

  const browser = await chromium.launch(browserOptions)

  try {
    const context = await browser.newContext({
      viewport: {
        width: viewportWidth,
        height: viewportHeight,
      },
      ...contextOptions,
    })

    // 创建新页面
    const page = await context.newPage()

    if (cookieString) {
      const cookies = cookieString.split(';').map((pair) => {
        const [name, value] = pair.trim().split('=')
        return {
          name,
          value,
          domain: new URL(url).hostname,
          path: '/',
        }
      })
      await context.addCookies(cookies)
    }

    // TODO 使用断言确保加载完成
    await page.goto(url, {
      waitUntil: 'networkidle',
      timeout,
    })

    // 额外等待一段时间，确保JavaScript渲染完成
    if (waitAfterLoad > 0) {
      await page.waitForTimeout(waitAfterLoad)
    }

    // 等待页面完全加载
    await page.waitForFunction(() => {
      return document.readyState === 'complete'
    }, { timeout: 10000 })

    // 截取截图
    await page.screenshot({
      path: outputPath,
      fullPage,
    })

    return outputPath
  }
  catch (error) {
    throw new Error(`Failed to capture screenshot: ${error}`)
  }
  finally {
    await browser.close()
  }
}
