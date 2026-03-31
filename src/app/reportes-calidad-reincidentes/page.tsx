import ModulePage from "@frontend/modules/reportes-calidad-reincidentes/page";
import { House } from "lucide-react";
import Link from "next/link";

export default function RoutePage() {
  return (
    <>
      <div className="route-home-anchor">
        <Link href="/" className="route-home-link">
          <House className="route-home-icon" aria-hidden="true" />
          <span>Inicio</span>
        </Link>
      </div>
      <ModulePage />
    </>
  );
}
