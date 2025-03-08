// @ts-check
import antfu from '@antfu/eslint-config'

export default antfu(
  {
    type: 'lib',
    pnpm: true,
  },
  {
    rules: {
      'ts/explicit-function-return-type': 'off',
      'node/prefer-global/process': 'off',
      'no-console': 'off',
    },
  },
)
