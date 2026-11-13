import { Feature, Geometry, GeometryCollection, Point, Properties } from "@turf/turf";
import styled from "styled-components";
import { CLOUD_NAME } from '../../../env';
import { ImageGrid } from "./styles";
import { Image, Transformation } from "cloudinary-react";
import { isDirectImageUrl } from "../../data/dev-mock-user-photos";

interface UserImageGridProperties {
  photoFeatures: Feature[];
  selectPhoto: any;
  onClick: (index?: number) => void;
}

const ImageContainer = styled.section`
  position: relative;
  width: 100%;
  aspect-ratio: 1 / 1;
  display: flex;
  flex-direction: column;
  border-radius: 6px;
  overflow: hidden;
  background: #e9ecef;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.12);
  transition: transform 0.16s ease, box-shadow 0.16s ease;
  cursor: pointer;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.18);
  }
`;
// margin: 1%;


// https://docs.mapbox.com/help/tutorials/building-a-store-locator/#define-interactivity-functions
// fly to item based on ID (appears to require iteration)
// https://medium.com/@krewllobster/extract-visible-features-from-deck-gl-or-react-map-gl-and-store-in-redux-62a65a658b56
// https://docs.mapbox.com/mapbox-gl-js/api/map/#map#queryrenderedfeatures
const UserImageGrid = ({
  photoFeatures,
  selectPhoto,
  onClick
}: UserImageGridProperties) => {
  const handleClick = (event: Event) => {
    // onClickDo(arr.indexOf(parseInt(feature.properties.id))
    // indexOf(parseInt(feature.properties.id)
    if (event.target) {
      //@ts-ignore
      selectPhoto(parseInt(event.target.id));
    }
  };

  return (
    <ImageGrid className="img-grid">
      {photoFeatures &&
        photoFeatures.map((feature, index) => {
            const publicId = feature.properties?.public_id || '';
            const handleSelect = () => {
                selectPhoto(index);
                onClick(index);
            };

            return (
                <ImageContainer key={`${index}`}>
                    {isDirectImageUrl(publicId) ? (
                        <img
                            src={publicId}
                            id={publicId}
                            alt={`User photo ${index + 1}`}
                            onMouseEnter={() => selectPhoto(index)}
                            onClick={handleSelect}
                            style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                                cursor: 'pointer',
                                position: 'relative',
                                display: 'block',
                            }}
                        />
                    ) : (
                        <Image
                            cloudName={CLOUD_NAME}
                            publicId={publicId}
                            id={publicId}
                            onMouseEnter={() => selectPhoto(index)}
                            onClick={handleSelect}
                            style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                                cursor: 'pointer',
                                position: 'relative',
                                display: 'block',
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
                            <Transformation
                                overlay={
                                {fontFamily: "Roboto Mono",
                                fontSize: 20,
                                fontWeight: "bold",
                                text: formatDaysAgoLabel(feature),
                                }}
                                color="#f78102"
                            />
                            <Transformation
                                effect="outline:3"
                                color="white"
                                flags="layer_apply"
                                gravity="south_east"
                                y="10"
                                x="10"
                            />
                        </Image>
                    )}
                </ImageContainer>
            );
        }
    )}
    </ImageGrid>
  );
};

// function makePublicIdFromFeature(feature: Feature<Point>) {
//   return `yvr-user-photos/${feature.geometry.coordinates[1]}${feature.geometry.coordinates[0]}`;
// }

function formatDaysAgoLabel(feature: Feature<Geometry | GeometryCollection, Properties>): string {
    return feature.properties?.created_at_utc?.slice(0,10) || '';
}

export default UserImageGrid;

/**
To get scrolling to work, check if the webpage is narrow, then use a scroll or wheel listener as a hook
https://stackoverflow.com/questions/29725828/update-style-of-a-component-onscroll-in-react-js

and check how far down the scroll page we are
*/
