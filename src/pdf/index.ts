import puppeteer from 'puppeteer';
import path from 'path';
import { logger } from '../utils';

const main = async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  await page.goto('https://www.google.com.hk/');
  const filePath = 'src/pdf/gg.pdf';
  await page.pdf({path: filePath, format: 'A4'});
  logger.success(`导出 pdf 完成，文件在 ${filePath}`);
  await browser.close();
};

main();
