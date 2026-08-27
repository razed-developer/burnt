import "./DriveSelector.css";
import type { DiscDrive, DriveSelection } from "../../types";

interface DriveSelectorProps {
  drives: DiscDrive[];
  selection: DriveSelection;
  onChange: (selection: DriveSelection) => void;
  showAutomatic?: boolean;
  id?: string;
}

/**
 * A simple drive selector. When `automatic` is chosen the backend picks the
 * single appropriate writer automatically.
 */
export default function DriveSelector({ drives, selection, onChange, showAutomatic = true, id }: DriveSelectorProps) {
  const automatic = selection === "automatic";

  if (drives.length === 0) {
    return (
      <div className="drive-select">
        <p className="drive-select-none">No CD burner detected.</p>
      </div>
    );
  }

  return (
    <div className="drive-select">
      {showAutomatic && (
        <label className="drive-row">
          <input
            type="radio"
            name={id || "drive"}
            checked={automatic}
            onChange={() => onChange("automatic")}
          />
          <span>Automatic</span>
        </label>
      )}
      {drives.map((drive) => {
        const selected = selection !== "automatic" && selection.id === drive.id;
        return (
          <label key={drive.id} className="drive-row">
            <input
              type="radio"
              name={id || "drive"}
              checked={selected}
              onChange={() => onChange({ id: drive.id })}
              disabled={!drive.canWriteCd}
            />
            <span className={drive.canWriteCd ? undefined : "drive-disabled"}>
              {drive.displayName}
              {!drive.canWriteCd ? " (cannot write CDs)" : ""}
            </span>
          </label>
        );
      })}
    </div>
  );
}
