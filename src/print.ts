import chalk from 'chalk'

export function printLog(message: string) {
  console.log(chalk.white(message))
}

export function printInfo(message: string) {
  console.log(chalk.cyan(message))
}

export function printError(message: string) {
  console.log(chalk.red(message))
}

export function printSuccess(message: string) {
  console.log(chalk.green(message))
}
