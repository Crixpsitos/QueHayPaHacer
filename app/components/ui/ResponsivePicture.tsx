import { ImageVariants } from "@/domain/shared/ImageVariants";
import { getImageProps } from "next/image";

type ResponsivePictureProps = ImageVariants & {
  pictureClassName?: string;
  imageClassName?: string;
  loading?: "lazy" | "eager";
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
  aspectRatio, 
}: ResponsivePictureProps) => {
  const desktopImage = getImageProps({
    src: desktop.url,
    width: desktop.width,
    height: desktop.height,
    alt: desktop.alt,
    loading,
  });

  const tabletImage = tablet ? getImageProps({ src: tablet.url, width: tablet.width, height: tablet.height, alt: tablet.alt, loading }) : null;
  const mobileImage = mobile ? getImageProps({ src: mobile.url, width: mobile.width, height: mobile.height, alt: mobile.alt, loading }) : null;

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
      {desktopImage.props.srcSet && (
        <source media="(min-width: 1024px)" srcSet={desktopImage.props.srcSet} />
      )}
      {tabletImage?.props.srcSet && (
        <source media="(min-width: 768px)" srcSet={tabletImage.props.srcSet} />
      )}
      {mobileImage?.props.srcSet && (
        <source media="(max-width: 767px)" srcSet={mobileImage.props.srcSet} />
      )}

      <img
        {...desktopImageProps}
        alt={desktopImageProps.alt ?? ""}
        className={`w-full h-full object-cover object-center ${imageClassName || ""}`}
      />
    </picture>
  );
};