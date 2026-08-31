'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

function setup() {
  const listeners = {};
  const elements = {
    infinityWalletBtn: { textContent: '', addEventListener(type, fn) { this[type] = fn; } },
    infinityWalletStatus: { textContent: '' }
  };

  class Wallet {
    load() { return this.state; }
    constructor() {
      this.state = { currentWalletId: null, wallets: {}, events: [], tokens: {} };
    }
    createWallet() {
      const walletId = 'infinity-wallet:test';
      this.state.currentWalletId = walletId;
      this.state.wallets[walletId] = {
        walletId,
        balances: {},
        tokenIds: [],
        sourceSystems: []
      };
      return this.state.wallets[walletId];
    }
    async creditSourceCoin(input) {
      if (this.state.events.some(event => event.eventId === input.eventId)) {
        throw new Error('Duplicate wallet event.');
      }
      this.state.events.push({
        eventId: input.eventId,
        type: 'SOURCE_COIN_CREDITED',
        timestamp: input.timestamp,
        payload: {
          walletId: input.walletId,
          amount: input.amount,
          sourceSystem: input.sourceSystem
        }
      });
      const connected = this.state.wallets[input.walletId];
      connected.balances[input.assetCode] = Number(connected.balances[input.assetCode] || 0) + input.amount;
    }
    async importCollectible(input) {
      this.state.tokens[input.tokenId] = { ...input, state: 'COLLECTIBLE' };
      this.state.wallets[input.ownerWalletId].tokenIds.push(input.tokenId);
      this.state.events.push({
        eventId: input.eventId,
        type: 'COLLECTIBLE_IMPORTED',
        timestamp: input.timestamp,
        payload: input
      });
    }
  }

  class Bus {
    constructor() { this.events = []; }
    async append(input) {
      const found = this.events.find(event => event.eventId === input.eventId);
      if (found) return found;
      const event = { ...input, hash: 'hash-' + (this.events.length + 1) };
      this.events.push(event);
      return event;
    }
  }

  class Language {
    constructor() { this.learned = []; }
    learnFromEvent(event) { this.learned.push(event.eventId); }
  }

  const context = {
    console,
    Date,
    Promise,
    location: { href: '' },
    window: {
      InfinityUnifiedWallet: { UnifiedInfinityWallet: Wallet },
      InfinityAIKernel: { InfinitySiteBus: Bus, InfinityLanguageEngine: Language },
      addEventListener(type, fn) { listeners[type] = fn; }
    },
    document: {
      getElementById(id) { return elements[id] || null; }
    }
  };
  vm.runInNewContext(
    fs.readFileSync(require.resolve('../assets/infinity-wallet-integration.js'), 'utf8'),
    context
  );
  return { bridge: context.window.BitcoinCrusherInfinityBridge, elements, listeners };
}

function tokenDetail(index) {
  return {
    tokenId: 'research-' + index,
    hash: 'digest-' + index,
    spinNumber: index,
    timestamp: '2026-08-14T12:' + String(index).padStart(2, '0') + ':00.000Z',
    title: 'Research ' + index,
    userInput: 'subject ' + index,
    evidenceStatus: 'VERIFIED',
    sources: [{ id: 'source-' + index }],
    article: { title: 'Research ' + index, body: 'complete packet' }
  };
}

test('qualifying research spin creates wallet, coin, collectible, and site-bus event', async () => {
  const { bridge } = setup();
  const result = await bridge.handleResearchToken({ detail: tokenDetail(1) });

  assert.equal(result.walletId, 'infinity-wallet:test');
  assert.equal(result.credited, true);
  assert.equal(result.collectibleImported, true);
  assert.equal(bridge.wallet.state.wallets[result.walletId].balances.BITCOIN_CRUSHER_COIN, 1);
  assert.equal(bridge.wallet.state.wallets[result.walletId].tokenIds.length, 1);
  assert.equal(bridge.bus.events[0].type, 'RESEARCH_TOKEN_CREATED');
  assert.equal(bridge.bus.events[0].payload.creditedCoin, true);
  assert.deepEqual(
    bridge.wallet.state.tokens[result.tokenId].attachments[0].content,
    tokenDetail(1).article
  );
});

test('daily allocation stops at 10 coins while every research token remains preserved', async () => {
  const { bridge, elements } = setup();
  for (let index = 1; index <= 11; index += 1) {
    await bridge.handleResearchToken({ detail: tokenDetail(index) });
  }

  const connected = bridge.wallet.state.wallets['infinity-wallet:test'];
  assert.equal(connected.balances.BITCOIN_CRUSHER_COIN, 10);
  assert.equal(connected.tokenIds.length, 11);
  assert.equal(bridge.bus.events.length, 11);
  assert.match(elements.infinityWalletStatus.textContent, /Daily Crusher coin limit reached/);
});

test('replaying one research token cannot duplicate its coin or collectible', async () => {
  const { bridge } = setup();
  const first = tokenDetail(1);
  await bridge.handleResearchToken({ detail: first });
  const replay = await bridge.handleResearchToken({ detail: first });

  const connected = bridge.wallet.state.wallets['infinity-wallet:test'];
  assert.equal(connected.balances.BITCOIN_CRUSHER_COIN, 1);
  assert.equal(connected.tokenIds.length, 1);
  assert.equal(replay.credited, false);
  assert.equal(replay.collectibleImported, false);
});
