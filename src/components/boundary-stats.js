import * as React from 'react'
import styled from 'styled-components'
import { titleCase } from '../utils'

const StatsSection = styled.section`

`;

const StatsHeader = styled.h2`
    text-align: left;
    color: #63686a;
    margin: 0px 20px;
    border-bottom: 0.2rem solid #63686a;
    width: -moz-fit-content;
    width: fit-content;
    display: table; 
    text-transform: capitalize;
`;

const Description = styled.p`
    color: #63686a;
    margin: 30px 20px;
`; 

const StatsDisplay = styled.div`
    display: flex;
    flex-wrap: wrap;
`;

const StyledStat = styled.p`
    color: darkgreen;
    font: 1.5rem;
    lineHeight: 1.5rem;
    fontWeight: bold;
`;

const BoundaryStats = ({name, description, heading, stats}) => {
    // these won't match the hard-coded neighborhood count because 
    // there are many trees without geometry that are not displayed
    name = name.toUpperCase();
    const getStats = () => {
        let result = {mostCommonSpecies: {treeName: '', count: -1}, numSpecies: 0}
        for (const [key, value] of Object.entries(stats.tree_stats)) {
            if (name in value.neighborhood_counts) {
                result.numSpecies++;
                
                if (result.mostCommonSpecies.count < value.neighborhood_counts[name]) { 
                    result.mostCommonSpecies.treeName = key;
                    result.mostCommonSpecies.count = value.neighborhood_counts[name];
                }
            }
        }
        return result;
    }

    const displayStats = React.useMemo(() => getStats(), [name]);

    description = JSON.parse(description);
    let blurb = [];
    for (let i = 0; i < description.length; i++) {
        blurb.push(
            <Description key={i}>
                {description[i]}
            </Description>
        )
    }

    console.log(displayStats);

    return (
        <StatsSection>
            {blurb}
            <StatsHeader> {`${heading} Statistics`} </StatsHeader>
            <StatsDisplay>
                <StyledStat>{titleCase(displayStats.mostCommonSpecies.treeName)}</StyledStat>
                <StyledStat>{stats.neigh_num_trees[name].toLocaleString()}</StyledStat>
            </StatsDisplay>
        </StatsSection>
    )
}

export default React.memo(BoundaryStats);
