import puppeteer from 'puppeteer';
import TurndownService from 'turndown';
import fs from 'fs';
import { AsyncResource } from 'async_hooks';
import { logger } from '../utils';

const url: string = 'https://juejin.im/book/5b936540f265da0a9624b04b/section/5b936540f265da0aec223b5d';
const password: string = process.env.password || '';
const phone: string = process.env.phone || '';


const turndownService = new TurndownService();
/**
 * 这个方法的思路是给出小册的 id，打开页面。然后按目录去挨个点击，获取页面里的内容，并下载
 * 
 */
const main = async() => {
  if(!password || !phone) {
    logger.fail('环境变量请设置 password，phone');
    return;
  }
  const browser = await puppeteer.launch({
    // headless: false  // 如果想看具体操作流程，可打开
  });
  const page = await browser.newPage();
  await page.setViewport({
    width: 1024,
    height: 600 // limit height and make the login selector is in visible area
  });
  await page.goto(url);

  // 确保页面渲染出来
  await page.waitFor(1000);
  // login
  await page.click(".login");
  await page.type("input[name=loginPhoneOrEmail]", phone);
  await page.type("input[name=loginPassword]", password);
  await page.click(".auth-form .btn");
  logger.success(`登录成功, 账户为${phone}`);

  // 确保 content 渲染出来
  await page.waitFor(5000);

  // 关掉浮层，否则影响目录的点击
  const all = await page.$$('.ion-close');
  all.forEach(async (icon) => {
    await icon.click();
  });

  // get Markdown
  const catalogue = await page.$$('.book-directory .section-link');
  const queue = catalogue.map((item, index) => {
    return async() => new Promise(async(resolve) => {
      const html = await page.evaluate(body => {
        const imgs = document.querySelectorAll('div.book-content div.book-body img') as NodeListOf<HTMLImageElement>;
        imgs.forEach((img = document.createElement('img')) => {
          img.src = img.getAttribute('data-src') || '';
        });
        const title = <HTMLElement> document.querySelector('.book-directory .route-active .center .title') || {};
        const content = <HTMLElement> document.querySelector('.book-section-view .article-content') || {};
        return { content: content.innerHTML, title: title.innerHTML };
      });

      const md = turndownService.turndown(html.content);
      const isFinished = await page.$('.book-direction .step-btn--finished');
      if(!isFinished) {
        await page.click(`.book-directory .section-link:nth-of-type(${index + 2})`);
        await page.waitFor(3000);
      }
      resolve({
        index,
        title: html.title,
        md,
      });
    })
  });
  for(let q of queue) {
    const { title, md, index }: { title?: string, md?: string, index?: number } = await q();
    const fileNumber: number = typeof index === 'number' ? index + 1 : 0;
    await fs.writeFile(`./${fileNumber}${title}.md`, md, () => {
      logger.success(`${title} 下载成功`);
    });
  }
  await browser.close();
  logger.success('close');
}

main();