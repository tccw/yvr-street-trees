import { Feature, Point } from "@turf/turf";
import styled from "styled-components";
import { CLOUD_NAME } from '../../../env';
import { ImageGrid } from "./styles";
import { Image, Transformation } from "cloudinary-react";

interface UserImageGridProperties {
  photoFeatures: Feature[];
  onClickDo: any;
}

const ImageContainer = styled.section`
  position: relative;
  width: inheret;
  display: flex;
  flex-direction: column;
`;
// margin: 1%;


// https://docs.mapbox.com/help/tutorials/building-a-store-locator/#define-interactivity-functions
// fly to item based on ID (appears to require iteration)
// https://medium.com/@krewllobster/extract-visible-features-from-deck-gl-or-react-map-gl-and-store-in-redux-62a65a658b56
// https://docs.mapbox.com/mapbox-gl-js/api/map/#map#queryrenderedfeatures
const UserImageGrid = ({
  photoFeatures,
  onClickDo: changeSelectedMarkerHandler,
}: UserImageGridProperties) => {
  const handleClick = (event: Event) => {
    // onClickDo(arr.indexOf(parseInt(feature.properties.id))
    // indexOf(parseInt(feature.properties.id)
    if (event.target) {
      //@ts-ignore
      changeSelectedMarkerHandler(parseInt(event.target.id));
    }
  };

  return (
    <ImageGrid className="img-grid">
      {photoFeatures &&
        photoFeatures.map((feature, index) => (
            <ImageContainer key={`${index}`}>
                <Image
                    cloudName={CLOUD_NAME}
                    publicId={feature.properties.public_id}
                    onMouseEnter={() => changeSelectedMarkerHandler(index)}
                    onClick={() => changeSelectedMarkerHandler(index)}
                    style={{
                        minWidth: '100%',
                        minHeight: '100%',
                        maxWidth: '150%',
                        position: 'relative',
                    }}
                >
                    <Transformation
                        height="150"
                        width="150"
                        gracity="auto"
                        crop="fill"
                        fetchFormat="auto"
                        quality="auto"
                        />

                </Image>
            </ImageContainer>
        ))}
    </ImageGrid>
  );
};

function makePublicIdFromFeature(feature: Feature<Point>) {
  return `yvr-user-photos/${feature.geometry.coordinates[1]}${feature.geometry.coordinates[0]}`;
}

function formatDaysAgoLabel(feature: Feature<Point>): string {
    console.log("Not implmented")
    return feature.properties.created_at_utc
}

export default UserImageGrid;

/**
To get scrolling to work, check if the webpage is narrow, then use a scroll or wheel listener as a hook
https://stackoverflow.com/questions/29725828/update-style-of-a-component-onscroll-in-react-js

and check how far down the scroll page we are
*/
