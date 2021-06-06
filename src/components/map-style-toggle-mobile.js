import * as React from 'react';
import styled from 'styled-components';
import ParkMapIcon from '../../public/parkmap.svg';
import ContrastMapIcon from '../../public/contrastmap.svg';
import SatelliteMapIcon from '../../public/satellitemap.svg';
import MapLayersIcon from '../../public/layers.svg';
import { useComponentVisible } from '../hooks/useOutsideClick';

const MapLayerIcon = styled.input`
    vertical-align: middle;
    outline-color: none;
    width: ${(props) => (props.size)};
    height: ${(props) => (props.size)};
    margin: ${(props) => (props.margin ? props.margin : '0')};
`;

const MapStyleGrid = styled.div`
    display: grid,
    grid-template-areas:
        'parks contrast satellite'
`;

const MapFigure = styled.figure`
    text-align: center;
    margin: 0;
    text-transform: capitalize;
    font-size: 0.8rem;
`;

export const MobileMapStyleToggle = (props) => {
    const {setStyle, styles} = props;
    const [mapList, setMapList] = React.useState(null)

    const { ref, isComponentVisible, setIsComponentVisible } = useComponentVisible(false);

    const handleClick = () => {
        setIsComponentVisible(true);
    }

    const handleClickMap = (event) => {
        setStyle(event.target.value)
    }

    const iconMap = {
        parks: { icon: ParkMapIcon, url: styles[0] },
        contrast: { icon: ContrastMapIcon, url: styles[1] },
        satellite: { icon: SatelliteMapIcon, url: styles[2] }
    }

    React.useEffect(() => {
        let items = [];
        for (const [key, value] of Object.entries(iconMap)) {
            items.push(
                <li style={{'listStyleType': 'none', 'margin': '6px 0 6px 0'}} key={key} name={key}>
                    <MapFigure>
                        <MapLayerIcon type='image' src={value.icon}
                                        margin='3px 6px'
                                        size='70px'
                                        ariaLabel={`${key}-style`}
                                        value={value.url}
                                        onClick={handleClickMap}/>
                        <figcaption style={{'marginTop': '-5px', 'font-weight': '500'}}>{key}</figcaption>
                    </MapFigure>
                </li>
            )
        }

        setMapList(items);
    }, [])

    return (
        <>
            { isComponentVisible
                ? (
                    <MapStyleGrid ref={ref}>
                        {mapList}
                    </MapStyleGrid>
                  )
                : <MapLayerIcon type='image' size='25px' onClick={handleClick} src={MapLayersIcon} ariaLabel='map-style-layers'/>
            }
        </>
    );
}

