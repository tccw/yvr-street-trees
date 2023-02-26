import { Feature, Point } from "@turf/turf";
import * as React from "react";
import styled from "styled-components";
// import { CLOUD_NAME } from '../../env';
import { ImageGrid, ImageWrap, WrappedImage } from "./styles";

interface UserImageGridProperties {
  photoFeatures: Feature[];
  onClickDo: any;
}

// https://docs.mapbox.com/help/tutorials/building-a-store-locator/#define-interactivity-functions
// fly to item based on ID (appears to require iteration)
// https://medium.com/@krewllobster/extract-visible-features-from-deck-gl-or-react-map-gl-and-store-in-redux-62a65a658b56
// https://docs.mapbox.com/mapbox-gl-js/api/map/#map#queryrenderedfeatures
const UserImageGrid = ({
  photoFeatures,
  onClickDo,
}: UserImageGridProperties) => {
  const handleClick = (event: Event) => {
    // onClickDo(arr.indexOf(parseInt(feature.properties.id))
    // indexOf(parseInt(feature.properties.id)
    if (event.target) {
      //@ts-ignore
      onClickDo(parseInt(event.target.id));
    }
  };

  return (
    <ImageGrid className="img-grid">
      {photoFeatures &&
        photoFeatures.map((feature, index) => (
          <ImageWrap className="img-wrap" key={index}>
            <WrappedImage
              //@ts-ignore
              src={feature.properties.image}
              alt="A user added image of trees in Vancouver."
              id={`${index}`}
              onMouseEnter={() => onClickDo(index)}
              onClick={() => onClickDo(index)}
            //   onScroll={onScrollMobile}
            />
            {/* <Image
                            cloudName={CLOUD_NAME}
                            publicId={makePublicIdFromFeature(feature)}
                            style={{
                                minWidth: '100%',
                                minHeight: '100%',
                                maxWidth: '150%',
                                position: 'absolute',
                                top: '50%',
                                left: '50%',
                            }}
                        >
                            <Transformation fetchFormat='auto' quality='auto'/>
                        </Image> */}
          </ImageWrap>
        ))}
    </ImageGrid>
  );
};

function makePublicIdFromFeature(feature: Feature<Point>) {
  return `yvr-user-photos/${feature.geometry.coordinates[1]}${feature.geometry.coordinates[0]}`;
}

export default UserImageGrid;

/**
To get scrolling to work, check if the webpage is narrow, then use a scroll or wheel listener as a hook
https://stackoverflow.com/questions/29725828/update-style-of-a-component-onscroll-in-react-js

and check how far down the scroll page we are
*/
