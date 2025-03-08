import type { LaunchOptions } from 'puppeteer'
import { execSync } from 'node:child_process'
import chalk from 'chalk'
import puppeteer from 'puppeteer'

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
}

/**
 * 截取网页截图
 * @param url 网页URL
 * @param outputPath 截图保存路径
 * @param options 截图配置选项
 */
/**
 * 检查并安装Puppeteer浏览器
 */
async function ensureBrowserInstalled() {
  try {
    // 尝试启动浏览器，如果浏览器不存在会抛出错误
    const browser = await puppeteer.launch({
      headless: true,
      // 不指定特定版本，使用Puppeteer默认支持的版本
      ignoreDefaultArgs: false,
      // 添加额外参数以避免版本冲突
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    })
    await browser.close()
    return true
  }
  catch (error) {
    if (String(error).includes('Could not find browser')) {
      console.log(chalk.yellow('⚠️ Puppeteer浏览器未安装，正在为您自动安装...'))
      try {
        // 执行安装命令，使用--force参数强制安装最新兼容版本
        execSync('npx puppeteer browsers install chrome --force', { stdio: 'inherit' })
        console.log(chalk.green('✅ Puppeteer浏览器安装成功！'))
        return true
      }
      catch (installError) {
        console.error(chalk.red('❌ 自动安装浏览器失败:'), installError)
        console.log(chalk.yellow('请手动运行: npx puppeteer browsers install chrome --force'))
        throw new Error('浏览器安装失败，请手动安装')
      }
    }
    else {
      throw error
    }
  }
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
    browserOptions = { headless: true },
  } = options

  // 确保浏览器已安装
  await ensureBrowserInstalled()

  const browser = await puppeteer.launch(browserOptions)

  try {
    const page = await browser.newPage()
    await page.setViewport({
      width: viewportWidth,
      height: viewportHeight,
    })

    // 设置更严格的等待条件，确保页面完全加载
    await page.goto(url, {
      waitUntil: ['networkidle0', 'domcontentloaded', 'load'],
      timeout,
    })

    // 额外等待一段时间，确保JavaScript渲染完成
    if (waitAfterLoad > 0) {
      await new Promise(resolve => setTimeout(resolve, waitAfterLoad))
    }

    // 等待页面不再有网络连接
    await page.waitForFunction(() => {
      return document.readyState === 'complete'
        && performance.timing.loadEventEnd > 0
    }, { timeout: 10000 })

    // 截取截图
    await page.screenshot({ path: outputPath, fullPage })
    return outputPath
  }
  catch (error) {
    throw new Error(`截取截图时出错: ${error}`)
  }
  finally {
    await browser.close()
  }
}
