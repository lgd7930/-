// 로컬 서버 실행 후: node tests/story-ui.test.cjs (개발 검증용 Playwright 필요)
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
(async () => {
 const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium', headless: true, args: ['--no-sandbox'] });
 try {
  const page = await browser.newPage(); const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('http://127.0.0.1:8000');
  assert.equal(await page.locator('h1').textContent(), '엘리멘트리');
  await page.waitForTimeout(160);
  const partial = await page.locator('.narrative').textContent();
  assert.ok(partial.length > 0 && partial.length < 50);
  await page.getByRole('button', { name: '다음 대화' }).focus();
  await page.keyboard.press('Space');
  assert.equal(await page.locator('#screen .speaker').textContent(), '서술');
  assert.ok((await page.locator('.narrative').textContent()).endsWith('나선다.'));
  await page.getByRole('button', { name: '다음 대화' }).click();
  await page.getByRole('button', { name: '돌아보기' }).click();
  assert.equal(await page.locator('#review-dialog').evaluate(node => node.open), true);
  assert.equal(await page.locator('.review-entry').count(), 2);
  const paused = await page.locator('.narrative').textContent();
  await page.waitForTimeout(250);
  assert.equal(await page.locator('.narrative').textContent(), paused);
  await page.keyboard.press('Escape'); await page.keyboard.press('Space');
  await page.getByRole('button', { name: '스킵', exact: true }).click();
  await page.waitForFunction(() => document.querySelector('h2').textContent === '무엇을 준비할까?');
  assert.equal(await page.locator('#skip').getAttribute('aria-pressed'), 'false');
  await page.getByRole('button', { name: '검에 빛을 두른다' }).click();
  await page.keyboard.press('Space');
  assert.ok((await page.locator('.narrative').nth(1).textContent()).endsWith('한다.'));
  await page.getByRole('button', { name: '자동 진행', exact: true }).click();
  await page.getByRole('button', { name: '돌아보기' }).click();
  await page.waitForTimeout(1700);
  assert.notEqual(await page.locator('#scene-title').textContent(), '다리를 지켜라');
  await page.getByRole('button', { name: '닫기', exact: true }).click();
  await page.waitForFunction(() => document.querySelector('h2').textContent === '다리를 지켜라');
  assert.equal(await page.locator('#auto').getAttribute('aria-pressed'), 'false');
  assert.equal(await page.locator('#skip').isDisabled(), true);
  assert.equal(await page.locator('.party-cut').count(), 2);
  assert.equal(await page.locator('.fragment-gauge').count(), 3);
  for (const gauge of await page.locator('.fragment-gauge').all()) {
   assert.equal(await gauge.locator('.fragment-piece').count(), 5);
   assert.equal(await gauge.getAttribute('aria-valuenow'), '5');
  }
  assert.equal(await page.locator('.party-cut.current strong').textContent(), '아린');
  // 비어 있는 조각도 표현하고 큰 게이지/인물 게이지가 같은 값을 읽는지 확인합니다.
  await page.evaluate(() => { battle.fragments[battle.activeMemberId] = 2; showBattle(); });
  assert.equal(await page.locator('.active-cost-panel .filled').count(), 2);
  assert.equal(await page.locator('.party-cut.current .filled').count(), 2);
  assert.equal(await page.locator('.party-cut:not(.current) .filled').count(), 5);
  await page.screenshot({path:'/tmp/elementry-battle-desktop.png',fullPage:true});
  await page.setViewportSize({width:375,height:812});
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
  await page.screenshot({path:'/tmp/elementry-battle-mobile.png',fullPage:true});
  await page.setViewportSize({width:1280,height:720});
  await page.evaluate(() => { battle.fragments[battle.activeMemberId] = 5; showBattle(); });
  for (const name of ['새벽의 빛', '새벽의 빛', '방어 ·', '공격 ·', '공격 ·']) await page.getByRole('button', { name }).click();
  await page.keyboard.press('Space');
  assert.ok((await page.locator('.narrative').textContent()).endsWith('지켜졌다.'));
  await page.getByRole('button', { name: '처음부터' }).click();
  await page.getByRole('button', { name: '돌아보기' }).click();
  assert.equal(await page.locator('.review-entry').count(), 1);
  await page.getByRole('button', { name: '닫기', exact: true }).click();
  // 자동 진행을 중지하면 출력 완료 후에도 다음 대사로 넘어가지 않습니다.
  await page.keyboard.press('Space');
  await page.getByRole('button', { name: '자동 진행', exact: true }).click();
  await page.getByRole('button', { name: '자동 진행 · 켜짐' }).click();
  await page.waitForTimeout(1600); assert.equal(await page.locator('#screen .speaker').textContent(), '서술');
  await page.getByRole('button', { name: '자동 진행', exact: true }).click();
  await page.waitForFunction(() => document.querySelector('#screen .speaker').textContent === '동료 미루');
  await page.getByRole('button', { name: '자동 진행 · 켜짐' }).click();
  await page.setViewportSize({width:375,height:812});
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
  assert.deepEqual(errors, []);
  console.log('PASS: title, typing, Space completion, skip, auto on/off, review pause/resume, choice/battle boundaries, result, restart, party cuts, five fragments, full/empty gauge synchronization, mobile, no JS errors');
 } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
