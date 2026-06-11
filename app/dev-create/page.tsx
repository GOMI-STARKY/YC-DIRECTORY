import StartupForm from "@/components/StartupForm";

export default function Page() {
  return (
    <main className="p-6">
      <section className="pink_container !min-h-[180px] mb-6">
        <h1 className="heading">Dev: Submit Your Startup</h1>
      </section>

      <StartupForm />
    </main>
  );
}
