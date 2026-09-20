import { useState } from "react";
import { Outlet } from "react-router-dom";
import Aside from "../components/Aside/Aside";
import Header from "../components/Header/Header";

/**
 * Estrutura base das telas internas: menu lateral + cabeçalho + conteúdo.
 * - Desktop (lg+): menu lateral fixo à esquerda.
 * - Mobile/tablet: menu vira uma gaveta aberta pelo botão do Header.
 */
function MainLayout() {
  const [isAsideOpen, setIsAsideOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-page">
      <Aside isOpen={isAsideOpen} onClose={() => setIsAsideOpen(false)} />

      <div className="flex min-w-0 flex-1 flex-col">
        <Header
          isAsideOpen={isAsideOpen}
          onMenuClick={() => setIsAsideOpen(true)}
        />

        <main className="flex-1 p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default MainLayout;
