import { ImageVariants } from "@/domain/shared/ImageVariants";
import { getImageProps } from "next/image";

type ResponsivePictureProps = ImageVariants & {
  pictureClassName?: string;
  imageClassName?: string;
  loading?: "lazy" | "eager";
};

export const ResponsivePicture = ({
  desktop,
  mobile,
  tablet,
  pictureClassName,
  imageClassName,
  loading = "lazy",
}: ResponsivePictureProps) => {
  const desktopImage = getImageProps({
    src: desktop.url,
    width: desktop.width,
    height: desktop.height,
    alt: desktop.alt,
    loading,
  });

  const tabletImage = tablet
    ? getImageProps({
        src: tablet.url,
        width: tablet.width,
        height: tablet.height,
        alt: tablet.alt,
        loading,
      })
    : null;

  const mobileImage = mobile
    ? getImageProps({
        src: mobile.url,
        width: mobile.width,
        height: mobile.height,
        alt: mobile.alt,
        loading,
      })
    : null;

  return (
    <picture className={`block w-full h-full overflow-hidden ${pictureClassName || ""}`}>
      {desktopImage.props.srcSet && (
        <source
          media="(min-width: 1024px)"
          srcSet={desktopImage.props.srcSet}
        />
      )}

      {tabletImage?.props.srcSet && (
        <source
          media="(min-width: 768px)"
          srcSet={tabletImage.props.srcSet}
        />
      )}

      {mobileImage?.props.srcSet && (
        <source
          media="(max-width: 767px)"
          srcSet={mobileImage.props.srcSet}
        />
      )}

      <img
        {...desktopImage.props}
        alt={desktopImage.props.alt ?? ""}
        className={`w-full h-full object-cover ${imageClassName || ""}`}
      />
    </picture>
  );
};