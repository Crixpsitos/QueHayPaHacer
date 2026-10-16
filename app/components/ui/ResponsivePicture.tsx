import { ImageVariants } from "@/domain/shared/ImageVariants";
import { getImageProps } from "next/image";

type ResponsivePictureProps = ImageVariants & {
  pictureClassName?: string;
  imageClassName?: string;
  loading?: "lazy" | "eager";
  /** Imagen LCP: carga ansiosa y fetchPriority alta. */
  priority?: boolean;
  /** `sizes` de cada variante; por defecto el ancho completo de la pantalla. */
  sizes?: string;
  // 🚀 NUEVO: Permite definir una relación de aspecto fija (ej: "16/9", "1/1") o pasar "auto"
  aspectRatio?: string; 
};

export const ResponsivePicture = ({
  desktop,
  mobile,
  tablet,
  pictureClassName,
  imageClassName,
  loading = "lazy",
  priority = false,
  sizes = "100vw",
  aspectRatio, 
}: ResponsivePictureProps) => {
  const desktopImage = getImageProps({
    src: desktop.url,
    width: desktop.width,
    height: desktop.height,
    alt: desktop.alt,
    loading: priority ? "eager" : loading,
    fetchPriority: priority ? "high" : undefined,
    sizes,
  });

  const tabletImage = tablet ? getImageProps({ src: tablet.url, width: tablet.width, height: tablet.height, alt: tablet.alt, loading, sizes }) : null;
  const mobileImage = mobile ? getImageProps({ src: mobile.url, width: mobile.width, height: mobile.height, alt: mobile.alt, loading, sizes }) : null;

  const {
    width: intrinsicWidth,
    height: intrinsicHeight,
    ...desktopImageProps
  } = desktopImage.props;

  const finalAspectRatio = aspectRatio ? aspectRatio : `${intrinsicWidth} / ${intrinsicHeight}`;

  return (
    <picture
      className={`block w-full overflow-hidden ${pictureClassName || ""}`}
      style={finalAspectRatio !== "auto" ? { aspectRatio: finalAspectRatio } : undefined}
    >
      {/* Sin optimizador (srcSet vacío) se usa la URL de cada variante: el celular no baja la de escritorio. */}
      <source media="(min-width: 1024px)" srcSet={desktopImage.props.srcSet ?? desktop.url} />
      {tablet && <source media="(min-width: 768px)" srcSet={tabletImage?.props.srcSet ?? tablet.url} />}
      {mobile && <source media="(max-width: 767px)" srcSet={mobileImage?.props.srcSet ?? mobile.url} />}

      <img
        {...desktopImageProps}
        alt={desktopImageProps.alt ?? ""}
        className={`w-full h-full object-cover object-center ${imageClassName || ""}`}
      />
    </picture>
  );
};