import { ConstructionIcon } from "lucide-react";

function PlaceholderPage({
  title,
  description = "Esta tela ainda será desenvolvida.",
}) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-center">
      <div className="grid size-14 place-items-center rounded-2xl bg-blue-100 text-blue-600">
        <ConstructionIcon className="size-7" />
      </div>
      <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
      <p className="text-sm text-slate-500">{description}</p>
    </div>
  );
}

export default PlaceholderPage;
