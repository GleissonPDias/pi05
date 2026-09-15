function AsideButtons({ label, icon, isActive = false }) {
  return (
    <button
      className={`
        flex items-center gap-3 w-full py-2.5 px-3 rounded-lg text-sm font-medium

        transition-all duration-200 ease-in-out
        
        /* Estado Fixo Selecionado (Passado via Prop) */
        ${isActive ? "bg-blue-600 text-white font-bold" : "text-slate-300"}
        
        /* Efeito de Passar o Mouse (Hover) */
        hover:bg-slate-700/50 hover:text-white
        
        /* Efeito de Clique Rápido (Active) - Dá um feedback tátil */
        active:scale-98 active:duration-300
        
        /* Acessibilidade de Teclado (Focus) - Cria um contorno suave ao usar Tab */
        focus:outline-none focus:ring-2 focus:ring-blue-500
      `}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

export default AsideButtons;
