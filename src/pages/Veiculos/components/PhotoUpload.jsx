import { useRef, useState } from "react";
import { CameraIcon, ImagePlusIcon, Trash2Icon, UploadCloudIcon } from "lucide-react";
import Button from "../../../components/ui/Button";
import { cn } from "../../../utils/cn";
import { PHOTO_MAX_BYTES, PHOTO_TYPES } from "../constants";

/**
 * Envio da foto do veículo: arrastar e soltar, escolher arquivo ou usar a câmera
 * (no celular). Valida o tipo (JPG, PNG, WEBP) e o tamanho (até 10 MB).
 *
 * Props:
 * - url: endereço da foto atual (ou null)
 * - onSelect(file): chamado com um arquivo válido
 * - onRemove(): remove a foto
 */
function PhotoUpload({ url, onSelect, onRemove }) {
  const fileInput = useRef(null);
  const cameraInput = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState("");

  const handleFile = (file) => {
    if (!file) return;
    if (!PHOTO_TYPES.includes(file.type)) {
      setError("Formato não aceito. Envie uma imagem JPG, PNG ou WEBP.");
      return;
    }
    if (file.size > PHOTO_MAX_BYTES) {
      setError("A imagem ultrapassa 10 MB. Escolha um arquivo menor.");
      return;
    }
    setError("");
    onSelect(file);
  };

  const handleInputChange = (event) => {
    handleFile(event.target.files?.[0]);
    event.target.value = ""; // permite escolher o mesmo arquivo de novo
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setDragging(false);
    handleFile(event.dataTransfer.files?.[0]);
  };

  const inputs = (
    <>
      <input
        ref={fileInput}
        type="file"
        accept={PHOTO_TYPES.join(",")}
        onChange={handleInputChange}
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
      />
      <input
        ref={cameraInput}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleInputChange}
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
      />
    </>
  );

  return (
    <div>
      {inputs}

      {url ? (
        <div className="overflow-hidden rounded-xl border border-slate-200">
          <img
            src={url}
            alt="Pré-visualização da foto do veículo"
            className="aspect-video w-full object-cover"
          />
          <div className="flex flex-wrap gap-2 bg-slate-50 p-3">
            <Button
              size="sm"
              variant="outline"
              icon={ImagePlusIcon}
              onClick={() => fileInput.current.click()}
            >
              Trocar foto
            </Button>
            <Button size="sm" variant="outline" icon={Trash2Icon} onClick={onRemove}>
              Remover
            </Button>
          </div>
        </div>
      ) : (
        <div
          onDragOver={(event) => {
            event.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          className={cn(
            "flex flex-col items-center gap-3 rounded-xl border-2 border-dashed px-4 py-6 text-center transition-colors",
            dragging ? "border-blue-500 bg-blue-100" : "border-blue-200 bg-blue-50",
          )}
        >
          <span className="grid size-11 place-items-center rounded-full bg-blue-100 text-blue-600">
            <UploadCloudIcon className="size-5" />
          </span>
          <div>
            <p className="text-sm font-semibold text-slate-800">
              Arraste a foto aqui ou escolha um arquivo
            </p>
            <p className="mt-0.5 text-xs text-slate-500">JPG, PNG ou WEBP, até 10 MB</p>
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            <Button
              size="sm"
              variant="outline"
              icon={ImagePlusIcon}
              onClick={() => fileInput.current.click()}
            >
              Escolher arquivo
            </Button>
            <Button
              size="sm"
              variant="outline"
              icon={CameraIcon}
              onClick={() => cameraInput.current.click()}
            >
              Usar câmera
            </Button>
          </div>
        </div>
      )}

      {error && (
        <p role="alert" className="mt-2 text-xs font-medium text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}

export default PhotoUpload;
