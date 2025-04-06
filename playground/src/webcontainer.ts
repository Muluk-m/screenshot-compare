import type { FileSystemTree } from '@webcontainer/api'
import { WebContainer } from '@webcontainer/api'

// 初始化WebContainer实例
let webcontainerInstance: WebContainer

declare global {
  interface Window {
    runCompare: (options: any) => Promise<any>
  }
}

// 创建文件系统结构
const files: FileSystemTree = {
  'package.json': {
    file: {
      contents: JSON.stringify({
        name: 'screenshot-compare-web',
        type: 'module',
        dependencies: {
          'screenshot-compare': '*',
        },
        devDependencies: {},
      }, null, 2),
    },
  },
  'index.js': {
    file: {
      contents: `
        import { screenshotCompare } from 'screenshot-compare';
        
        // 导出函数供WebContainer外部调用
        window.runCompare = async (options) => {
          try {
            const result = await screenshotCompare(options);
            return result;
          } catch (error) {
            console.error('Error comparing screenshots:', error);
            throw error;
          }
        };
      `,
    },
  },
}

// 初始化WebContainer
export async function initWebContainer() {
  try {
    // 只初始化一次
    if (!webcontainerInstance) {
      // 启动WebContainer
      webcontainerInstance = await WebContainer.boot()

      // 挂载文件系统
      await webcontainerInstance.mount(files)

      // 安装依赖
      const installProcess = await webcontainerInstance.spawn('npm', ['install'])

      // 等待安装完成
      const installExitCode = await installProcess.exit

      if (installExitCode !== 0) {
        throw new Error('安装依赖失败')
      }

      // 运行Node.js脚本
      await webcontainerInstance.spawn('node', ['index.js'])

      console.log('WebContainer初始化成功')
    }

    return webcontainerInstance
  }
  catch (error) {
    console.error('WebContainer初始化失败:', error)
    throw error
  }
}

// 在WebContainer中运行截图比较
export async function runScreenshotCompare(options: any) {
  try {
    // 确保WebContainer已初始化
    await initWebContainer()

    // 调用WebContainer中的函数

    const result = await window.runCompare(options)

    return result
  }
  catch (error) {
    console.error('在WebContainer中运行截图比较失败:', error)
    throw error
  }
}
