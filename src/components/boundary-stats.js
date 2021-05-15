import * as React from 'react'
import styled from 'styled-components'

const StatsSection = styled.section`

`;

const StatsHeader = styled.h2`
    text-align: left;
    color: #63686a;
    margin: 20px;
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

`;

const StyledStat = styled.div`

`;

export const BoundaryStats = ({description, heading, stats}) => {
    console.log(description)

    let blerb = [];
    for (let i = 0; i < description.length; i++) {
        blerb.push(
            <Description>
                {description[i]}
            </Description>
        )
    }

    return (
        <StatsSection>
            {blerb}
            <StatsHeader> {`${heading} Statistics`} </StatsHeader>
        </StatsSection>

    )
}