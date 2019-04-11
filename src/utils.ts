import chalk from 'chalk';

export const logger = {
  success(msg: any) {
    console.log(chalk.green(msg));
  },
  fail(msg: any) {
    console.log(chalk.red(msg));
  }
}
