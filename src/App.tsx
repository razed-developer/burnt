import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { BurnButton } from "./components/BurnButton";
import { CapacityMeter } from "./components/CapacityMeter";
import { DiscStatusBar } from "./components/DiscStatusBar";
import { DiscTitle } from "./components/DiscTitle";
import { Header } from "./components/Header";
import { TrackList } from "./components/TrackList";
import { useTracks } from "./hooks/useTracks";
import { chooseAudioFiles } from "./services/audioFiles";
import { cleanupPreparedTracks, prepareAudioTracks } from "./services/audioPreparation";
import { burnAudioCd, getDiscStatus, type DiscInfo } from "./services/burner";
import { demoTracks, simulatedDisc } from "./services/simulation";

const isTauri = "__TAURI_INTERNALS__" in window;
const checkingDisc: DiscInfo = { state: "checking", label: "Checking optical drive…" };

export default function App() {
  const [title, setTitle] = useState("");
  const [burning, setBurning] = useState(false);
  const [burnMessage, setBurnMessage] = useState<string | null>(null);
  const [discStatus, setDiscStatus] = useState<DiscInfo>(isTauri ? checkingDisc : simulatedDisc);
  const { tracks, totalSeconds, addTracks, removeTrack, moveTrack, reorderTrack } = useTracks(isTauri ? [] : demoTracks());

  async function refreshDiscStatus() {
    if (!isTauri || burning) return;
    try { setDiscStatus(await getDiscStatus()); }
    catch (error) { setDiscStatus({ state: "missing", label: error instanceof Error ? error.message : String(error) }); }
  }

  useEffect(() => {
    if (!isTauri) return;
    void refreshDiscStatus();
    const timer = window.setInterval(() => void refreshDiscStatus(), 3000);
    return () => window.clearInterval(timer);
  }, [burning]);

  async function addMusic() { if (!isTauri) { addTracks(demoTracks().slice(0, 1)); return; } addTracks(await chooseAudioFiles()); }

  async function burnDisc() {
    if (!isTauri) { setBurning(true); setBurnMessage("Browser preview: simulated burn complete."); window.setTimeout(() => setBurning(false), 2200); return; }
    setBurning(true); setDiscStatus({ state: "busy", label: "Burning Audio CD…" }); setBurnMessage("Preparing audio…"); let pcmPaths: string[] = [];
    try {
      const prepared = await prepareAudioTracks(tracks.map((track) => track.path)); pcmPaths = prepared.map((track) => track.pcmPath);
      setBurnMessage(`${prepared.length} ${prepared.length === 1 ? "track" : "tracks"} prepared. Writing Audio CD…`);
      const result = await burnAudioCd(pcmPaths); setDiscStatus({ state: "complete", label: "Audio CD complete" }); setBurnMessage(result.drive ? `${result.message} — ${result.drive}` : result.message);
    } catch (error) { setBurnMessage(error instanceof Error ? error.message : String(error)); }
    finally { if (pcmPaths.length) { try { await cleanupPreparedTracks(pcmPaths); } catch { /* keep primary result visible */ } } setBurning(false); window.setTimeout(() => void refreshDiscStatus(), 500); }
  }

  const overCapacity = totalSeconds > 80 * 60;
  const hasAudioError = tracks.some((track) => track.metadataState === "error");
  const discReady = !isTauri || discStatus.state === "ready";

  return (
    <main className="app-shell">
      <Header />
      <section className="workspace">
        <DiscTitle value={title} onChange={setTitle} />
        <div className="tracks-heading"><div><span className="eyebrow">Tracks</span><strong>{tracks.length} {tracks.length === 1 ? "song" : "songs"}</strong></div><button className="add-button" onClick={addMusic} disabled={burning}><Plus size={18} /> Add music</button></div>
        <TrackList tracks={tracks} onRemove={removeTrack} onMove={moveTrack} onReorder={reorderTrack} />
        <CapacityMeter usedSeconds={totalSeconds} />
        <DiscStatusBar status={discStatus} />
        <BurnButton disabled={!tracks.length || overCapacity || hasAudioError || burning || !discReady} burning={burning} onClick={burnDisc} />
        {burnMessage && <p className="preparation-note">{burnMessage}</p>}
        {!isTauri && <p className="simulation-note">Browser preview uses sample tracks and simulated disc status.</p>}
      </section>
    </main>
  );
}
