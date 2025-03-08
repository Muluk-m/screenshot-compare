# Screenshot Compare

A powerful tool for pixel-by-pixel comparison of website screenshots for visual regression testing. Capture screenshots of web pages and compare them to detect visual differences.

## Features

- 📸 Capture screenshots of web pages with customizable viewport sizes
- 🔍 Perform pixel-by-pixel comparison between baseline and current screenshots
- 📊 Generate visual difference reports with highlighted changes
- 🚀 Integrate with CI/CD pipelines for automated visual testing
- ⚙️ Configurable threshold for acceptable differences
- 📁 Organize and manage screenshot baselines

## Installation

```bash
npm install screenshot-compare
```

Or with other package managers:

```bash
yarn add screenshot-compare
pnpm add screenshot-compare
```

## CLI Usage

Screenshot Compare provides a command-line interface for easy integration into your workflow.

### Compare two URLs

```bash
s2c compare https://example.com https://staging.example.com --threshold 0.05
```

### Capture a single screenshot

```bash
s2c capture https://example.com ./screenshots/example.png --viewport-width 1440 --viewport-height 900
```

### CLI Options

#### Common Options

- `-w, --viewport-width <number>` - Width of the viewport (default: 1280)
- `-h, --viewport-height <number>` - Height of the viewport (default: 800)
- `-f, --full-page <boolean>` - Capture full page screenshot (default: true)
- `--wait <number>` - Additional wait time after page load in ms (default: 2000)
- `--timeout <number>` - Page load timeout in ms (default: 60000)

#### Compare Command Options

- `-t, --threshold <number>` - Difference threshold (0-1, default: 0.1)
- `-o, --output-prefix <string>` - Prefix for output filenames
- `--include-aa <boolean>` - Include anti-aliased pixels in comparison (default: false)

## Programmatic Usage

### Compare two screenshots

```js
import { compareScreenshots } from 'screenshot-compare'

// Compare two existing screenshots
const result = await compareScreenshots(
  'path/to/baseline.png',
  'path/to/current.png',
  'path/to/diff.png',
  { threshold: 0.1 }
)

console.log(`Difference: ${result.diffPercentage}%`)
console.log(`Passed: ${result.passed}`)
```

### Capture and compare websites

```js
import { screenshotCompare } from 'screenshot-compare'

// Capture and compare two websites
const result = await screenshotCompare({
  url1: 'https://example.com',
  url2: 'https://staging.example.com',
  output: 'path/to/diff.png',
  threshold: 0.1,
  viewportWidth: 1440,
  viewportHeight: 900,
  fullPage: true
})

console.log(`Difference: ${result.diffPercentage}%`)
console.log(`Passed: ${result.passed}`)
```

### Capture a screenshot

```js
import { captureScreenshot } from 'screenshot-compare'

// Capture a screenshot of a website
await captureScreenshot('https://example.com', 'path/to/screenshot.png', {
  viewportWidth: 1440,
  viewportHeight: 900,
  fullPage: true,
  waitAfterLoad: 2000
})
```

## API Reference

### `compareScreenshots(img1Path, img2Path, diffOutputPath, options)`

Compares two screenshots and returns the difference metrics.

#### Parameters

- `img1Path` - Path to the first screenshot
- `img2Path` - Path to the second screenshot
- `diffOutputPath` - (Optional) Path to save the diff image
- `options` - (Optional) Comparison options
  - `threshold` - Threshold for acceptable differences (0-1, default: 0.1)
  - `includeAA` - Include anti-aliased pixels in comparison (default: false)
  - `diffColor` - Color to highlight differences (RGBA object)
  - `alpha` - Alpha threshold for comparison
  - `aaColor` - Color to highlight anti-aliased pixels (RGBA object)

#### Returns

- `diffPixels` - Number of pixels that differ
- `diffPercentage` - Percentage of pixels that differ (as string)
- `totalPixels` - Total number of pixels compared
- `passed` - Boolean indicating if the difference is within the threshold
- `diffPath` - Path to the generated diff image (if output was specified)

### `captureScreenshot(url, outputPath, options)`

Captures a screenshot of a web page.

#### Parameters

- `url` - URL of the web page to capture
- `outputPath` - Path to save the screenshot
- `options` - (Optional) Capture options
  - `viewportWidth` - Width of the viewport (default: 1280)
  - `viewportHeight` - Height of the viewport (default: 800)
  - `timeout` - Page load timeout in ms (default: 60000)
  - `waitAfterLoad` - Additional wait time after page load in ms (default: 2000)
  - `fullPage` - Capture full page screenshot (default: true)
  - `browserOptions` - Puppeteer launch options

### `screenshotCompare(options)`

Captures screenshots of two web pages or compares two existing screenshots.

#### Options

- `baseline` - Path to the baseline screenshot (when comparing existing images)
- `current` - Path to the current screenshot (when comparing existing images)
- `output` - Path to save the diff image
- `url1` - URL of the first web page (when capturing screenshots)
- `url2` - URL of the second web page (when capturing screenshots)
- `threshold` - Threshold for acceptable differences (0-1, default: 0.1)
- `viewportWidth` - Width of the viewport (default: 1280)
- `viewportHeight` - Height of the viewport (default: 800)
- `waitAfterLoad` - Additional wait time after page load in ms (default: 2000)
- `fullPage` - Capture full page screenshot (default: true)
- `timeout` - Page load timeout in ms (default: 60000)
- `includeAA` - Include anti-aliased pixels in comparison (default: false)
- `diffColor` - Color to highlight differences (RGBA object)

## License

[MIT](./LICENSE.md) License © [Muluk-m](https://github.com/Muluk-m)

<!-- Badges -->

[npm-version-src]: https://img.shields.io/npm/v/screenshot-compare?style=flat&colorA=080f12&colorB=1fa669
[npm-version-href]: https://npmjs.com/package/screenshot-compare
[npm-downloads-src]: https://img.shields.io/npm/dm/screenshot-compare?style=flat&colorA=080f12&colorB=1fa669
[npm-downloads-href]: https://npmjs.com/package/screenshot-compare
[bundle-src]: https://img.shields.io/bundlephobia/minzip/screenshot-compare?style=flat&colorA=080f12&colorB=1fa669&label=minzip
[bundle-href]: https://bundlephobia.com/result?p=screenshot-compare
[license-src]: https://img.shields.io/github/license/Muluk-m/screenshot-compare.svg?style=flat&colorA=080f12&colorB=1fa669
[license-href]: https://github.com/Muluk-m/screenshot-compare/blob/main/LICENSE.md
[jsdocs-src]: https://img.shields.io/badge/jsdocs-reference-080f12?style=flat&colorA=080f12&colorB=1fa669
[jsdocs-href]: https://www.jsdocs.io/package/screenshot-compare
