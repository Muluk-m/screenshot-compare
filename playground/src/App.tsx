import type { ChangeEvent } from 'react'
import { Box, Button, CircularProgress, Container, FormControlLabel, Grid, Paper, Slider, Switch, Tab, Tabs, TextField, Typography } from '@mui/material'
import React, { useEffect, useState } from 'react'
import { initWebContainer, runScreenshotCompare } from './webcontainer'

interface CompareResult {
  diffPixels: number
  diffPercentage: string
  totalPixels: number
  passed: boolean
  diffPath?: string
}

function App() {
  const [url1, setUrl1] = useState('')
  const [url2, setUrl2] = useState('')
  const [threshold, setThreshold] = useState(0.1)
  const [fullPage, setFullPage] = useState(true)
  const [viewportWidth, setViewportWidth] = useState(1280)
  const [viewportHeight, setViewportHeight] = useState(800)
  const [result, setResult] = useState<CompareResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [tabValue, setTabValue] = useState(0)
  const [initializingWebContainer, setInitializingWebContainer] = useState(false)
  const [webContainerReady, setWebContainerReady] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  // 图片上传相关状态
  const [baselineImage, setBaselineImage] = useState<File | null>(null)
  const [currentImage, setCurrentImage] = useState<File | null>(null)
  const [baselineImageUrl, setBaselineImageUrl] = useState('')
  const [currentImageUrl, setCurrentImageUrl] = useState('')

  // 初始化WebContainer
  useEffect(() => {
    const initContainer = async () => {
      try {
        setInitializingWebContainer(true)
        await initWebContainer()
        setWebContainerReady(true)
        setErrorMessage('')
      }
      catch (error) {
        console.error('初始化WebContainer失败:', error)
        setErrorMessage('初始化WebContainer失败，请确保您的浏览器支持WebContainer')
      }
      finally {
        setInitializingWebContainer(false)
      }
    }

    initContainer()
  }, [])

  // 处理图片上传
  const handleImageUpload = (event: ChangeEvent<HTMLInputElement>, type: 'baseline' | 'current') => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0]
      const imageUrl = URL.createObjectURL(file)

      if (type === 'baseline') {
        setBaselineImage(file)
        setBaselineImageUrl(imageUrl)
      }
      else {
        setCurrentImage(file)
        setCurrentImageUrl(imageUrl)
      }
    }
  }

  // 处理标签页切换
  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue)
  }

  // 使用WebContainer比较URL
  const handleCompareUrls = async () => {
    if (!url1 || !url2 || !webContainerReady)
      return

    setLoading(true)
    setResult(null)
    setErrorMessage('')

    try {
      const compareResult = await runScreenshotCompare({
        url1,
        url2,
        threshold,
        fullPage,
        viewportWidth,
        viewportHeight,
      })
      setResult(compareResult)
    }
    catch (error) {
      console.error('比较失败:', error)
      setErrorMessage(`比较失败: ${error instanceof Error ? error.message : String(error)}`)
    }
    finally {
      setLoading(false)
    }
  }

  // 使用WebContainer比较图片
  const handleCompareImages = async () => {
    if (!baselineImage || !currentImage || !webContainerReady)
      return

    setLoading(true)
    setResult(null)
    setErrorMessage('')

    try {
      // 在WebContainer中比较图片
      const compareResult = await runScreenshotCompare({
        baseline: baselineImageUrl,
        current: currentImageUrl,
        threshold,
      })
      setResult(compareResult)
    }
    catch (error) {
      console.error('比较失败:', error)
      setErrorMessage(`比较失败: ${error instanceof Error ? error.message : String(error)}`)
    }
    finally {
      setLoading(false)
    }
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Screenshot Compare Playground
        </Typography>

        {initializingWebContainer && (
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <CircularProgress size={24} sx={{ mr: 2 }} />
            <Typography>正在初始化WebContainer环境...</Typography>
          </Box>
        )}

        {errorMessage && (
          <Paper sx={{ p: 2, mb: 2, bgcolor: '#ffebee' }}>
            <Typography color="error">{errorMessage}</Typography>
          </Paper>
        )}

        <Paper sx={{ mb: 3 }}>
          <Tabs value={tabValue} onChange={handleTabChange} variant="fullWidth">
            <Tab label="比较URL" />
            <Tab label="比较图片" />
          </Tabs>

          {/* URL比较面板 */}
          {tabValue === 0 && (
            <Box sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>URLs</Typography>
              <TextField
                fullWidth
                label="URL 1"
                value={url1}
                onChange={e => setUrl1(e.target.value)}
                margin="normal"
              />
              <TextField
                fullWidth
                label="URL 2"
                value={url2}
                onChange={e => setUrl2(e.target.value)}
                margin="normal"
              />

              <Box sx={{ mt: 3 }}>
                <Button
                  variant="contained"
                  onClick={handleCompareUrls}
                  disabled={loading || !url1 || !url2 || !webContainerReady}
                >
                  {loading ? '比较中...' : '比较URL'}
                </Button>
              </Box>
            </Box>
          )}

          {/* 图片比较面板 */}
          {tabValue === 1 && (
            <Box sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>上传图片</Typography>

              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography gutterBottom>基准图片:</Typography>
                  <input
                    accept="image/*"
                    type="file"
                    onChange={e => handleImageUpload(e, 'baseline')}
                    style={{ marginBottom: '16px' }}
                  />
                  {baselineImageUrl && (
                    <Box sx={{ mt: 1, mb: 2 }}>
                      <img src={baselineImageUrl} alt="基准图片" style={{ maxWidth: '100%', maxHeight: '200px' }} />
                    </Box>
                  )}
                </Grid>

                <Grid item xs={12} md={6}>
                  <Typography gutterBottom>当前图片:</Typography>
                  <input
                    accept="image/*"
                    type="file"
                    onChange={e => handleImageUpload(e, 'current')}
                    style={{ marginBottom: '16px' }}
                  />
                  {currentImageUrl && (
                    <Box sx={{ mt: 1, mb: 2 }}>
                      <img src={currentImageUrl} alt="当前图片" style={{ maxWidth: '100%', maxHeight: '200px' }} />
                    </Box>
                  )}
                </Grid>
              </Grid>

              <Box sx={{ mt: 3 }}>
                <Button
                  variant="contained"
                  onClick={handleCompareImages}
                  disabled={loading || !baselineImage || !currentImage || !webContainerReady}
                >
                  {loading ? '比较中...' : '比较图片'}
                </Button>
              </Box>
            </Box>
          )}
        </Paper>

        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>设置</Typography>

          <Typography gutterBottom>
            阈值:
            {' '}
            {threshold}
          </Typography>
          <Slider
            value={threshold}
            onChange={(_, value) => setThreshold(value as number)}
            min={0}
            max={1}
            step={0.01}
            marks
            valueLabelDisplay="auto"
          />

          <Box sx={{ mt: 2 }}>
            <FormControlLabel
              control={(
                <Switch
                  checked={fullPage}
                  onChange={e => setFullPage(e.target.checked)}
                />
              )}
              label="截取全页面"
            />
          </Box>

          <TextField
            type="number"
            label="视口宽度"
            value={viewportWidth}
            onChange={e => setViewportWidth(Number(e.target.value))}
            margin="normal"
            sx={{ mr: 2 }}
          />
          <TextField
            type="number"
            label="视口高度"
            value={viewportHeight}
            onChange={e => setViewportHeight(Number(e.target.value))}
            margin="normal"
          />
        </Paper>

        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <CircularProgress />
          </Box>
        )}

        {result && (
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>结果</Typography>
            <Typography>
              差异:
              {' '}
              {result.diffPercentage}
              %
            </Typography>
            <Typography>
              状态:
              {' '}
              {result.passed ? '通过' : '失败'}
            </Typography>
            <Typography>
              差异像素:
              {' '}
              {result.diffPixels}
            </Typography>
            <Typography>
              总像素:
              {' '}
              {result.totalPixels}
            </Typography>
            {result.diffPath && (
              <Box sx={{ mt: 2 }}>
                <Typography gutterBottom>差异图:</Typography>
                <img src={result.diffPath} alt="差异" style={{ maxWidth: '100%' }} />
              </Box>
            )}
          </Paper>
        )}
      </Box>
    </Container>
  )
}

export default App
