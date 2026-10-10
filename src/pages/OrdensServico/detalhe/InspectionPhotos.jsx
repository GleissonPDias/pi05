import { useRef } from "react";
import { ImagePlusIcon, XIcon } from "lucide-react";
import { createId } from "../ordemUtils";
import { PHOTO_MAX_BYTES, PHOTO_TYPES } from "../../Veiculos/constants";

const MAX_PHOTOS = 8;

/**
 * Fotos da vistoria (até 8). Hoje ficam como endereços temporários do navegador.
 * TODO: na API, enviar os arquivos (multipart) e guardar as URLs devolvidas.
 */
function InspectionPhotos({ photos, onChange, onError, disabled }) {
  const input = useRef(null);

  const handleFiles = (files) => {
    const valid = [...files].filter((file) => PHOTO_TYPES.includes(file.type) && file.size <= PHOTO_MAX_BYTES);
    if (valid.length < files.length) onError("Algumas fotos foram ignoradas (use JPG, PNG ou WEBP de até 10 MB).");
    const room = MAX_PHOTOS - photos.length;
    const added = valid.slice(0, room).map((file) => ({ id: createId("F"), url: URL.createObjectURL(file), name: file.name }));
    if (valid.length > room) onError(`Limite de ${MAX_PHOTOS} fotos por vistoria.`);
    if (added.length) onChange([...photos, ...added]);
  };

  return (
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6">
      {photos.map((photo) => (
        <figure key={photo.id} className="group relative aspect-square overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
          <img src={photo.url} alt={`Foto da vistoria: ${photo.name}`} className="size-full object-cover" />
          {!disabled && (
            <button
              type="button"
              onClick={() => onChange(photos.filter((item) => item.id !== photo.id))}
              aria-label={`Remover foto ${photo.name}`}
              className="absolute right-1 top-1 grid size-6 place-items-center rounded-full bg-slate-900/70 text-white hover:bg-red-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <XIcon className="size-3.5" />
            </button>
          )}
        </figure>
      ))}
      {!disabled && photos.length < MAX_PHOTOS && (
        <button
          type="button"
          onClick={() => input.current.click()}
          className="flex aspect-square flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-blue-200 bg-blue-50 text-xs font-semibold text-blue-700 hover:bg-blue-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          <ImagePlusIcon className="size-5" />
          Adicionar
        </button>
      )}
      <input
        ref={input}
        type="file"
        multiple
        accept="image/*"
        capture="environment"
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
        onChange={(event) => {
          handleFiles(event.target.files ?? []);
          event.target.value = "";
        }}
      />
    </div>
  );
}

export default InspectionPhotos;
