import { Disc3 } from "lucide-react";

export function Header() {
  return (
    <header className="app-header">
      <div className="brand-mark" aria-hidden="true"><Disc3 size={25} strokeWidth={1.8} /></div>
      <div>
        <h1>Burnt</h1>
        <p>Make an audio CD.</p>
      </div>
    </header>
  );
}
