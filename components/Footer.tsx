export default function Footer() {
  return (
    <footer className="ftr">
      <div className="ftr-inner">
        <span className="ftr-logo">⬡ NovaDEX</span>
        <div className="ftr-sep" />
        <span className="ftr-note">AMM · Uniswap v1-style · ETH → ERC-20</span>
        <div className="ftr-sep" />
        <span className="ftr-copy">© 2026 NovaDEX. Use at your own risk.</span>  {/* ← inline now */}
        <div className="ftr-links">
          <a href="#">GitHub</a>
          <a href="#">Docs</a>
          <a href="#">Audit</a>
        </div>
      </div>
    </footer>
  )
}
