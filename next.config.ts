import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Oculta el indicador de desarrollo de Next.js (la insignia de la esquina).
  devIndicators: false,
  experimental: {
    // Permite subir fotos de perfil del vendedor (Server Action) hasta 6 MB.
    serverActions: { bodySizeLimit: "6mb" },
  },
};

export default nextConfig;
