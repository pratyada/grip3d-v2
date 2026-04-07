import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Crypto & Blockchain Globe — Live Exchanges, Mining & Regulation — GRIP 3D",
  description:
    "Real-time cryptocurrency exchange map with live BTC/ETH prices, Bitcoin mining concentration by country, regulatory status, and $2T+ market visualization on a 3D globe. Data from CoinGecko.",
  openGraph: {
    title: "Crypto & Blockchain Globe — GRIP 3D",
    description:
      "100+ crypto exchanges, live prices, mining hashrate distribution, and regulatory status — interactive 3D globe powered by CoinGecko.",
    siteName: "GRIP 3D",
    images: [{ url: "/img/tile-29.jpg", width: 1200, height: 630 }],
  },
  twitter: { card: "summary_large_image" },
}

export default function UC29Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
