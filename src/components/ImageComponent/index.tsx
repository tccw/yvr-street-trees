import { ImageSection } from "./styles";
import { memo } from "react";

interface ImageComponentProps {
  images: JSX.Element[];
}

const ImageComponent: React.FC<ImageComponentProps> = (props) => {
  return <ImageSection>{props.images}</ImageSection>;
};

export default memo(ImageComponent);
