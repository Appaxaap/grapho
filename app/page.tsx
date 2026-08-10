import App from "@/components/App";
import { NotesProvider } from "@/lib/store";

export default function Home() {
  return (
    <NotesProvider>
      <App />
    </NotesProvider>
  );
}
