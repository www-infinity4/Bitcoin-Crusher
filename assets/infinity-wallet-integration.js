/* Bitcoin Crusher → Unified Infinity Wallet adapter */
(function () {
  'use strict';
  const button = document.getElementById('infinityWalletBtn');
  const status = document.getElementById('infinityWalletStatus');
  if (!button || !window.InfinityUnifiedWallet) return;
  const wallet = new window.InfinityUnifiedWallet.UnifiedInfinityWallet();
  function current() { return wallet.state.currentWalletId && wallet.state.wallets[wallet.state.currentWalletId]; }
  function show(message) { if (status) status.textContent = message; }
  function render() {
    const connected = current();
    button.textContent = connected ? 'Wallet · ' + connected.walletId.slice(-8) : 'Connect Infinity Wallet';
    show(connected ? 'Unified wallet connected. Crusher coins: ' + Number(connected.balances.BITCOIN_CRUSHER_COIN || 0) : 'Connect before spinning to route eligible Crusher coins into the unified wallet.');
  }
  button.addEventListener('click', function () {
    if (!current()) wallet.createWallet({ displayName: 'Unified Infinity Wallet' });
    else location.href = 'https://www-infinity4.github.io/Mint-For-Infinity/unified-wallet.html';
    render();
  });
  window.addEventListener('bitcoincrusher:research-token', async function (event) {
    const connected = current();
    if (!connected) return show('Research token created locally. Connect the Infinity Wallet before a future spin to route its coin.');
    const detail = event.detail || {};
    const sourceEventId = String(detail.tokenId || detail.hash || 'spin:' + detail.spinNumber);
    const day = String(detail.timestamp || new Date().toISOString()).slice(0, 10);
    const used = wallet.state.events.filter(item => item.type === 'SOURCE_COIN_CREDITED' && item.payload.sourceSystem === 'BITCOIN_CRUSHER' && item.payload.walletId === connected.walletId && item.timestamp.slice(0, 10) === day).reduce((sum, item) => sum + item.payload.amount, 0);
    if (used >= 10) return show('Daily Bitcoin Crusher wallet allocation reached: 10 coins. The research token remains preserved.');
    try {
      await wallet.creditSourceCoin({ eventId: 'bitcoin-crusher:' + sourceEventId, walletId: connected.walletId,
        assetCode: 'BITCOIN_CRUSHER_COIN', amount: 1, sourceSystem: 'BITCOIN_CRUSHER', sourceEventId,
        proof: { researchHash: detail.hash || null, spinNumber: detail.spinNumber || null }, timestamp: detail.timestamp || new Date().toISOString() });
      render(); show('Bitcoin Crusher coin added to the unified wallet with its research-token provenance.');
    } catch (error) { show('Wallet did not duplicate this token: ' + error.message); }
  });
  render();
})();
