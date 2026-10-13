// 로컬 서버 실행 후: node tests/story-ui.test.cjs (개발 검증용 Playwright 필요)
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
(async () => {
 const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium', headless: true, args: ['--no-sandbox'] });
 try {
  const page = await browser.newPage(); const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(process.env.GAME_URL || 'http://127.0.0.1:8000');
  assert.equal(await page.locator('h1').textContent(), '엘리멘트리');
  await page.waitForTimeout(160);
  const partial = await page.locator('.narrative').textContent(); assert.ok(partial.length > 0 && partial.length < 30);
  await page.getByRole('button', { name: '다음 대화' }).focus(); await page.keyboard.press('Space');
  assert.equal(await page.locator('#screen .speaker').textContent(), '서술');
  assert.ok((await page.locator('.narrative').textContent()).endsWith('있다.'));
  await page.getByRole('button', { name: '다음 대화' }).click();
  await page.getByRole('button', { name: '돌아보기' }).click();
  assert.equal(await page.locator('#review-dialog').evaluate(node => node.open), true);
  assert.equal(await page.locator('.review-entry').count(), 2);
  const paused = await page.locator('.narrative').textContent(); await page.waitForTimeout(250);
  assert.equal(await page.locator('.narrative').textContent(), paused);
  await page.keyboard.press('Escape'); await page.keyboard.press('Space');
  await page.getByRole('button', { name: '스킵', exact: true }).click();
  await page.waitForFunction(() => document.querySelector('h2').textContent === '어떻게 전투를 준비할까?');
  assert.equal(await page.locator('#skip').getAttribute('aria-pressed'), 'false');
  await page.getByRole('button', { name: '공격에 집중한다' }).click(); await page.keyboard.press('Space');
  assert.ok((await page.locator('.narrative').nth(1).textContent()).endsWith('시작한다.'));
  await page.getByRole('button', { name: '자동 진행', exact: true }).click();
  await page.getByRole('button', { name: '돌아보기' }).click(); await page.waitForTimeout(1700);
  assert.notEqual(await page.locator('#scene-title').textContent(), '루이의 턴');
  await page.getByRole('button', { name: '닫기', exact: true }).click();
  await page.waitForFunction(() => document.querySelector('h2').textContent === '루이의 턴');
  assert.equal(await page.locator('#auto').getAttribute('aria-pressed'), 'false');
  assert.equal(await page.locator('.party-cut').count(), 2); assert.equal(await page.locator('.enemy-card').count(),3);
  assert.equal(await page.locator('.fragment-gauge').count(),5);
  assert.equal(await page.locator('.active-cost-panel').count(),0);
  assert.equal(await page.getByRole('button',{name:'적 행동 보기'}).count(),0);
  for(const gauge of await page.locator('.fragment-gauge').all()) {
   assert.equal(await gauge.locator('.fragment-piece').count(),5); assert.equal(await gauge.getAttribute('aria-valuenow'),'0');
  }
  assert.equal(await page.getByRole('button',{name:/그라비티 폴/}).isDisabled(),true);
  assert.equal(await page.getByRole('button',{name:/그라비티 체이스/}).isDisabled(),true);
  await page.getByRole('button',{name:/그라비티 볼/}).click();
  await page.waitForTimeout(150);
  const animated = await page.locator('[data-unit-id="jane"] .hp-fill').evaluate(node => node.getBoundingClientRect().width / node.parentElement.getBoundingClientRect().width);
  assert.ok(animated > 75/90 && animated < 1, `health should interpolate: ${animated}`);
  assert.equal(await page.locator('[data-unit-id="jane"] .hp-track').getAttribute('aria-valuenow'),'75');
  assert.equal(await page.locator('[data-unit-id="jane"] .damaged').count(),1);
  assert.ok((await page.locator('.combat-typing').textContent()).length > 0);
  assert.equal(await page.getByRole('button',{name:/그라비티 볼/}).isDisabled(),true);
  await page.waitForFunction(()=>!battleBusy && currentActor(battle).id==='ruin');
  assert.equal(await page.locator('#scene-title').textContent(),'루인의 턴');
  assert.equal(await page.locator('[data-unit-id="louis"] [role="meter"]').getAttribute('aria-valuenow'),'1');
  assert.ok((await page.locator('[data-unit-id="jane"] .status-badge').textContent()).includes('암흑 1'));
  await page.getByRole('button',{name:/어둠을 밝히는 빛/}).click();
  await page.waitForFunction(()=>battleBusy && battlePresentation?.id==='jane');
  assert.equal(await page.getByRole('button',{name:'적 행동 보기'}).count(),0);
  assert.ok((await page.locator('[data-unit-id="jane"] .status-badge').textContent()).includes('광채 1'));
  await page.getByRole('button',{name:'돌아보기'}).click();
  const battlePaused=await page.evaluate(()=>({state:JSON.stringify(battle),lines:log.length,text:screen.querySelector('.log').textContent}));
  await page.waitForTimeout(1200);
  assert.deepEqual(await page.evaluate(()=>({state:JSON.stringify(battle),lines:log.length,text:screen.querySelector('.log').textContent})),battlePaused);
  await page.getByRole('button',{name:'닫기',exact:true}).click();
  await page.waitForFunction(()=>!battleBusy && currentActor(battle).id==='louis');
  assert.equal(await page.locator('[data-unit-id="jane"] [role="meter"]').getAttribute('aria-valuenow'),'1');
  assert.equal(await page.locator('[data-unit-id="right-hand"] [role="meter"]').getAttribute('aria-valuenow'),'1');
  assert.equal(await page.locator('[data-unit-id="left-hand"] [role="meter"]').getAttribute('aria-valuenow'),'1');
  // 암흑 없는 적을 선택하면 체이스는 금지되지만 폴은 표식 적 전체에 사용 가능합니다.
  await page.getByRole('button',{name:'제인의 오른팔 대상 선택',exact:true}).click();
  assert.equal(await page.getByRole('button',{name:/그라비티 체이스/}).isDisabled(),true);
  assert.equal(await page.getByRole('button',{name:/그라비티 폴/}).isDisabled(),false);
  await page.getByRole('button',{name:'제인 대상 선택',exact:true}).click();
  await page.getByRole('button',{name:/그라비티 체이스/}).click();
  await page.waitForFunction(()=>!battleBusy && currentActor(battle).id==='ruin');
  for(const id of ['jane','right-hand','left-hand']) assert.ok((await page.locator(`[data-unit-id="${id}"] .status-badge`).textContent()).includes('암흑 1'));
  assert.equal(await page.locator('[data-unit-id="louis"] [role="meter"]').getAttribute('aria-valuenow'),'0');
  // 속도만 줄여 완주 검증 시간을 단축합니다. 전투 규칙과 수치는 그대로 유지합니다.
  await page.evaluate(()=>Object.assign(PRESENTATION,{combatTypingMs:1,combatLineDelayMs:0,enemyDelayMs:10,hpDrainMs:20}));
  await page.getByRole('button',{name:/어둠을 가르는 빛/}).click();
  assert.ok((await page.locator('[data-unit-id="jane"] .status-badge').textContent()).includes('광채 4'));
  assert.equal(await page.locator('[data-unit-id="ruin"] [role="meter"]').getAttribute('aria-valuenow'),'0');
  await page.setViewportSize({width:375,height:812});
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  await page.screenshot({path:'/tmp/elementry-v05-mobile.png',fullPage:true});
  await page.setViewportSize({width:1280,height:900});
  // 실제 버튼만으로 끝까지 플레이합니다. 사망자 건너뛰기와 최종 결과도 확인합니다.
  for(let i=0;i<150;i++) {
   await page.waitForFunction(()=>!battleBusy && (battle.outcome || currentActor(battle).side==='party'));
   const decision=await page.evaluate(()=>{
    if(battle.outcome) return {outcome:battle.outcome};
    const actor=currentActor(battle);
    if(actor.side==='enemy') return {enemy:true};
    const target=[...opponents(battle)].sort((a,b)=>a.hp-b.hp)[0];
    const skill=actor.skills.find(s=>s.effect==='detonate-dark' && opponents(battle).reduce((sum,u)=>sum+u.dark,0)>=2 && actionAvailability(battle,{skillId:s.id},COMBAT).ok)
      ||actor.skills.find(s=>s.id==='cutting-light' && actionAvailability(battle,{skillId:s.id,targetId:target.id},COMBAT).ok)||actor.skills[0];
    return {skillName:skill.name,targetId:target.id};
   });
   if(decision.outcome) { assert.equal(decision.outcome,'victory'); break; }
   if(decision.enemy) throw new Error('enemy should advance automatically');
   else {
    await page.locator(`.enemy-card[data-unit-id="${decision.targetId}"]`).click();
    await page.getByRole('button',{name:new RegExp(decision.skillName)}).click();
   }
  }
  await page.waitForFunction(()=>document.querySelector('h2').textContent==='형제가 연 길');
  assert.equal(await page.locator('#scene-title').textContent(),'형제가 연 길'); await page.keyboard.press('Space');
  await page.getByRole('button',{name:'처음부터'}).click();
  await page.getByRole('button',{name:'돌아보기'}).click(); assert.equal(await page.locator('.review-entry').count(),1);
  await page.getByRole('button',{name:'닫기',exact:true}).click();
  await page.keyboard.press('Space');
  await page.getByRole('button',{name:'자동 진행',exact:true}).click(); await page.getByRole('button',{name:'자동 진행 · 켜짐'}).click();
  await page.waitForTimeout(1600); assert.equal(await page.locator('#screen .speaker').textContent(),'서술');
  await page.getByRole('button',{name:'자동 진행',exact:true}).click();
  await page.waitForFunction(()=>document.querySelector('#screen .speaker').textContent==='루인');
  await page.getByRole('button',{name:'스킵',exact:true}).click();
  await page.waitForFunction(()=>document.querySelector('h2').textContent==='어떻게 전투를 준비할까?');
  await page.getByRole('button',{name:'서로를 지킬 준비를 한다'}).click(); await page.keyboard.press('Space');
  await page.getByRole('button',{name:'전투 시작'}).click();
  assert.equal(await page.locator('.fragment-piece.filled').count(),0);
  // 아군만 방어를 선택하며 적의 자동 행동으로 패배까지 도달합니다.
  for(let i=0;i<200;i++) {
   await page.waitForFunction(()=>!battleBusy && (battle.outcome || currentActor(battle).side==='party'));
   if(await page.getByRole('button',{name:'처음부터'}).count()) break;
   await page.getByRole('button',{name:'방어 ·'}).click();
  }
  assert.equal(await page.locator('#scene-title').textContent(),'다음 기회를 위해');
  assert.deepEqual(errors,[]);
  console.log('PASS: story controls, two allies/three enemies, zero gauges, target restrictions, per-unit cost gain/spend, dark/radiance, automatic enemy turns, combat typing and review pause, burning/interpolated HP, all-enemy Chase, mobile, full victory/defeat, restart, no JS errors');
 } finally { await browser.close(); }
})().catch(error=>{console.error(error);process.exitCode=1});
