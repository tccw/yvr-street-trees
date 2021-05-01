import * as React from 'react'
import { heightStringFromID, titleCase } from '../utils'
import styled from 'styled-components'

const StyledTreeInfo = styled.section`
    position: relative;
    top: 1rem;
    width: inheret;
    backgroud: white;
    box-shadow: .2rem .2rem .4rem #c8d0e7, -.2rem -.2rem .5rem white;
    margin: 20px;
    font-size: 13px;
    line-height: 2;
    color: #6b6b76;
    outline: none;
`;

const StyledScientificName = styled.span`
    text-align: left;
    color: #63686a;
    margin-left: 20px;
    font-size: 1.5rem;
    font-style: italic;
    font-weight: 50;
`; 

const TreeDetailsList = styled.ul`
    list-style-type: none
`;

const TreeListElement = styled.li`
    border-bottom: 1px solid lightgrey;
    width: 90%;
    margin-bottom: 1rem;
`;

const TreeDetail = styled.div`
    display: flex;
`;

const TreeDetailKey = styled.span`  
    flex: 1;
    font-weight: bold;
    font-size: 1rem;
    text-align: left;
`;

const TreeDtailValue = styled.span`
    flex: 2;
    text-align: right;
    font-size: 0.9rem;
    color: palegreen;
    float: right;
`;

export const TreeInfoContainer = (props) => {

    const {genus_name, species_name, tree_id, diameter, civic_number, on_street, height_range_id} = props;

    var listValues = {
        'Tree ID Number' : tree_id,
        'Approximate Height' : `${heightStringFromID(height_range_id)}`,
        'Diameter': `${diameter} inches`,
        'Closest Address': `${civic_number} ${on_street}`
    }

    var treeDetails = [];
    for (const [key, value] of Object.entries(listValues)) {
        treeDetails.push(
            <TreeListElement>
                <TreeDetail>
                    <TreeDetailKey>{key}</TreeDetailKey>
                    <TreeDtailValue>{value}</TreeDtailValue>
                </TreeDetail>
            </TreeListElement>
        )
    }

    return (
        <StyledTreeInfo>
            <StyledScientificName>{`${titleCase(genus_name)} ${species_name.toLowerCase()}`}</StyledScientificName>
                <TreeDetailsList>
                    {treeDetails}
                </TreeDetailsList>
        </StyledTreeInfo>    
    ); 

}