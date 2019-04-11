import puppeteer from 'puppeteer';
import TurndownService from 'turndown';
import fs from 'fs';
import { AsyncResource } from 'async_hooks';

const url: string = 'https://juejin.im/book/5b936540f265da0a9624b04b/section/5b936540f265da0aec223b5d';
const password: string = process.env.password;
const phone: string = process.env.phone;

const login = (pass: string, phone: string) => {

}

const turndownService = new TurndownService();

const main = async() => {
  const browser = await puppeteer.launch({
    // headless: false
  });
  const page = await browser.newPage();
  await page.setViewport({
    width: 1024,
    height: 600 // limit height and make the login selector is in visible area
  });
  await page.goto(url);

  // login
  await page.click(".login");
  await page.type("input[name=loginPhoneOrEmail]", phone);
  await page.type("input[name=loginPassword]", password);
  await page.click(".auth-form .btn");


  await page.waitFor(5000);

  // get Markdown
  const catalogue = await page.$$('.book-directory .section-link');
  console.log(catalogue.length, 'length');

  const queue = catalogue.map((item, index) => {
    return async() => new Promise(async(resolve) => {
      const html = await page.evaluate(body => {
        const title = document.querySelector('.book-directory .route-active .center .title');
        const content = document.querySelector('.book-section-view .article-content') || {};
        return { content: content.innerHTML, title: title.innerHTML };
      });
      const md = turndownService.turndown(html.content);
      await page.click(`.book-directory .section-link:nth-of-type(${index + 1})`);
      await page.waitFor(3000);
      resolve({
        title: html.title,
        md,
      });
    })
  });
  for(let q of queue) {
    const { title, md }: { title: string, md: string } = await q();
    // console.log(item);
    await fs.writeFile(`./${title}.md`, md, () => {});
  }
}

main();