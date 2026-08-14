/* Bitcoin Crusher → Unified Infinity Wallet + Infinity Site Bus adapter */
(function () {
  'use strict';

  const button = document.getElementById('infinityWalletBtn');
  const status = document.getElementById('infinityWalletStatus');
  if (!button || !window.InfinityUnifiedWallet) return;

  const wallet = new window.InfinityUnifiedWallet.UnifiedInfinityWallet();
  const bus = window.InfinityAIKernel ? new window.InfinityAIKernel.InfinitySiteBus() : null;
  const language = window.InfinityAIKernel ? new window.InfinityAIKernel.InfinityLanguageEngine() : null;

  function current() {
    return wallet.state.currentWalletId && wallet.state.wallets[wallet.state.currentWalletId];
  }

  function ensureWallet() {
    return current() || wallet.createWallet({ displayName: 'Unified Infinity Wallet' });
  }

  function show(message) {
    if (status) status.textContent = message;
  }

  function localDay(value) {
    const date = new Date(value || Date.now());
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return year + '-' + month + '-' + day;
  }

  function crusherCoinsToday(walletId, timestamp) {
    const day = localDay(timestamp);
    return wallet.state.events
      .filter(item => item.type === 'SOURCE_COIN_CREDITED' &&
        item.payload.sourceSystem === 'BITCOIN_CRUSHER' &&
        item.payload.walletId === walletId &&
        localDay(item.timestamp) === day)
      .reduce((sum, item) => sum + Number(item.payload.amount || 0), 0);
  }

  function render() {
    const connected = current();
    button.textContent = connected ? 'Wallet · ' + connected.walletId.slice(-8) : 'Create Infinity Wallet';
    show(connected
      ? 'Unified wallet connected · Crusher coins: ' + Number(connected.balances.BITCOIN_CRUSHER_COIN || 0) + ' · up to 10 qualifying spins per local day.'
      : 'Your first qualifying spin creates the unified wallet automatically.');
  }

  button.addEventListener('click', function () {
    if (!current()) {
      const connected = ensureWallet();
      render();
      show('Unified wallet created: ' + connected.walletId);
      return;
    }
    location.href = 'https://www-infinity4.github.io/Mint-For-Infinity/unified-wallet.html';
  });

  async function publish(detail, connected, credited, collectibleImported) {
    if (!bus) return null;
    const sourceEventId = String(detail.tokenId || detail.hash || 'spin:' + detail.spinNumber);
    const event = await bus.append({
      eventId: 'bitcoin-crusher:research:' + sourceEventId,
      type: 'RESEARCH_TOKEN_CREATED',
      sourceSite: 'BITCOIN_CRUSHER',
      actorWalletId: connected.walletId,
      timestamp: detail.timestamp || new Date().toISOString(),
      payload: {
        tokenId: detail.tokenId || null,
        researchHash: detail.hash || null,
        spinNumber: detail.spinNumber || null,
        title: detail.title || 'Bitcoin Crusher Research Token',
        userInput: detail.userInput || null,
        evidenceStatus: detail.evidenceStatus || null,
        sourceCount: Array.isArray(detail.sources) ? detail.sources.length : 0,
        creditedCoin: credited,
        collectibleImported
      }
    });
    if (language) language.learnFromEvent(event);
    return event;
  }

  async function handleResearchToken(event) {
    const detail = event && event.detail ? event.detail : {};
    const connected = ensureWallet();
    const sourceEventId = String(detail.tokenId || detail.hash || 'spin:' + detail.spinNumber);
    const timestamp = detail.timestamp || new Date().toISOString();
    const tokenId = 'bitcoin-crusher:research:' + sourceEventId;
    let credited = false;
    let collectibleImported = false;

    const used = crusherCoinsToday(connected.walletId, timestamp);
    if (used < 10) {
      try {
        await wallet.creditSourceCoin({
          eventId: 'bitcoin-crusher:coin:' + sourceEventId,
          walletId: connected.walletId,
          assetCode: 'BITCOIN_CRUSHER_COIN',
          amount: 1,
          sourceSystem: 'BITCOIN_CRUSHER',
          sourceEventId,
          proof: {
            researchHash: detail.hash || null,
            spinNumber: detail.spinNumber || null,
            tokenId: detail.tokenId || null
          },
          timestamp
        });
        credited = true;
      } catch (error) {
        if (!/Duplicate wallet event/.test(error.message)) throw error;
      }
    }

    if (!wallet.state.tokens[tokenId]) {
      await wallet.importCollectible({
        eventId: 'bitcoin-crusher:collectible:' + sourceEventId,
        tokenId,
        ownerWalletId: connected.walletId,
        kind: 'BITCOIN_CRUSHER_RESEARCH_TOKEN',
        sourceSystem: 'BITCOIN_CRUSHER',
        sourceEventId,
        title: detail.title || 'Bitcoin Crusher Research Token',
        contentDigest: detail.hash || sourceEventId,
        verificationState: detail.evidenceStatus || 'RESEARCH_PACKET',
        timestamp,
        attachments: detail.article ? [{
          type: 'application/json',
          name: 'research-token.json',
          content: detail.article
        }] : []
      });
      collectibleImported = true;
    }

    await publish(detail, connected, credited, collectibleImported);
    render();
    if (credited) {
      show('Research token and 1 Bitcoin Crusher coin added to unified wallet ' + connected.walletId + '.');
    } else if (used >= 10) {
      show('Daily Crusher coin limit reached (10). The complete research token was still preserved in the unified wallet.');
    } else {
      show('This research token was already recorded; no duplicate coin was created.');
    }
    return { walletId: connected.walletId, credited, collectibleImported, tokenId };
  }

  window.addEventListener('bitcoincrusher:research-token', function (event) {
    handleResearchToken(event).catch(error => show('Infinity wallet routing error: ' + error.message));
  });

  window.BitcoinCrusherInfinityBridge = {
    wallet,
    bus,
    language,
    ensureWallet,
    crusherCoinsToday,
    handleResearchToken
  };

  render();
})();