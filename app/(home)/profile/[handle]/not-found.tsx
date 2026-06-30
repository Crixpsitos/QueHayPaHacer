import Link from "next/link";
import { UserX } from "lucide-react";
import { Container } from "@/app/components/layout/shared/Container";
import { Button } from "@/app/components/ui/button";

export default function ProfileNotFound() {
  return (
    <Container className="flex flex-1 flex-col items-center gap-4 p-4 pt-16 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-foreground/80">
        <UserX className="h-9 w-9 text-foreground/80" strokeWidth={1.75} />
      </div>
      <div className="space-y-1">
        <p className="text-lg font-semibold text-foreground">No encontramos este perfil</p>
        <p className="text-sm text-muted-foreground">
          El usuario que buscas no existe o cambió de nombre de usuario.
        </p>
      </div>
      <Button asChild className="mt-2">
        <Link href="/">Volver al inicio</Link>
      </Button>
    </Container>
  );
}
