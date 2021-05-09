import * as React from 'react'
import { heightStringFromID, titleCase, toPrettyDateString} from '../utils'
import styled from 'styled-components'

// margin order is top right bottom left
const StyledTreeInfo = styled.section`
    position: relative;
    top: 1rem;
    width: inheret;
    backgroud: white;
    margin: 0 20px;
    font-size: 13px;
    line-height: 2;
    color: #6b6b76;
    outline: none;
    display: flex;
    flex-direction: column;
`;

const StyledSubText = styled.span`
    text-align: left;
    color: #63686a;
    margin-left: 20px;
    font-size: ${props => (props.font_size)};
    font-style: ${props => (props.font_style)};
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
    font-size: 0.9rem;
    color: darkgreen;   
`;



const TreeInfoContainer = (props) => {

    const {genus_name, species_name, tree_id, 
           diameter, civic_number, on_street, 
           height_range_id, date_planted, common_name,
           neighbourhood_name} = props;

    var listValues = {
        'Tree ID' : tree_id,
        'Height' : `${heightStringFromID(height_range_id)}`,
        'Diameter': `${diameter} inches`,
        'Address': `${civic_number} ${on_street}`,
        'Date Planted': date_planted ? `${toPrettyDateString(date_planted)}` : 'Unknown' 
    }

    var treeDetails = [];
    for (const [key, value] of Object.entries(listValues)) {
        treeDetails.push(
            <TreeListElement key={key}>
                <TreeDetail>
                    <TreeDetailKey>{key}</TreeDetailKey> 
                    <TreeDtailValue>{value}</TreeDtailValue>
                </TreeDetail>
            </TreeListElement>
        )
    }

    const citywidePrevalence = (stats) => {
         let percentage = ((stats.tree_stats[common_name].total_count / stats.city_tree_count) * 100).toFixed(2)
         return formatPrevalanceResult(parseInt(percentage));
    };
    const neighborhoodPrevalance = (stats) => {
        let percentage = ((stats.tree_stats[common_name].neighborhood_counts[neighbourhood_name] / stats.neigh_num_trees[neighbourhood_name]) * 100).toFixed(2);
        return formatPrevalanceResult(parseInt(percentage));
    };

    const formatPrevalanceResult = (percentage) => {
        let result;
        if (percentage < 0.5) {
            result = 'Less than 0.5';
        } else {
            result = percentage >= 1 ? Math.round(percentage).toFixed(0) : percentage.toFixed(2);
        }
        return result;
    }



    return (
        <StyledTreeInfo>
            <StyledSubText font_size='1.5rem' font_style='italic'>
                {`${titleCase(genus_name)} ${species_name.toLowerCase()}`}
            </StyledSubText>
            <StyledSubText font_size='0.8rem' font_style='none'>
                {`${neighborhoodPrevalance(props.stats)}% of ${titleCase(neighbourhood_name)} trees.`}
            </StyledSubText>
            <StyledSubText font_size='0.8rem' font_style='none'>
                {`${citywidePrevalence(props.stats)}% of Vancouver trees.`}
            </StyledSubText>
            <TreeDetailsList>
                {treeDetails}
            </TreeDetailsList>
            {props.children}
        </StyledTreeInfo>    
    ); 
}

export default React.memo(TreeInfoContainer); // look into if memoizing this results in worse performance (or does anything)