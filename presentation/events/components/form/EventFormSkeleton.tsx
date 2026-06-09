export const EventFormSkeleton = () => {
  return (
    <div className="w-full max-w-5xl mx-auto p-6 space-y-8 animate-pulse">
      {/* Cabecera del Formulario */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-neutral-200 pb-6">
        <div className="space-y-2">
          <div className="h-8 w-64 bg-neutral-200 rounded-lg dark:bg-neutral-800" />
          <div className="h-4 w-40 bg-neutral-200 rounded-md dark:bg-neutral-800" />
        </div>
        <div className="flex gap-3">
          <div className="h-10 w-24 bg-neutral-200 rounded-lg dark:bg-neutral-800" />
          <div className="h-10 w-32 bg-neutral-200 rounded-lg dark:bg-neutral-800" />
        </div>
      </div>

      {/* Grid Principal (Dos columnas tipo Dashboard) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Columna Izquierda: Detalles del Evento (2/3) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Input de Título */}
          <div className="space-y-2">
            <div className="h-4 w-20 bg-neutral-200 rounded dark:bg-neutral-800" />
            <div className="h-11 w-full bg-neutral-200 rounded-lg dark:bg-neutral-800" />
          </div>

          {/* Input de Descripción Corta */}
          <div className="space-y-2">
            <div className="h-4 w-32 bg-neutral-200 rounded dark:bg-neutral-800" />
            <div className="h-11 w-full bg-neutral-200 rounded-lg dark:bg-neutral-800" />
          </div>

          {/* El bloque del Rich Text Editor (Tiptap) */}
          <div className="space-y-2">
            <div className="h-4 w-24 bg-neutral-200 rounded dark:bg-neutral-800" />
            <div className="border border-neutral-200 rounded-xl overflow-hidden dark:border-neutral-800">
              {/* Barra de herramientas del editor */}
              <div className="h-10 w-full bg-neutral-100 border-b border-neutral-200 flex items-center px-4 gap-2 dark:bg-neutral-900 dark:border-neutral-800">
                <div className="h-5 w-5 bg-neutral-200 rounded dark:bg-neutral-800" />
                <div className="h-5 w-5 bg-neutral-200 rounded dark:bg-neutral-800" />
                <div className="h-5 w-5 bg-neutral-200 rounded dark:bg-neutral-800" />
                <div className="h-5 w-24 bg-neutral-200 rounded ml-4 dark:bg-neutral-800" />
              </div>
              {/* Área del contenido */}
              <div className="p-4 space-y-3 bg-neutral-50/50 dark:bg-neutral-900/30">
                <div className="h-4 w-3/4 bg-neutral-200 rounded dark:bg-neutral-800" />
                <div className="h-4 w-full bg-neutral-200 rounded dark:bg-neutral-800" />
                <div className="h-4 w-5/6 bg-neutral-200 rounded dark:bg-neutral-800" />
              </div>
            </div>
          </div>
        </div>

        {/* Columna Derecha: Configuración / Media (1/3) */}
        <div className="space-y-6">
          {/* Zona del Main Image (Dropzone) */}
          <div className="space-y-2">
            <div className="h-4 w-28 bg-neutral-200 rounded dark:bg-neutral-800" />
            <div className="h-48 w-full bg-neutral-200 rounded-xl border-2 border-dashed border-neutral-200 dark:bg-neutral-800 dark:border-neutral-700 flex items-center justify-center" />
          </div>

          {/* Bloque de Categoría / Tags */}
          <div className="p-4 border border-neutral-200 rounded-xl space-y-4 dark:border-neutral-800">
            <div className="space-y-2">
              <div className="h-4 w-24 bg-neutral-200 rounded dark:bg-neutral-800" />
              <div className="h-10 w-full bg-neutral-200 rounded-lg dark:bg-neutral-800" />
            </div>
            <div className="flex gap-2">
              <div className="h-6 w-16 bg-neutral-200 rounded-full dark:bg-neutral-800" />
              <div className="h-6 w-20 bg-neutral-200 rounded-full dark:bg-neutral-800" />
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}