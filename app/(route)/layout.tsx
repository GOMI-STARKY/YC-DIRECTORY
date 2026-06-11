import Navbar from "@/components/Navbar";
import Providers from "./providers";

export default function Layout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <Providers>
      <main className="font-work-sans">
        <Navbar />

        {children}
      </main>
    </Providers>
  );
}