import { propertiesContainsFilter } from '@turf/clusters';
import * as React from 'react'
import styled from 'styled-components'
import { titleCase } from '../utils'

const StatsSection = styled.section`
    margin: 0px 20px;
`;

const StatsHeader = styled.h2`
    text-align: left;
    color: #63686a;
    margin-left: 0px;
    margin-bottom: 20px;
    border-bottom: 0.2rem solid #63686a;
    width: -moz-fit-content;
    width: fit-content;
    display: table; 
    text-transform: capitalize;
`;

const Description = styled.p`
    color: #63686a;
    margin-left: inheret;
    margin-top: 0;
    margin-bottom: 20px;
    text-align: justify;
`; 

const StatsGrid = styled.div`
    display: grid;
    grid-template-columns: 1fr 1fr;
    margin: inheret;
`;

const StatsGridItem = styled.div`
    margin: 10px;
`;

const StyledStat = styled.p`
    color: darkgreen;
    font-size: 1.5rem;
    line-height: 1.5rem;
    font-weight: bold;
    margin: 0;
`;

const StatsSubtitle = styled.span`
    color: ${props => (props.color ? props.color : '#63686a')};
    font-weight: ${props => (props.weight ? props.weight : 'bold')};
    font-size: ${props => (props.font_size ? props.font_size : '1')}rem;
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

    return (
        <StatsSection>
            {blurb}
            <StatsHeader> {`${heading} Statistics`} </StatsHeader>
            <StatsGrid>
                <StatsGridItem>
                    <StyledStat>{stats.neigh_num_trees[name].toLocaleString()}</StyledStat>
                    <StatsSubtitle>Mapped Trees</StatsSubtitle>
                </StatsGridItem>
                <StatsGridItem>
                    <StyledStat>{displayStats.numSpecies}</StyledStat>
                    <StatsSubtitle>Total Species</StatsSubtitle>
                </StatsGridItem>
                <StatsGridItem style={{'gridColumn': 'span 2'}}>
                    <StyledStat>{titleCase(displayStats.mostCommonSpecies.treeName)}</StyledStat>
                    <div>
                        <StatsSubtitle>Most Common Species</StatsSubtitle>
                        <br></br>
                        <StatsSubtitle weight='regular' font_size='0.9'>
                        <StatsSubtitle color='darkgreen' weight='regular' font_size='0.9'>{`${displayStats.mostCommonSpecies.count.toLocaleString()} `}</StatsSubtitle> 
                            trees, 
                            <StatsSubtitle color='darkgreen' weight='regular' font_size='0.9'>{` ${Math.round((displayStats.mostCommonSpecies.count / stats.neigh_num_trees[name]) * 100).toFixed(0)}`}</StatsSubtitle>% 
                            of mapped {<b>{titleCase(name)}</b>} trees.
                        </StatsSubtitle>
                    </div>
                </StatsGridItem>
            </StatsGrid>
        </StatsSection>
    )
}

export default React.memo(BoundaryStats);
