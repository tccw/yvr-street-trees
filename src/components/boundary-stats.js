import * as React from 'react'
import styled from 'styled-components'

const StatsSection = styled.section`

`;

const StatsHeader = styled.h2`
    text-align: left;
    color: #63686a;
    margin: 40px 20px;
    border-bottom: 0.2rem solid #63686a;
    width: -moz-fit-content;
    width: fit-content;
    display: table; 
    text-transform: capitalize;
`;

const StatsDisplay = styled.div`

`;

const StyledStat = styled.div`

`;

export const BoundaryStats = ({heading, stats}) => {

    return (
        <StatsSection>
            <StatsHeader> {`${heading} Statistics`} </StatsHeader>
        </StatsSection>

    )
}