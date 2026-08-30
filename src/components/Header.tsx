import toastLogo from "../assets/burnt-toast.png";

export function Header() {
  return (
    <header className="app-header">
      <div className="brand-mark">
        <img className="toast-logo" src={toastLogo} alt="" aria-hidden="true" />
      </div>
      <div>
        <h1>Burnt</h1>
        <p>Make an audio CD.</p>
      </div>
    </header>
  );
}
