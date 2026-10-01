// Screenshot helper.  node scripts/shot.mjs <path> <out.png> [width=1440] [height=900] [--full] [--click=selector]... [--wait=ms] [--mobile]
// Example: node scripts/shot.mjs /lab/drobi/pizza-cut /tmp/a.png 1440 900 --click=".stepper__b:last-child"
import {chromium} from 'playwright';
const args = process.argv.slice(2);
const pos = args.filter((a) => !a.startsWith('--'));
const [path = '/', out = '/tmp/shot.png', w = '1440', h = '900'] = pos;
const flags = args.filter((a) => a.startsWith('--'));
const full = flags.includes('--full');
const mobile = flags.includes('--mobile');
const wait = Number(flags.find((f) => f.startsWith('--wait='))?.slice(7) ?? 900);
const base = process.env.BASE ?? 'http://localhost:5173';
const browser = await chromium.launch({executablePath: process.env.CHROME ?? '/usr/bin/google-chrome-stable', args: ['--autoplay-policy=no-user-gesture-required']});
const page = await browser.newPage({viewport: {width: +w, height: +h}, deviceScaleFactor: 1, hasTouch: mobile, isMobile: mobile});
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
await page.goto(base + path, {waitUntil: 'networkidle'});
await page.waitForTimeout(wait);
for (const f of flags.filter((f) => f.startsWith('--click='))) {
  const sel = f.slice(8);
  await page.locator(sel).first().click({force: true});
  await page.waitForTimeout(350);
}
for (const f of flags.filter((f) => f.startsWith('--scroll='))) {
  await page.mouse.wheel(0, Number(f.slice(9)));
  await page.waitForTimeout(1200);
}
await page.waitForTimeout(400);
await page.screenshot({path: out, fullPage: full});
if (errors.length) console.log('ERRORS:\n' + errors.join('\n'));
await browser.close();
console.log('saved', out);
