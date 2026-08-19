import { MessageSquareHeart } from "lucide-react";
import { Section } from "@/app/components/layout/shared/Section";
import { ContactForm } from "@/app/components/feature/contact/ContactForm";

const ContactanosPage = () => {
  return (
    <Section spacing="md">
      <div className="mx-auto max-w-screen-2xl px-4 sm:px-6 lg:px-12">
        <div className="mx-auto max-w-xl">

          {/* Header */}
          <div className="mb-10 text-center">
            <div className="mb-4 inline-flex size-14 items-center justify-center rounded-2xl bg-[#FDF2F4]">
              <MessageSquareHeart className="size-7 text-[#E63946]" aria-hidden />
            </div>
            <h1
              className="text-3xl font-bold text-[#09090B] sm:text-4xl"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              Contáctanos
            </h1>
            <p className="mt-3 text-base leading-relaxed text-[#71717A]">
              Si tienes alguna pregunta, encontraste un problema o tienes una
              sugerencia, cuéntanos y te ayudaremos.
            </p>
          </div>

          {/* Form */}
          <ContactForm />
        </div>
      </div>
    </Section>
  );
};

export default ContactanosPage;

