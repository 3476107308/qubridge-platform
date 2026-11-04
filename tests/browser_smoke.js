const assert = require('node:assert/strict');
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath: process.env.CHROME_PATH,
    args: ['--no-sandbox'],
  });
  try {
    const page = await browser.newPage();
    const root = process.env.TEST_BASE_URL || 'http://127.0.0.1:5057';
    await page.goto(`${root}/login`);
    await page.locator('[name=username]').fill('admin');
    await page.locator('[name=password]').fill('admin123');
    await page.locator('button[type=submit]').click();
    await page.waitForURL(`${root}/`);
    const indexIconSize = await page.locator('.sidebar-user i').evaluate(el => getComputedStyle(el).fontSize);

    await page.goto(`${root}/demos`);
    const demoIconSize = await page.locator('.sidebar-user i').evaluate(el => getComputedStyle(el).fontSize);
    assert.equal(demoIconSize, indexIconSize);
    assert.equal(demoIconSize, '18px');

    const pageErrors = [];
    page.on('pageerror', error => pageErrors.push(error.message));
    await page.goto(`${root}/results`);
    assert.ok(!pageErrors.some(message => message.includes("addEventListener")));
    await page.locator('.sidebar-menu a[href="/simulator"]').click();
    await page.waitForURL(`${root}/simulator`);

    await page.goto(`${root}/qubit-routing`);
    const header = page.locator('.content-header');
    assert.equal(await header.locator('a').first().getAttribute('href'), '/');
    assert.equal(await header.locator('a').last().getAttribute('href'), '/logout');
    const qasm = 'OPENQASM 2.0; include "qelib1.inc"; qreg q[2]; h q[0]; cx q[0],q[1];';
    await page.locator('#qsamFileInput').setInputFiles({ name: 'sample.qasm', mimeType: 'text/plain', buffer: Buffer.from(qasm) });
    await page.locator('#qsamParseStatus').getByText('已解析', { exact: false }).waitFor();
    assert.match(await page.locator('#task-queue').innerText(), /sample\.qasm/);
    assert.match(await page.locator('#task-queue').innerText(), /门:2/);

    await page.locator('#fidelity-threshold').fill('1');
    await page.locator('#executeRoutingBtn').click();
    assert.match(await page.locator('#task-queue').innerText(), /低于阈值/);
    assert.equal(await page.locator('#allocated-physical').innerText(), '0');

    await page.locator('#fidelity-threshold').fill('0');
    await page.locator('#executeRoutingBtn').click();
    assert.match(await page.locator('#task-queue').innerText(), /已按拓扑路径分配/);
    assert.equal(await page.locator('#allocated-physical').innerText(), '2');
    assert.ok(await page.locator('#routing-path path').count() > 0);

    await page.locator('#ibm27Selector').click();
    assert.equal(await page.locator('#allocated-physical').innerText(), '0');

    await header.locator('a').first().click();
    await page.waitForURL(`${root}/`);
    await page.goto(`${root}/qubit-routing`);
    await page.locator('.content-header a[href="/logout"]').click();
    await page.waitForURL(`${root}/login`);
    console.log('Browser smoke checks passed');
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
