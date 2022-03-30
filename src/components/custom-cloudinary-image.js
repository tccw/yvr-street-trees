import * as React from 'react';
import styled from 'styled-components';
import { Image, Transformation } from 'cloudinary-react';
import { VALID_IMAGE_LIST } from './../../env';
import FALLBACK_IMAGE from '../../public/no_image.png';
import { CLOUD_NAME } from '../../env'


const NoTreeImage = styled.img`
    width: 100px;
    margin: 5% 35% 5% 35%;
`;

const ImageContainer = styled.section`
    position: relative;
    width: inheret;
    margin: 20px;
    display: flex;
    flex-direction: column;
`;

export const CustCloudinaryImage = ({genus_name, species_name, color}) => {

    const cloudinaryImageName = (genus, species) => {
        return `yvr-street-trees/${genus.toLowerCase()}_${species.split(' ')[0].toLowerCase()}`
    }

    let publicId = cloudinaryImageName(genus_name, species_name);

    return (VALID_IMAGE_LIST.has(publicId.split('/')[1])
            ?  (<ImageContainer>
                    <Image cloudName={CLOUD_NAME}
                        publicId={cloudinaryImageName(genus_name, species_name)}
                        >
                            <Transformation fetchFormat='auto'
                                            quality='auto'
                                            border={`2px_solid_rgb:${color.split('#')[1]}`}
                                            radius='5'/>
                    </Image>
                </ImageContainer>)
            : <NoTreeImage src={FALLBACK_IMAGE}/>
            )
}
