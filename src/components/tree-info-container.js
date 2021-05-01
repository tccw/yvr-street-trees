import * as React from 'react'
import { heightStringFromID, titleCase } from '../utils'
import styled from 'styled-components'

const StyledTreeInfo = styled.div`
    position: relative;
    top: 1rem;
    width: inheret;
    backgroud: white;
    box-shadow: .3rem .3rem .6rem #c8d0e7, -.2rem -.2rem .5rem white;
    margin: 20px;
    font-size: 13px;
    line-height: 2;
    color: #6b6b76;
    outline: none;
`;

const StyledScientificName = styled.h2`
    text-align: left;
    color: #63686a;
    margin-left: 20px;
`; 

export const TreeInfoContainer = (props) => {

    const {genus_name, species_name, common_name, tree_id, diameter, civic_number, on_street, height_range_id, color} = props;

    return (
        <StyledTreeInfo>
            <StyledScientificName>{`${titleCase(genus_name)} ${species_name.toLowerCase()}`}</StyledScientificName>
                <ul>
                    <li>
                        <span>Tree ID</span>
                        <span>{tree_id}</span>
                    </li>
                    <li>
                        <span>Approximate Height</span>
                        <span>{heightStringFromID(height_range_id)}</span>
                    </li>
                    <li>
                        <span>Diameter</span>
                        <span>{`${diameter} inches`}</span>
                    </li>
                    <li>
                        <span>Address</span>
                        <span>{`${civic_number} ${on_street}`}</span>
                    </li>
                </ul>
        </StyledTreeInfo>    
    ); 

}