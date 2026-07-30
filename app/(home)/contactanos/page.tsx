import { Section } from "@/app/components/layout/shared/Section";
import { ContactForm } from "@/app/components/feature/contact/ContactForm";


const ContactanosPage = () => {
  return (
    <>
      <Section spacing="sm" className="mt-4">
        <div className="mx-auto max-w-2xl">
          <div className="mb-8">
            <h2 className="text-2xl font-bold">¿Tienes preguntas?</h2>
            <p className="mt-2 text-base text-zinc-500">
              Si tienes alguna pregunta, no dudes en contactarnos. Te
              responderemos a la brevedad posible.
            </p>
          </div>
          <ContactForm />
        </div>
      </Section>
    </>
  );
};
export default ContactanosPage; 
